import { RoleGate } from "@/components/role/RoleGate";
import { AuthorityOfficialProfile } from "@/components/authority/AuthorityOfficialProfile";

export default function AuthorityProfile() {
  return (
    <RoleGate role="official">
      <AuthorityOfficialProfile />
    </RoleGate>
  );
}
