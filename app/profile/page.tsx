"use client";

import { AccountNavigation } from "@/components/layout/nav";
import { ProfileCard } from "@/components/profile";
import { useAuthStore } from "@/store/auth-store";
import { AccessRequired } from "@/components/auth/AccessRequired";

export default function ProfilePage() {
  const { isInitialized, isAuthenticated } = useAuthStore();

  // Show loading while auth is initializing
  if (!isInitialized) {
    return null; // AuthProvider handles loading overlay
  }

  // Show access required message if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <AccessRequired message="Please connect your wallet to access the profile page." />
        <AccountNavigation />
      </>
    );
  }

  // Render profile component when authenticated
  return (
    <>
      <ProfileCard />
      <AccountNavigation />
    </>
  );
}
