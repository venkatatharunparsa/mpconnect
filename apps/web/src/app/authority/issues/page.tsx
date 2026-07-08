import { redirect } from "next/navigation";

export default function AuthorityIssuesRedirect() {
  redirect("/authority/workspace");
}
