import { RoleGate } from "@/components/role/RoleGate";
import { MapView } from "@/components/map/MapView";

export default function MpMap() {
  return (
    <RoleGate role="mp">
      <MapView />
    </RoleGate>
  );
}

