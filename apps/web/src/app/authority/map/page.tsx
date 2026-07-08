import { RoleGate } from "@/components/role/RoleGate";
import { MapView } from "@/components/map/MapView";

export default function AuthorityMap() {
  return (
    <RoleGate role="official">
      <MapView />
    </RoleGate>
  );
}

