import { RoleGate } from "@/components/role/RoleGate";
import { LiveFeed } from "@/components/feed/LiveFeed";

export default function MpFeedPage() {
  return (
    <RoleGate role="mp">
      <div className="py-5 sm:py-6 lg:py-8">
        <LiveFeed />
      </div>
    </RoleGate>
  );
}

