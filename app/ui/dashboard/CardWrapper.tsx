import { fetchCardData } from "@/app/lib/data";
import { Card } from "./cards";

export default async function CardWrapper() {
  const data = await fetchCardData();

  const { numberOfInvoices, numberOfCustomers, totalPaidInvoices, totalPendingInvoices } = data;
  return (
    <>
      {/* NOTE: comment in this code when you get to this point in the course */}

      <Card title="Collected" value={totalPaidInvoices} type="collected" />
      <Card title="Pending" value={totalPendingInvoices} type="pending" />
      <Card title="Total Invoices" value={numberOfInvoices} type="invoices" />
      <Card title="Total Customers" value={numberOfCustomers} type="customers" />
    </>
  );
}
