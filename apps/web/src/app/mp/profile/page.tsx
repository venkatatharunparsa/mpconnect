import { RoleGate } from "@/components/role/RoleGate";
import { ProfileView } from "@/components/profile/ProfileView";

export default function MpProfile() {
  return (
    <RoleGate role="mp">
      <ProfileView role="mp" />
    </RoleGate>
  );
}
