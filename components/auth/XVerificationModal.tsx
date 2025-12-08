"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { usePlayer } from "@/providers/PlayerProvider";
import { useActorServices } from "@/providers/ActorServiceProvider";

interface XVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete?: () => void;
}


export function XVerificationModal({
  isOpen,
  onClose,
  onVerificationComplete,
}: XVerificationModalProps) {
  const [tweetUrl, setTweetUrl] = useState("");
  const [hasOpenedTwitter, setHasOpenedTwitter] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { verificationCode, loadingVerificationCode, fetchVerificationCode } = usePlayer();
  const { playerService } = useActorServices();

  // Fetch verification code when modal opens
  useEffect(() => {
    if (isOpen && !verificationCode && !loadingVerificationCode) {
      fetchVerificationCode();
    }
  }, [isOpen, verificationCode, loadingVerificationCode, fetchVerificationCode]);

  const handleClose = () => {
    setTweetUrl("");
    setHasOpenedTwitter(false);
    setError(null);
    setIsVerifying(false);
    setIsSuccess(false);
    onClose();
  };

  const handleOpenTwitter = () => {
    if (!verificationCode) {
      setError("Verification code not available. Please try again.");
      return;
    }
    // Build tweet with newlines using %0A (URL-encoded newline, not double-encoded)
    const tweetText = `Joining the $BDOG movement!%0AProof-of-Social lets BOB's voice rise…%0A%0AMy code is ${verificationCode} ∞ $ICP`;
    // Encode the text but preserve %0A (replace %250A back to %0A after encoding)
    const encodedText = encodeURIComponent(tweetText).replace(/%250A/g, "%0A");
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(twitterUrl, "_blank");
    setHasOpenedTwitter(true);
    setError(null);
    // Focus input after a short delay to ensure it's rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  /**
   * Extract tweet ID from X/Twitter URL
   * Supports formats:
   * - https://x.com/username/status/1234567890
   * - https://twitter.com/username/status/1234567890
   * - https://x.com/username/status/1234567890?s=20
   */
  const extractTweetId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Find the index of 'status' in the path
      const statusIndex = pathParts.indexOf('status');
      
      // If 'status' is found and there's a value after it, that's the tweet ID
      if (statusIndex !== -1 && statusIndex + 1 < pathParts.length) {
        const tweetId = pathParts[statusIndex + 1];
        // Validate it's a numeric ID
        if (/^\d+$/.test(tweetId)) {
          return tweetId;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const handleVerify = async () => {
    if (!tweetUrl.trim()) {
      return;
    }

    // Extract tweet ID from URL
    const tweetId = extractTweetId(tweetUrl);
    if (!tweetId) {
      setError("Please enter a valid X/Twitter post URL");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await playerService.triggerXVerification(tweetId);
      setIsVerifying(false);
      setIsSuccess(true);
      // Call completion callback after showing success
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || "Verification failed. Please try again.");
      setIsVerifying(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    // Prevent closing when success screen is shown - user must click Close button
    if (!open && isSuccess) {
      return;
    }
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] p-0 border-0 md:border md:border-[#1a1a1a] bg-background rounded-none">
        <div className="p-6 space-y-6">
          {!isSuccess && (
            <DialogHeader>
              <DialogTitle className="text-xl font-bold  uppercase tracking-wider">
                Account Verification
              </DialogTitle>
              <DialogDescription className="text-sm text-foreground pt-2">
                Make a post on X and copy its link to complete the process.
              </DialogDescription>
            </DialogHeader>
          )}

          {isSuccess ? (
            // Success Screen
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-[#00ff9e] flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-black" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-[#00ff9e] uppercase tracking-wider">
                    Verification Successful
                  </h3>
                  <p className="text-sm text-foreground">
                    Your X account has been successfully verified!
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleClose}
                className="w-full"
              >
                Close
              </Button>
            </div>
          ) : (
            // Verification Form
            <div className="space-y-4">
              {error && (
                <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-none">
                  {error}
                </div>
              )}

              <Button
                variant={hasOpenedTwitter ? "secondary" : "primary"}
                onClick={handleOpenTwitter}
                disabled={loadingVerificationCode || !verificationCode}
                className="w-full gap-2"
              >
                {loadingVerificationCode ? (
                  "Loading..."
                ) : (
                  <>
                    Post on
                    <Image
                      src="/images/X_black.png"
                      alt="X"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  </>
                )}
              </Button>

              <div className="flex gap-3 items-center">
                <Input
                  ref={inputRef}
                  type="url"
                  placeholder="https://twitter.com/username/status/..."
                  value={tweetUrl}
                  onChange={(e) => {
                    setTweetUrl(e.target.value);
                    setError(null);
                  }}
                  className="flex-1 h-11 bg-transparent border-[#1a1a1a] rounded-none focus:border-[#00ff9e]"
                  disabled={isVerifying}
                />
                <Button
                  variant={hasOpenedTwitter ? "primary" : "secondary"}
                  onClick={handleVerify}
                  disabled={!tweetUrl.trim() || isVerifying}
                  className={hasOpenedTwitter ? "h-11" : "h-11 bg-white text-black hover:bg-gray-100"}
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

