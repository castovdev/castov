"use client";

import { useState } from "react";
import { LockIcon, KeyRoundIcon, ShieldAlertIcon, CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react";

interface TeamVaultPassphraseModalProps {
  isOpen: boolean;
  mode: "unlock" | "setup" | "recovery";
  error?: string;
  isProcessing?: boolean;
  recoveryKeyGenerated?: string;
  onUnlock: (passphrase: string) => Promise<void>;
  onSetup: (passphrase: string) => Promise<void>;
  onRecover: (recoveryKey: string) => Promise<void>;
  onClose?: () => void;
}

export function TeamVaultPassphraseModal({
  isOpen,
  mode: initialMode,
  error: parentError,
  isProcessing = false,
  recoveryKeyGenerated,
  onUnlock,
  onSetup,
  onRecover,
  onClose,
}: TeamVaultPassphraseModalProps) {
  const [currentMode, setCurrentMode] = useState<"unlock" | "setup" | "recovery">(initialMode);
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [recoveryKeyInput, setRecoveryKeyInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [localError, setLocalError] = useState("");

  if (!isOpen) return null;

  const errorMessage = localError || parentError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (currentMode === "unlock") {
      if (!passphrase) {
        setLocalError("Please enter your Master Passphrase.");
        return;
      }
      await onUnlock(passphrase);
    } else if (currentMode === "setup") {
      if (passphrase.length < 8) {
        setLocalError("Passphrase must be at least 8 characters long.");
        return;
      }
      if (passphrase !== confirmPassphrase) {
        setLocalError("Passphrases do not match.");
        return;
      }
      await onSetup(passphrase);
    } else if (currentMode === "recovery") {
      if (!recoveryKeyInput || recoveryKeyInput.trim().length !== 64) {
        setLocalError("Please enter a valid 64-character Emergency Recovery Key.");
        return;
      }
      await onRecover(recoveryKeyInput.trim());
    }
  };

  const copyRecoveryKey = () => {
    if (!recoveryKeyGenerated) return;
    navigator.clipboard.writeText(recoveryKeyGenerated);
    setCopiedRecovery(true);
    setTimeout(() => setCopiedRecovery(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-line rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-fg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            {currentMode === "recovery" ? <KeyRoundIcon size={20} /> : <LockIcon size={20} />}
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {currentMode === "setup" && "Create Master Passphrase"}
              {currentMode === "unlock" && "Unlock Team Workspaces"}
              {currentMode === "recovery" && "Emergency Key Recovery"}
            </h2>
            <p className="text-xs text-muted">
              {currentMode === "setup" && "600,000 PBKDF2 Iterations · Zero-Knowledge Protection"}
              {currentMode === "unlock" && "Decrypted in local browser memory (extractable: false)"}
              {currentMode === "recovery" && "Restore private key without your passphrase"}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 flex items-start gap-2 text-danger text-xs mb-4">
            <ShieldAlertIcon size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {currentMode === "setup" && (
            <>
              {recoveryKeyGenerated && (
                <div className="bg-field border border-amber-500/30 rounded-xl p-3.5 mb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                      ⚠️ Emergency Recovery Key
                    </span>
                    <button
                      type="button"
                      onClick={copyRecoveryKey}
                      className="text-xs flex items-center gap-1 text-muted hover:text-fg font-medium"
                    >
                      {copiedRecovery ? <CheckIcon size={13} className="text-success" /> : <CopyIcon size={13} />}
                      {copiedRecovery ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted mb-2 font-mono break-all select-all bg-card p-2 rounded border border-line">
                    {recoveryKeyGenerated}
                  </p>
                  <p className="text-[10px] text-muted leading-tight">
                    Store this offline in a safe password manager. If you forget your passphrase, this is the only way to recover your team keys.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Choose Master Passphrase (min 8 chars)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter strong passphrase..."
                    required
                    className="w-full bg-field border border-line rounded-lg px-3.5 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted hover:text-fg"
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Confirm Master Passphrase
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Repeat passphrase..."
                  required
                  className="w-full bg-field border border-line rounded-lg px-3.5 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 font-mono"
                />
              </div>
            </>
          )}

          {currentMode === "unlock" && (
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Master Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter your master passphrase..."
                  autoFocus
                  required
                  className="w-full bg-field border border-line rounded-lg px-3.5 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted hover:text-fg"
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>
          )}

          {currentMode === "recovery" && (
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                64-Character Emergency Recovery Key
              </label>
              <textarea
                value={recoveryKeyInput}
                onChange={(e) => setRecoveryKeyInput(e.target.value)}
                placeholder="Paste your 64-character recovery hex key here..."
                rows={3}
                required
                className="w-full bg-field border border-line rounded-lg p-3 text-xs text-fg focus:outline-none focus:border-primary/50 font-mono resize-none leading-relaxed"
              />
            </div>
          )}

          <div className="flex gap-2 mt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-field hover:bg-hover text-muted hover:text-fg rounded-lg text-xs font-semibold border border-line transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white dark:text-[#050505] rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isProcessing
                ? "Processing..."
                : currentMode === "setup"
                ? "Initialize Key & Continue"
                : currentMode === "unlock"
                ? "Unlock Workspace"
                : "Recover Key"}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-line flex justify-between items-center text-[11px] text-muted">
          {currentMode === "unlock" ? (
            <button
              type="button"
              onClick={() => {
                setLocalError("");
                setCurrentMode("recovery");
              }}
              className="text-primary hover:underline font-medium"
            >
              Forgot passphrase? Use Recovery Key
            </button>
          ) : currentMode === "recovery" ? (
            <button
              type="button"
              onClick={() => {
                setLocalError("");
                setCurrentMode("unlock");
              }}
              className="text-primary hover:underline font-medium"
            >
              &larr; Back to Passphrase Unlock
            </button>
          ) : null}
          <span className="font-mono text-[10px]">PBKDF2 600K</span>
        </div>
      </div>
    </div>
  );
}
