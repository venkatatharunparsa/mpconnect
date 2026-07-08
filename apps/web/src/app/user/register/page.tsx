import { RoleGate } from "@/components/role/RoleGate";
import { RegisterIssueForm } from "@/components/citizen/RegisterIssueForm";

export default function UserRegister() {
  return (
    <RoleGate role="citizen">
      <RegisterIssueForm />
    </RoleGate>
  );
}

