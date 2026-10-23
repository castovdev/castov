"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  decryptTeamKey,
  encryptTeamKeyForUser,
  encryptTeamVault,
  decryptTeamVault,
  unwrapPrivateKey,
  unwrapPrivateKeyWithRecoveryKey,
  importPublicKey,
} from "@/lib/crypto-team";
import {
  getInMemoryPrivateKey,
  setInMemoryPrivateKey,
  sanitizeLegacyPlaintextStorage,
  fetchUserSecurityRecord,
  type UserSecurityKeyRecord,
} from "@/lib/team-key-session";
import { TeamVaultPassphraseModal } from "@/components/tools/team-vault-passphrase-modal";
import {
  LockIcon,
  ShieldAlertIcon,
  SaveIcon,
  CopyIcon,
  UsersIcon,
  ShieldCheckIcon,
  KeyRoundIcon,
  UserPlusIcon,
} from "lucide-react";

export default function TeamWorkspaceDetail() {
  const params = useParams();
  const teamId = params.teamId as string;
  const supabase = createClient();

  const [team, setTeam] = useState<any>(null);
  const [vaults, setVaults] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [activeVault, setActiveVault] = useState<any>(null);
  const [decryptedEnv, setDecryptedEnv] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamKey, setTeamKey] = useState<CryptoKey | null>(null);
  const [userSecurityRecord, setUserSecurityRecord] = useState<UserSecurityKeyRecord | null>(null);

  // Modal State for Passphrase Unlock
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"unlock" | "recovery">("unlock");
  const [modalError, setModalError] = useState("");
  const [isModalProcessing, setIsModalProcessing] = useState(false);
  const pendingActionRef = useRef<(() => Promise<void>) | null>(null);

  // Invite Member State
  const [isInviting, setIsInviting] = useState(false);

  const loadTeamData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const currentUid = userData.user.id;
      setUserId(currentUid);
      sanitizeLegacyPlaintextStorage(currentUid);

      // 1. Fetch Team Details
      const { data: teamData, error: teamErr } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();
      if (teamErr) throw teamErr;
      setTeam(teamData);

      // 2. Fetch Members
      const { data: memberData, error: memErr } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId);
      if (memErr) throw memErr;
      setMembers(memberData || []);

      // 3. Fetch Vaults
      const { data: vaultData, error: vaultErr } = await supabase
        .from("team_vaults")
        .select("*")
        .eq("team_id", teamId);
      if (vaultErr) throw vaultErr;
      setVaults(vaultData || []);

      // 4. Resolve Private Key & Team Key
      const myMemberRecord = (memberData || []).find((m) => m.user_id === currentUid);
      if (myMemberRecord) {
        const inMemoryKey = getInMemoryPrivateKey(currentUid);
        if (inMemoryKey) {
          // Decrypt Team Key into memory (extractable: false)
          const tk = await decryptTeamKey(myMemberRecord.encrypted_team_key, inMemoryKey, false);
          setTeamKey(tk);
        } else {
          // Fetch security record to prompt passphrase
          const secRec = await fetchUserSecurityRecord(supabase, currentUid);
          setUserSecurityRecord(secRec);
          if (secRec) {
            setIsModalOpen(true);
          } else {
            setError("No encryption keys found for your account. Please initialize your keys on the Team Workspaces hub.");
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [supabase, teamId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Unlock handlers
  const handleUnlockPassphrase = async (passphrase: string) => {
    if (!userId || !userSecurityRecord) return;
    setIsModalProcessing(true);
    setModalError("");

    try {
      const inMemoryPrivKey = await unwrapPrivateKey(
        userSecurityRecord.encrypted_private_key_bundle,
        passphrase
      );
      setInMemoryPrivateKey(userId, inMemoryPrivKey);

      // Decrypt Team Key
      const myMemberRecord = members.find((m) => m.user_id === userId);
      if (myMemberRecord) {
        const tk = await decryptTeamKey(myMemberRecord.encrypted_team_key, inMemoryPrivKey, false);
        setTeamKey(tk);
      }

      setIsModalOpen(false);

      if (pendingActionRef.current) {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        await action();
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || "Incorrect passphrase. Please try again.");
    } finally {
      setIsModalProcessing(false);
    }
  };

  const handleRecoveryUnlock = async (recoveryKeyHex: string) => {
    if (!userId || !userSecurityRecord?.encrypted_recovery_bundle) {
      setModalError("No recovery bundle registered for this account.");
      return;
    }
    setIsModalProcessing(true);
    setModalError("");

    try {
      const inMemoryPrivKey = await unwrapPrivateKeyWithRecoveryKey(
        userSecurityRecord.encrypted_recovery_bundle,
        recoveryKeyHex
      );
      setInMemoryPrivateKey(userId, inMemoryPrivKey);

      const myMemberRecord = members.find((m) => m.user_id === userId);
      if (myMemberRecord) {
        const tk = await decryptTeamKey(myMemberRecord.encrypted_team_key, inMemoryPrivKey, false);
        setTeamKey(tk);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || "Invalid emergency recovery key.");
    } finally {
      setIsModalProcessing(false);
    }
  };

  const handleOpenVault = async (vault: any) => {
    setActiveVault(vault);
    if (!teamKey) {
      pendingActionRef.current = async () => {
        await handleOpenVault(vault);
      };
      setIsModalOpen(true);
      return;
    }

    try {
      const plaintext = await decryptTeamVault(vault.encrypted_payload, vault.iv, teamKey);
      setDecryptedEnv(plaintext);
    } catch (e) {
      console.error("Decryption failed", e);
      setDecryptedEnv("Error decrypting vault contents: Authentication tag mismatch or corrupted ciphertext.");
    }
  };

  const handleSaveVault = async () => {
    if (!teamKey || !activeVault || !decryptedEnv) return;
    try {
      const { encrypted_payload, iv } = await encryptTeamVault(
        decryptedEnv,
        teamKey,
        activeVault.key_version || 1
      );

      const { data: userData } = await supabase.auth.getUser();

      const { error: saveErr } = await supabase
        .from("team_vaults")
        .update({
          encrypted_payload,
          iv,
          updated_at: new Date().toISOString(),
          updated_by: userData.user?.id,
          version: (activeVault.version || 1) + 1,
        })
        .eq("id", activeVault.id);

      if (saveErr) throw saveErr;
      alert("Vault saved successfully with AES-GCM 256-bit encryption!");
      await loadTeamData();
    } catch (e: any) {
      console.error(e);
      alert(`Error saving vault: ${e?.message || "Failed"}`);
    }
  };

  const handleCreateVault = async () => {
    if (!teamKey) {
      setIsModalOpen(true);
      return;
    }
    const name = prompt("Enter vault name (e.g. .env.production)");
    if (!name) return;

    try {
      const { encrypted_payload, iv } = await encryptTeamVault(
        "# New Environment Variables\nAPI_KEY=sample_secret",
        teamKey,
        1
      );

      const { data: userData } = await supabase.auth.getUser();

      const { error: createErr } = await supabase.from("team_vaults").insert([
        {
          team_id: teamId,
          name,
          encrypted_payload,
          iv,
          key_version: 1,
          updated_by: userData.user?.id,
        },
      ]);

      if (createErr) throw createErr;
      await loadTeamData();
    } catch (e: any) {
      console.error(e);
      alert(`Error creating vault: ${e?.message || "Failed"}`);
    }
  };

  const handleInviteMember = async () => {
    if (!teamKey) {
      setIsModalOpen(true);
      return;
    }
    const targetUserId = prompt("Enter colleague's User ID (UUID) to invite to this workspace:");
    if (!targetUserId) return;

    setIsInviting(true);
    try {
      // 1. Fetch colleague's public key securely
      const { data: targetPublicKeyB64, error: rpcErr } = await supabase.rpc("get_user_public_key", {
        target_user_id: targetUserId.trim(),
      });

      if (rpcErr || !targetPublicKeyB64) {
        throw new Error(
          "Could not locate a public encryption key for this user. Ensure they have signed in and initialized their keypair."
        );
      }

      // 2. Encrypt Team Key with colleague's public key (RSA-OAEP)
      const targetPubKey = await importPublicKey(targetPublicKeyB64);
      const encryptedForTarget = await encryptTeamKeyForUser(teamKey, targetPubKey, 1);

      // 3. Insert into team_members
      const { error: inviteErr } = await supabase.from("team_members").insert([
        {
          team_id: teamId,
          user_id: targetUserId.trim(),
          role: "member",
          public_key: targetPublicKeyB64,
          encrypted_team_key: encryptedForTarget.encrypted_team_key,
          key_version: 1,
        },
      ]);

      if (inviteErr) throw inviteErr;
      alert("Colleague invited successfully with zero-knowledge encrypted key!");
      await loadTeamData();
    } catch (err: any) {
      console.error(err);
      alert(`Invitation failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-16 px-4 text-center font-mono text-muted text-sm flex flex-col items-center justify-center">
        <KeyRoundIcon className="animate-spin mb-3 text-primary" size={24} />
        Loading Zero-Knowledge Workspace...
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-8 min-h-screen">
      {/* Sidebar: Navigation, Vaults & Members */}
      <div className="w-full md:w-80 flex flex-col gap-6 shrink-0">
        <div>
          <Link
            href="/env-vault/team"
            className="text-xs font-semibold text-muted hover:text-fg mb-4 inline-block"
          >
            &larr; Back to Teams
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-fg tracking-tight">{team?.name}</h1>
          </div>
          <p className="text-xs text-muted mt-1 font-mono break-all">{team?.id}</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex gap-3 text-danger text-sm">
            <ShieldAlertIcon size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Vaults List Card */}
        <div className="bg-card border border-line rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-fg">Vaults</h3>
            <button
              onClick={handleCreateVault}
              className="text-xs bg-field border border-line hover:bg-hover px-2 py-1 rounded text-fg font-semibold transition-colors"
            >
              + New
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {vaults.map((v) => (
              <button
                key={v.id}
                onClick={() => handleOpenVault(v)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-mono transition-colors flex items-center justify-between group ${
                  activeVault?.id === v.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted hover:bg-hover hover:text-fg border border-transparent"
                }`}
              >
                <span className="truncate">{v.name}</span>
                <span className="text-[10px] bg-field px-1.5 py-0.5 rounded text-muted shrink-0">
                  v{v.version}
                </span>
              </button>
            ))}
            {vaults.length === 0 && <p className="text-xs text-muted italic">No vaults created.</p>}
          </div>
        </div>

        {/* Members List Card */}
        <div className="bg-card border border-line rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <UsersIcon size={16} /> Members
            </h3>
            <button
              onClick={handleInviteMember}
              disabled={isInviting}
              className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors inline-flex items-center gap-1"
            >
              <UserPlusIcon size={12} /> {isInviting ? "Inviting..." : "Invite"}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {members.map((m) => (
              <div key={m.id} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded bg-field border border-line flex items-center justify-center text-[10px] text-muted uppercase font-bold shrink-0">
                    {m.role[0]}
                  </div>
                  <span className="font-mono text-muted truncate w-28" title={m.user_id}>
                    {m.user_id.split("-")[0]}...
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-muted uppercase font-mono">{m.role}</span>
                  <span className="flex h-2 w-2 rounded-full bg-success shadow-sm" title="E2EE Key Active" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 bg-card border border-line rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
        {!activeVault ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted p-8 text-center min-h-[400px]">
            <LockIcon size={48} className="mb-4 opacity-20 text-primary" />
            <h2 className="text-xl font-bold text-fg mb-2">Zero-Knowledge Encrypted Workspace</h2>
            <p className="text-sm max-w-sm text-muted">
              Select a vault from the sidebar to decrypt its contents directly in memory.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center p-4 border-b border-line bg-field">
              <div className="flex items-center gap-3">
                <LockIcon size={16} className="text-success" />
                <h2 className="font-mono text-sm font-bold text-fg">{activeVault.name}</h2>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-mono">
                  v{activeVault.version}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted uppercase tracking-wider font-semibold hidden sm:inline-flex items-center gap-1">
                  <ShieldCheckIcon size={12} className="text-success" /> Decrypted in Memory (Non-Extractable)
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(decryptedEnv)}
                  className="p-1.5 text-muted hover:text-fg hover:bg-hover rounded transition-colors"
                  title="Copy Decrypted Environment"
                >
                  <CopyIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleSaveVault}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white dark:text-[#050505] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <SaveIcon size={14} /> Save
                </button>
              </div>
            </div>
            <textarea
              value={decryptedEnv}
              onChange={(e) => setDecryptedEnv(e.target.value)}
              className="flex-1 w-full bg-transparent p-6 font-mono text-sm text-fg focus:outline-none resize-none leading-relaxed min-h-[450px]"
              spellCheck={false}
              placeholder="# Decrypted environment variables appear here..."
            />
            <div className="px-4 py-2 bg-field border-t border-line flex justify-between text-[10px] text-muted font-mono">
              <span>Last updated: {new Date(activeVault.updated_at).toLocaleString()}</span>
              <span>AES-GCM 256-bit · PBKDF2 600K</span>
            </div>
          </>
        )}
      </div>

      {/* Passphrase Unlock Modal */}
      <TeamVaultPassphraseModal
        isOpen={isModalOpen}
        mode={modalMode}
        error={modalError}
        isProcessing={isModalProcessing}
        onUnlock={handleUnlockPassphrase}
        onSetup={async () => {}}
        onRecover={handleRecoveryUnlock}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
