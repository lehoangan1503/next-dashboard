"use server";
import { z } from "zod";
import { db } from "./db";
import { addInvoice, editInvoice, deleteInvoice } from "./data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Invoice } from "./drizzle/schema";
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: rawFormData.customerId,
    amount: rawFormData.amount,
    status: rawFormData.status,
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString();

  try {
    await db.insert(Invoice).values({
      customer_id: customerId,
      amount: amountInCents,
      status: status,
      date: date,
    } as any);

    return console.log("Create Invoice Successfully.");
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices ");
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  await editInvoice(
    {
      customer_id: customerId,
      amount: amountInCents,
      status: status,
    },
    id
  );

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
export async function deleteInvoiceAction(id: string) {
  deleteInvoice(id);

  revalidatePath("/dashboard/invoices");
}
