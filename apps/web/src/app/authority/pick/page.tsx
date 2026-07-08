import { RoleGate } from "@/components/role/RoleGate";
import { AuthorityPicker } from "@/components/authority/AuthorityPicker";

export default function AuthorityPickPage() {
  return (
    <RoleGate role="official">
      <AuthorityPicker />
    </RoleGate>
  );
}
