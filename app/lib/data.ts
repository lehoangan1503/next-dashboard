import { db } from "./db";
import { count, desc, sum, sql, eq, ilike, or, Column } from "drizzle-orm";
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
  Invoice,
  Customer,
} from "@/app/lib/drizzle/schema";
import { formatCurrency } from "./utils";
import { unstable_noStore as noStore } from "next/cache";

export async function fetchRevenue() {
  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).

  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log("Fetching revenue data...");
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await db.select().from(Revenue);
    console.log("Data fetch completed after 3 seconds.");

    const revenues = data.map((item) => {
      return { ...item, revenue: Number(item.revenue) };
    });
    return revenues as Revenue[];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await db.query.Invoice.findMany({
      columns: {
        amount: true,
        id: true,
      },
      with: {
        customer: {
          columns: {
            name: true,
            image_url: true,
            email: true,
          },
        },
      },
      orderBy: (Invoice, { desc }) => [desc(Invoice.date)],
      limit: 5,
    });

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      ...invoice.customer,
      amount: formatCurrency(Number(invoice.amount)),
    }));
    return latestInvoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the latest invoices.");
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = db.select({ count: count() }).from(Invoice);
    const customerCountPromise = db.select({ count: count() }).from(Customer);
    const invoiceStatusPromise = db
      .select({
        paid: sum(sql`CASE WHEN status = 'paid' THEN amount ELSE 0 END`),
        pending: sum(sql`CASE WHEN status = 'pending' THEN amount ELSE 0 END`),
      })
      .from(Invoice);

    const data = await Promise.all([invoiceCountPromise, customerCountPromise, invoiceStatusPromise]);

    const numberOfInvoices = data[0][0].count;
    const numberOfCustomers = data[1][0].count;
    const totalPaidInvoices = formatCurrency(Number(data[2][0].paid));
    const totalPendingInvoices = formatCurrency(Number(data[2][0].pending));
    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await db
      .select({
        id: Invoice.id,
        amount: Invoice.amount,
        date: Invoice.date,
        status: Invoice.status,
        name: Customer.name,
        email: Customer.email,
        image_url: Customer.image_url,
      })
      .from(Invoice)
      .innerJoin(Customer, eq(Invoice.customer_id, Customer.id))
      .where(
        or(
          ilike(Customer.name, `%${query}%`),
          ilike(Customer.email, `%${query}%`),
          ilike(sql`${Invoice.amount}::text` as unknown as Column, `%${query}%`),
          ilike(sql`${Invoice.date}::text` as unknown as Column, `%${query}%`),
          ilike(sql`${Invoice.status}::text` as unknown as Column, `%${query}%`)
        )
      )
      .orderBy(sql`invoices.date DESC`)
      .limit(ITEMS_PER_PAGE)
      .offset(offset);

    return invoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const counter = await db
      .select({ count: count() })
      .from(Invoice)
      .innerJoin(Customer, eq(Invoice.customer_id, Customer.id))
      .where(
        or(
          ilike(Customer.name, `%${query}%`),
          ilike(Customer.email, `%${query}%`),
          ilike(sql`${Invoice.amount}::text` as unknown as Column, `%${query}%`),
          ilike(sql`${Invoice.date}::text` as unknown as Column, `%${query}%`),
          ilike(sql`${Invoice.status}::text` as unknown as Column, `%${query}%`)
        )
      );
    const totalPages = Math.ceil(Number(counter[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of invoices.");
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await db
      .select({
        id: Invoice.id,
        customer_id: Invoice.customer_id,
        amount: Invoice.amount,
        status: Invoice.status,
      })
      .from(Invoice)
      .where(eq(Invoice.id, id));

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: Number(invoice.amount) / 100,
    }));

    return invoice;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoice.");
  }
}

export async function fetchCustomers() {
  try {
    const data: CustomerField[] = await db
      .select({ id: Customer.id, name: Customer.name })
      .from(Customer)
      .orderBy(sql`name ASC`);

    return data;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await db
      .select({
        id: Customer.id,
        name: Customer.name,
        email: Customer.email,
        image_url: Customer.image_url,
        total_invoices: count(Invoice.id),
        total_pending: sum(sql`CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END`),
        total_paid: sum(sql`CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END`),
      })
      .from(Customer)
      .leftJoin(Invoice, eq(Customer.id, Invoice.customer_id))
      .where(or(ilike(Customer.name, `%${query}%`), ilike(Customer.email, `%${query}%`)))
      .groupBy(Customer.id, Customer.name, Customer.email, Customer.image_url)
      .orderBy(sql`${Customer.name} ASC`);
    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(Number(customer.total_pending)),
      total_paid: formatCurrency(Number(customer.total_paid)),
    }));

    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch customer table.");
  }
}

export async function getUser(email: string) {
  try {
    const user = await db.select().from(User).where(eq(User.email, email));

    return user[0] as User;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}
