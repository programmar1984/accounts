import { redirect } from "next/navigation";

export default function NewInvoiceRedirect() {
  redirect("/sales-orders/new");
}
