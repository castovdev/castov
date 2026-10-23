"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { PlusIcon, UsersIcon, ShieldCheckIcon, KeyRoundIcon } from "lucide-react";
import {
  generateUserKeyPair,
  exportPublicKey,
  wrapPrivateKey,
  unwrapPrivateKey,
  generateTeamKey,
  encryptTeamKeyForUser,
  generateRecoveryKey,
  wrapPrivateKeyWithRecoveryKey,
  unwrapPrivateKeyWithRecoveryKey,
} from "@/lib/crypto-team";
import {
  getInMemoryPrivateKey,
  setInMemoryPrivateKey,
  sanitizeLegacyPlaintextStorage,
  fetchUserSecurityRecord,
  persistUserSecurityRecord,
  type UserSecurityKeyRecord,
} from "@/lib/team-key-session";
import { TeamVaultPassphraseModal } from "@/components/tools/team-vault-passphrase-modal";

export default function TeamWorkspacePage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userSecurityRecord, setUserSecurityRecord] = useState<UserSecurityKeyRecord | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"unlock" | "setup" | "recovery">("setup");
  const [modalError, setModalError] = useState("");
  const [isModalProcessing, setIsModalProcessing] = useState(false);
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState("");
  const pendingKeyPairRef = useRef<CryptoKeyPair | null>(null);
  const pendingCreateTeamRef = useRef(false);

  const supabase = createClient();

  const loadUserData = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }
      const uid = authData.user.id;
      setUserId(uid);
      sanitizeLegacyPlaintextStorage(uid);

      // Check if user has security record
      const secRecord = await fetchUserSecurityRecord(supabase, uid);
      setUserSecurityRecord(secRecord);

      // Fetch teams
      const { data: userTeams } = await supabase
        .from("team_members")
        .select("team_id, role, teams(id, name, created_at)");

      if (userTeams) {
        // @ts-ignore - Supabase nested join typing
        setTeams(userTeams.map((ut) => ({ ...ut.teams, role: ut.role })));
      }
    } catch (err) {
      console.error("Failed to load user workspaces:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      loadUserData();
    }
    return () => {
      mounted = false;
    };
  }, [loadUserData]);

  // Handle initializing a brand new keypair with master passphrase
  const handleSetupPassphrase = async (passphrase: string) => {
    if (!userId) return;
    setIsModalProcessing(true);
    setModalError("");

    try {
      let keyPair = pendingKeyPairRef.current;
      if (!keyPair) {
        keyPair = await generateUserKeyPair();
        pendingKeyPairRef.current = keyPair;
      }

      // 1. Wrap private key with 600,000 PBKDF2 iterations
      const wrappedBundle = await wrapPrivateKey(keyPair.privateKey, passphrase);
      const pubKeyBase64 = await exportPublicKey(keyPair.publicKey);

      // 2. Wrap with emergency recovery key if generated
      let recoveryBundle: string | undefined;
      if (generatedRecoveryKey) {
        recoveryBundle = await wrapPrivateKeyWithRecoveryKey(keyPair.privateKey, generatedRecoveryKey);
      }

      // 3. Persist to Supabase
      await persistUserSecurityRecord(supabase, {
        user_id: userId,
        public_key: pubKeyBase64,
        encrypted_private_key_bundle: wrappedBundle,
        encrypted_recovery_bundle: recoveryBundle,
      });

      // 4. Unwrap into memory with extractable: false
      const inMemoryPrivKey = await unwrapPrivateKey(wrappedBundle, passphrase);
      setInMemoryPrivateKey(userId, inMemoryPrivKey);

      // Update state
      setUserSecurityRecord({
        user_id: userId,
        public_key: pubKeyBase64,
        encrypted_private_key_bundle: wrappedBundle,
        encrypted_recovery_bundle: recoveryBundle,
        key_version: 1,
      });

      setIsModalOpen(false);
      pendingKeyPairRef.current = null;

      if (pendingCreateTeamRef.current) {
        pendingCreateTeamRef.current = false;
        await executeTeamCreation(pubKeyBase64, inMemoryPrivKey);
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || "Failed to initialize keypair.");
    } finally {
      setIsModalProcessing(false);
    }
  };

  // Handle unlocking existing keypair with master passphrase
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
      setIsModalOpen(false);

      if (pendingCreateTeamRef.current) {
        pendingCreateTeamRef.current = false;
        await executeTeamCreation(userSecurityRecord.public_key, inMemoryPrivKey);
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || "Incorrect passphrase.");
    } finally {
      setIsModalProcessing(false);
    }
  };

  // Handle unlocking via emergency recovery key
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
      setIsModalOpen(false);

      if (pendingCreateTeamRef.current) {
        pendingCreateTeamRef.current = false;
        await executeTeamCreation(userSecurityRecord.public_key, inMemoryPrivKey);
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || "Invalid emergency recovery key.");
    } finally {
      setIsModalProcessing(false);
    }
  };

  const executeTeamCreation = async (pubKeyBase64: string, _privKey: CryptoKey) => {
    if (!userId || !newTeamName) return;
    setIsCreating(true);

    try {
      // 1. Generate Team AES-GCM Key (256-bit)
      const teamKey = await generateTeamKey(true);

      // 2. Encrypt Team Key with User's Public Key
      const { importPublicKey } = await import("@/lib/crypto-team");
      const userPubKey = await importPublicKey(pubKeyBase64);
      const encryptedTeamKeyRecord = await encryptTeamKeyForUser(teamKey, userPubKey, 1);

      // 3. Create Team in DB
      const { data: teamData, error: teamErr } = await supabase
        .from("teams")
        .insert([{ name: newTeamName, created_by: userId }])
        .select()
        .single();

      if (teamErr) throw teamErr;

      // 4. Create Team Member in DB
      const { error: memberErr } = await supabase.from("team_members").insert([
        {
          team_id: teamData.id,
          user_id: userId,
          role: "owner",
          public_key: pubKeyBase64,
          encrypted_team_key: encryptedTeamKeyRecord.encrypted_team_key,
          key_version: 1,
        },
      ]);

      if (memberErr) throw memberErr;

      setNewTeamName("");
      await loadUserData();
    } catch (err: any) {
      console.error(err);
      alert(`Error creating team: ${err?.message || "Failed"}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !userId) return;

    // Check if in-memory private key is already available
    const existingInMemory = getInMemoryPrivateKey(userId);
    if (existingInMemory && userSecurityRecord) {
      await executeTeamCreation(userSecurityRecord.public_key, existingInMemory);
      return;
    }

    pendingCreateTeamRef.current = true;

    // If user has security record, prompt unlock
    if (userSecurityRecord) {
      setModalMode("unlock");
      setModalError("");
      setIsModalOpen(true);
    } else {
      // Setup new keypair
      const keyPair = await generateUserKeyPair();
      pendingKeyPairRef.current = keyPair;
      const recoveryKey = generateRecoveryKey();
      setGeneratedRecoveryKey(recoveryKey);
      setModalMode("setup");
      setModalError("");
      setIsModalOpen(true);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 min-h-screen">
      <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-fg tracking-tight">Team Workspaces</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              <ShieldCheckIcon size={12} /> PBKDF2 600K E2EE
            </span>
          </div>
          <p className="text-zinc-400 text-sm">
            Zero-knowledge shared environments with client-side key wrapping and memory-only decryption.
          </p>
        </div>
        <Link href="/env-vault" className="text-sm font-semibold text-zinc-500 hover:text-white transition-colors">
          &larr; Back to Personal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Team Card */}
        <div className="bg-card border border-dashed border-line hover:border-primary/50 rounded-2xl p-6 transition-all group flex flex-col justify-center shadow-sm">
          <form onSubmit={handleCreateTeamSubmit} className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-field group-hover:bg-primary/10 rounded-xl flex items-center justify-center transition-colors mb-2">
              <PlusIcon className="text-muted group-hover:text-primary" />
            </div>
            <h3 className="text-lg font-bold text-fg">New Team</h3>
            <input
              type="text"
              placeholder="e.g. Acme Frontend"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full bg-field border border-line rounded-lg px-4 py-2.5 text-sm font-medium text-fg focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!newTeamName || isCreating}
              className="w-full bg-primary text-white dark:text-[#050505] font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2 shadow-sm"
            >
              {isCreating ? "Creating..." : "Create Team"}
            </button>
          </form>
        </div>

        {/* List Teams */}
        {loading ? (
          <div className="text-muted text-sm py-8 font-mono">Loading workspaces...</div>
        ) : teams.length === 0 ? (
          <div className="col-span-2 bg-card border border-line rounded-2xl p-8 flex flex-col items-center justify-center text-center text-muted">
            <KeyRoundIcon size={36} className="mb-3 opacity-30 text-primary" />
            <h4 className="text-base font-bold text-fg mb-1">No Team Workspaces Yet</h4>
            <p className="text-xs max-w-sm mb-4">
              Create your first team workspace to share encrypted secrets with colleagues using zero-knowledge client encryption.
            </p>
          </div>
        ) : (
          teams.map((team) => (
            <Link
              key={team.id}
              href={`/env-vault/team/${team.id}`}
              className="bg-card border border-line hover:border-primary/30 rounded-2xl p-6 transition-all group flex flex-col cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <UsersIcon className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-fg mb-1">{team.name}</h3>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-6">Role: {team.role}</p>

              <div className="mt-auto border-t border-line pt-4 flex justify-between items-center text-sm">
                <span className="text-primary font-medium group-hover:underline">Open Workspace</span>
                <span className="text-muted font-mono text-[10px]">
                  {new Date(team.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Master Passphrase & Security Modal */}
      <TeamVaultPassphraseModal
        isOpen={isModalOpen}
        mode={modalMode}
        error={modalError}
        isProcessing={isModalProcessing}
        recoveryKeyGenerated={generatedRecoveryKey}
        onUnlock={handleUnlockPassphrase}
        onSetup={handleSetupPassphrase}
        onRecover={handleRecoveryUnlock}
        onClose={() => {
          setIsModalOpen(false);
          pendingCreateTeamRef.current = false;
        }}
      />
    </div>
  );
}
