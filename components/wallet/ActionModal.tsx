"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeft, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Token } from "@/store/wallet-store";
import type { TokenService } from "@/lib/token/tokenService";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { HttpAgent } from "@dfinity/agent";
import { useAuthStore } from "@/store/auth-store";
import { useWalletStore } from "@/store/wallet-store";
import { TokenIcon } from "./TokenIcon";
import { TokenSelectionScreen } from "./TokenSelectionScreen";
import { ICP_CANISTER_ID } from "@/lib/wallet/constants";
import { formatAmount } from "@/lib/utils";
import { validateAddress } from "@/lib/wallet/addressValidation";
import { icpLedgerStore } from "@/lib/token/icpLedgerStore";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: "deposit" | "withdraw";
  token: Token | null;
  tokenService: TokenService | null;
  onSuccess: () => void;
}

type DepositStep = "select-token" | "show-qr";
type WithdrawStep = "select-token" | "show-form";

export function ActionModal({
  isOpen,
  onClose,
  action,
  token,
  tokenService,
  onSuccess,
}: ActionModalProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositStep, setDepositStep] = useState<DepositStep>("select-token");
  const [withdrawStep, setWithdrawStep] =
    useState<WithdrawStep>("select-token");
  const [selectedTokenForDeposit, setSelectedTokenForDeposit] =
    useState<Token | null>(null);
  const [selectedTokenForWithdraw, setSelectedTokenForWithdraw] =
    useState<Token | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [usePrincipalId, setUsePrincipalId] = useState(false);

  const { identity, accountId, principalId } = useAuthStore();
  const { tokens } = useWalletStore();

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setRecipient("");
      setError(null);
      setDepositStep("select-token");
      setWithdrawStep("select-token");
      setSelectedTokenForDeposit(null);
      setSelectedTokenForWithdraw(null);
      setCopiedAddress(null);
      setUsePrincipalId(false);
    } else if (isOpen && action === "withdraw" && token) {
      // If token is pre-selected (from TokenItem click), skip selection
      setSelectedTokenForWithdraw(token);
      setWithdrawStep("show-form");
    } else if (isOpen && action === "withdraw" && !token) {
      // If no token pre-selected, show selection
      setWithdrawStep("select-token");
      setSelectedTokenForWithdraw(null);
    }
  }, [isOpen, action, token]);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleTokenSelectForDeposit = (selectedToken: Token) => {
    setSelectedTokenForDeposit(selectedToken);
    setDepositStep("show-qr");
  };

  const handleTokenSelectForWithdraw = (selectedToken: Token) => {
    setSelectedTokenForWithdraw(selectedToken);
    setWithdrawStep("show-form");
  };

  const handleBackToTokenSelection = () => {
    if (action === "deposit") {
      setDepositStep("select-token");
      setSelectedTokenForDeposit(null);
    } else {
      setWithdrawStep("select-token");
      setSelectedTokenForWithdraw(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (action === "deposit") {
      // Deposit handled by QR code flow
      return;
    }

    // Withdraw requires selectedTokenForWithdraw and tokenService
    const withdrawToken = selectedTokenForWithdraw || token;
    if (!withdrawToken || !tokenService || !identity) {
      setError("Missing required data");
      return;
    }

    // Withdraw action
    if (!amount || !recipient) {
      setError("Please fill in all fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountNum > withdrawToken.balance) {
      setError("Insufficient balance");
      return;
    }

    // Check if withdrawing ICP
    const isICPWithdraw = withdrawToken.id === ICP_CANISTER_ID;

    // Validate address (Principal ID or Account ID for ICP)
    const addressValidation = validateAddress(recipient.trim());
    if (!addressValidation.isValid) {
      setError(
        isICPWithdraw
          ? "Invalid address. Please enter a valid Principal ID or Account ID"
          : "Invalid principal ID"
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const senderPrincipal = identity.getPrincipal();
      const amountBigInt = BigInt(
        Math.floor(amountNum * Math.pow(10, withdrawToken.decimals))
      );

      // If ICP and Account ID, use ICP Ledger
      if (isICPWithdraw && addressValidation.type === "account") {
        const agent = new HttpAgent({
          identity,
          host:
            process.env.DFX_NETWORK === "ic" || true // Always use icp0.io for now
              ? "https://icp0.io"
              : "http://localhost:4943",
        });
        const icpCanisterId = Principal.fromText(ICP_CANISTER_ID);
        const ledgerCanister = await icpLedgerStore.getCanister(
          agent,
          icpCanisterId
        );

        const accountIdentifier = AccountIdentifier.fromHex(recipient.trim());

        await ledgerCanister.transfer({
          to: accountIdentifier,
          amount: amountBigInt,
        });

        onSuccess();
        onClose();
      } else {
        // For Principal ID (ICP or other tokens), use ICRC ledger
        let recipientPrincipal: Principal;
        if (addressValidation.type === "principal") {
          recipientPrincipal = Principal.fromText(recipient.trim());
        } else {
          // This shouldn't happen, but handle gracefully
          setError("Invalid address format");
          setIsLoading(false);
          return;
        }

        await tokenService.transfer(withdrawToken.canisterId, {
          to: {
            owner: recipientPrincipal,
            subaccount: [],
          },
          amount: amountBigInt,
        });

        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Transfer error:", err);
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic reactive isICP check based on current action
  const isICP =
    action === "deposit"
      ? selectedTokenForDeposit?.id === ICP_CANISTER_ID
      : (selectedTokenForWithdraw || token)?.id === ICP_CANISTER_ID;

  // Render Token Selection Screen (for both deposit and withdraw)
  const showTokenSelection =
    (action === "deposit" && depositStep === "select-token") ||
    (action === "withdraw" && withdrawStep === "select-token");

  if (showTokenSelection) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 backdrop-blur-sm bg-black/50 z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl shadow-xl"
            >
              <TokenSelectionScreen
                title={
                  action === "deposit"
                    ? "Select Token to Deposit"
                    : "Select Token to Withdraw"
                }
                tokens={tokens}
                onTokenSelect={
                  action === "deposit"
                    ? handleTokenSelectForDeposit
                    : handleTokenSelectForWithdraw
                }
                onClose={onClose}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Render QR Code Screen for Deposit
  if (
    action === "deposit" &&
    depositStep === "show-qr" &&
    selectedTokenForDeposit
  ) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 backdrop-blur-sm bg-black/50 z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl shadow-xl"
            >
              <div className="p-6 max-h-[80vh] max-w-md mx-auto overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToTokenSelection}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-bold text-foreground uppercase tracking-wider">
                      Deposit {selectedTokenForDeposit.symbol}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* QR Code Display */}
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground mb-2">
                        {isICP
                          ? usePrincipalId
                            ? "Principal ID"
                            : "Account ID"
                          : "Deposit Address"}
                      </p>
                      <div className="flex justify-center p-4 rounded-lg">
                        <QRCodeSVG
                          value={
                            isICP && usePrincipalId
                              ? principalId!
                              : isICP
                              ? accountId!
                              : principalId!
                          }
                          size={200}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <p className="text-xs text-muted-foreground font-mono break-all px-2">
                          {isICP && usePrincipalId
                            ? principalId
                            : isICP
                            ? accountId
                            : principalId}
                        </p>
                        <button
                          onClick={() =>
                            handleCopyAddress(
                              isICP && usePrincipalId
                                ? principalId!
                                : isICP
                                ? accountId!
                                : principalId!
                            )
                          }
                          className="p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
                          title="Copy address"
                        >
                          {copiedAddress ===
                          (isICP && usePrincipalId
                            ? principalId
                            : isICP
                            ? accountId
                            : principalId) ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Toggle for ICP */}
                    {isICP && accountId && (
                      <div className="text-center">
                        <button
                          onClick={() => setUsePrincipalId(!usePrincipalId)}
                          className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                        >
                          {usePrincipalId
                            ? "Show Account ID"
                            : "Show Principal ID"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Render Withdraw Form
  const showWithdrawForm =
    action === "withdraw" &&
    (withdrawStep === "show-form" ||
      (token && withdrawStep === "select-token"));

  if (showWithdrawForm) {
    const withdrawToken = selectedTokenForWithdraw || token;

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 backdrop-blur-sm bg-black/50 z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl shadow-xl"
            >
              <div className="p-6 max-h-[80vh] overflow-y-auto max-w-md mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {!token && (
                      <button
                        onClick={handleBackToTokenSelection}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                    )}
                    <h2 className="text-xl font-bold text-foreground uppercase tracking-wider">
                      Withdraw {withdrawToken?.symbol || "Token"}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="recipient"
                      className="text-sm font-medium uppercase tracking-wider"
                    >
                      {isICP && action === "withdraw"
                        ? "Account ID / Principal ID"
                        : "Recipient Principal ID"}
                    </Label>
                    <Input
                      id="recipient"
                      type="text"
                      placeholder={
                        isICP && action === "withdraw"
                          ? "Account ID / Principal ID"
                          : "Enter Principal ID"
                      }
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      disabled={isLoading}
                      className="bg-input border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="amount"
                      className="text-sm font-medium uppercase tracking-wider"
                    >
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isLoading}
                      className="bg-input border-border"
                    />
                    {withdrawToken && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          Available: {formatAmount(withdrawToken.balance)}{" "}
                          {withdrawToken.symbol}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            // Subtract fee from balance to ensure transfer succeeds
                            const maxAmount = Math.max(
                              0,
                              withdrawToken.balance - withdrawToken.fee
                            );
                            setAmount(maxAmount.toString());
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          (MAX)
                        </button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Processing..." : "Withdraw"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Fallback - should not reach here
  return null;
}
