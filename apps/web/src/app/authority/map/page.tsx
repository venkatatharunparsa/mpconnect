import { RoleGate } from "@/components/role/RoleGate";
import { AuthorityMapView } from "@/components/authority/AuthorityMapView";

export default function AuthorityMap() {
  return (
    <RoleGate role="official">
      <AuthorityMapView />
    </RoleGate>
  );
}

