import { RoleGate } from "@/components/role/RoleGate";
import { ProfileView } from "@/components/profile/ProfileView";

export default function UserProfile() {
  return (
    <RoleGate role="citizen">
      <ProfileView role="citizen" />
    </RoleGate>
  );
}
