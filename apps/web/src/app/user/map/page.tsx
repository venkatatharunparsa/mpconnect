import { RoleGate } from "@/components/role/RoleGate";
import { MapView } from "@/components/map/MapView";

export default function UserMap() {
  return (
    <RoleGate role="citizen">
      <MapView />
    </RoleGate>
  );
}

