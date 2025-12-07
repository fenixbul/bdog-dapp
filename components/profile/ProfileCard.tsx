"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/store/auth-store";
import { usePlayer } from "@/providers/PlayerProvider";
import { XVerificationModal } from "@/components/auth";

/**
 * Format principal ID for display
 */
function formatPrincipal(principal: string | null, length: number = 6): string {
  if (!principal) return "@user";
  if (principal.length <= length * 2) {
    return `@${principal}`;
  }
  return `@${principal.slice(0, length)}...${principal.slice(-length)}`;
}

export function ProfileCard() {
  const { principalId } = useAuthStore();
  const { player, loading, refetch } = usePlayer();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Get X verification data
  const isXVerified = player?.is_x_verified ?? false;
  const xData =
    player?.x_data && player.x_data.length > 0 ? player.x_data[0] : null;
  const xUsername = xData?.username;
  const avatarUrl = xData?.avatar;

  // Determine display username
  const displayUsername =
    isXVerified && xUsername
      ? `@${xUsername}`
      : formatPrincipal(principalId, 6);

  // Get avatar fallback initial
  const avatarInitial = displayUsername.charAt(1).toUpperCase();

  const handleVerifyTwitter = () => {
    setShowVerificationModal(true);
  };

  const handleVerificationComplete = async () => {
    // Refetch player data to get updated verification status
    await refetch();
    setShowVerificationModal(false);
  };

  return (
    <div className="flex justify-center bg-background">
      {/* App Container */}
      <div className="w-full max-w-md relative overflow-hidden shadow-xl bg-card" >
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 backdrop-blur-md border-b border-border bg-card/80">
          <div className="h-14 flex items-center justify-center">
            <h1 className="text-lg font-bold uppercase tracking-wider text-foreground">
              Profile
            </h1>
          </div>
        </header>

        {/* Profile Content */}
        <div className="flex flex-col items-center mt-10">
          {/* Avatar and Username */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-8 w-8 border-2 border-border flex-shrink-0">
                <AvatarImage src={avatarUrl || ""} alt={displayUsername} />
                <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isXVerified && xUsername ? (
                  <>
                    <h2 className="text-base font-semibold text-foreground truncate">
                      @{xUsername}
                    </h2>
                    <Badge
                      variant="default"
                      className="bg-[#00ff9e] hover:bg-[#00e68a] text-black border-0 rounded-full p-0 w-4 h-4 flex items-center justify-center flex-shrink-0 "
                    >
                      <Check className="h-3 w-3" />
                    </Badge>
                  </>
                ) : (
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {displayUsername}
                  </h2>
                )}
              </div>
            </div>
          </div>

          {/* X Verification */}
          {player && !loading && !isXVerified && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyTwitter}
                className="gap-2 bg-gradient-horizontal-animated text-white"
              >
                <Image
                  src="/images/X.png"
                  alt="X"
                  width={16}
                  height={16}
                  className="h-5 w-5"
                />
                <span className="text-base font-normal">Verify Account</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* X Verification Modal */}
      <XVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  );
}
