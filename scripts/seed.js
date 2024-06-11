import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import {
  invoices,
  customers,
  revenue,
  users,
} from '../app/lib/placeholder-data.js';
import {
  pgTable,
  varchar,
  text,
  numeric,
  date,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core';

const invoiceStatusEnum = pgEnum('invoice_status', ['pending', 'paid']);
// User table
const User = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: text('password').notNull(),
});

// Customer table
const Customer = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  image_url: varchar('image_url', { length: 255 }).notNull(),
});

// Invoice table
const Invoice = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  customer_id: uuid('customer_id')
    .references(() => Customer.id)
    .notNull(),
  amount: numeric('amount').notNull(),
  date: date('date').notNull(),
  status: invoiceStatusEnum('status').notNull(),
});

// Revenue table
const Revenue = pgTable('revenues', {
  month: varchar('month', { length: 255 }).primaryKey(),
  revenue: numeric('revenue').notNull(),
});

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DB_URL,
});

const db = drizzle(pool);

async function seedUsers() {
  try {
    // Insert data into the "users" table

    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        return db.insert(User).values({ ...user, password: hashedPassword });
      }),
    );

    console.log(`Seeded ${insertedUsers.length} users`);

    return {
      users: insertedUsers,
    };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function seedInvoices() {
  try {
    // Insert data into the "invoices" table
    const insertedInvoices = await Promise.all(
      invoices.map((invoice) => db.insert(Invoice).values(invoice)),
    );

    console.log(`Seeded ${insertedInvoices.length} invoices`);

    return {
      invoices: insertedInvoices,
    };
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

async function seedCustomers() {
  try {
    // Insert data into the "customers" table
    const insertedCustomers = await Promise.all(
      customers.map((customer) => db.insert(Customer).values(customer)),
    );

    console.log(`Seeded ${insertedCustomers.length} customers`);

    return {
      customers: insertedCustomers,
    };
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedRevenue() {
  try {
    // Insert data into the "revenue" table
    const insertedRevenue = await Promise.all(
      revenue.map((rev) => db.insert(Revenue).values(rev)),
    );

    console.log(`Seeded ${insertedRevenue.length} revenue`);

    return {
      revenue: insertedRevenue,
    };
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

async function main() {
  await seedUsers();
  await seedCustomers();
  await seedInvoices();
  await seedRevenue();
}

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
});
