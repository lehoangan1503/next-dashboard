import { UUID } from "crypto";
import { relations } from "drizzle-orm";
import { pgTable, serial, varchar, text, numeric, date, pgEnum, uuid } from "drizzle-orm/pg-core";
// Enum for invoice status
export const invoiceStatusEnum = pgEnum("invoice_status", ["pending", "paid"]);

// User table
export const User = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: text("password").notNull(),
});

// Customer table
export const Customer = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  image_url: varchar("image_url", { length: 255 }).notNull(),
});

// Invoice table
export const Invoice = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  customer_id: uuid("customer_id")
    .references(() => Customer.id)
    .notNull(),
  amount: numeric("amount").notNull(),
  date: date("date").notNull(),
  status: invoiceStatusEnum("status").notNull(),
});

// Revenue table
export const Revenue = pgTable("revenues", {
  month: varchar("month", { length: 255 }).primaryKey(),
  revenue: numeric("revenue").notNull(),
});

// TypeScript type definitions
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  image_url: string;
};

export type Invoice = {
  id: UUID;
  customer_id: string;
  amount: number;
  date: string;
  status: "pending" | "paid";
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, "amount"> & {
  amount: number;
};

export type InvoicesTable = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  image_url: string;
  date: string;
  amount: number;
  status: "pending" | "paid";
};

export type CustomersTableType = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};

export type FormattedCustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type CustomerField = {
  id: string;
  name: string;
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: "pending" | "paid";
};
// relations scheme
export const CustomerRelation = relations(Customer, ({ many }) => ({
  invoices: many(Invoice),
}));
export const InvoiceRelation = relations(Invoice, ({ one }) => ({
  customer: one(Customer, {
    fields: [Invoice.customer_id],
    references: [Customer.id],
  }),
}));
