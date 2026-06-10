import { redirect } from "next/navigation";

export default function TransactionDetailRedirect() {
  redirect("/ledger");
}
