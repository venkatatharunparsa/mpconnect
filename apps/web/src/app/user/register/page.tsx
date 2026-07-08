import { RoleGate } from "@/components/role/RoleGate";
import SubmitPage from "@/client/components/submit-page";

export default function UserRegister() {
  return (
    <RoleGate role="citizen">
      <SubmitPage />
    </RoleGate>
  );
}

