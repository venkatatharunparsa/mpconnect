import { RoleGate } from "@/components/role/RoleGate";
import { ReviewConsole } from "@/components/review/ReviewConsole";

export default function AuthorityWorkspace() {
  return (
    <RoleGate role="official">
      <ReviewConsole />
    </RoleGate>
  );
}

