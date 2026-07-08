"use client";

import { useAuthority } from "@/components/authority/AuthorityContext";
import { ProfileView } from "@/components/profile/ProfileView";

export function AuthorityOfficialProfile() {
  const { authority } = useAuthority();
  return <ProfileView role="official" authority={authority} />;
}
