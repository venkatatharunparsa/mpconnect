import { RoleGate } from "@/components/role/RoleGate";
import { ProfileView } from "@/components/profile/ProfileView";

export default function AuthorityProfile() {
  return (
    <RoleGate role="official">
      <ProfileView role="official" />
    </RoleGate>
  );
}
