import { AuthorityProvider } from "@/components/authority/AuthorityContext";
import { AuthorityGate } from "@/components/authority/AuthorityGate";

export default function AuthorityLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthorityProvider>
      <AuthorityGate>{children}</AuthorityGate>
    </AuthorityProvider>
  );
}
