"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { PlusIcon, UsersIcon } from "lucide-react";
import { generateTeamKey, generateUserKeyPair, exportPublicKey, exportPrivateKey, encryptTeamKeyForUser } from "@/lib/crypto-team";

export default function TeamWorkspacePage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const supabase = createClient();

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const { data: userTeams } = await supabase
      .from('team_members')
      .select('team_id, role, teams(id, name, created_at)');
    
    if (userTeams) {
      // @ts-ignore - Supabase nested join typing
      setTeams(userTeams.map(ut => ({ ...ut.teams, role: ut.role })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    setIsCreating(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // 1. Generate RSA Keypair for the user (if they don't have one saved, for demo we generate per team/session)
      // Real-world: Should check if user already has a public key in DB, if so, we'd need their private key to decrypt, 
      // but if creating a team, we can just ensure they have a keypair. Let's assume we create one for the session.
      const userKeyPair = await generateUserKeyPair();
      const pubKeyBase64 = await exportPublicKey(userKeyPair.publicKey);
      const privKeyBase64 = await exportPrivateKey(userKeyPair.privateKey);

      // Save Private Key to local storage (in a real app, encrypt this with user's password)
      localStorage.setItem(`castov_priv_key_${userData.user.id}`, privKeyBase64);

      // 2. Generate Team AES-GCM Key
      const teamKey = await generateTeamKey();

      // 3. Encrypt Team Key with User's Public Key
      const encryptedTeamKey = await encryptTeamKeyForUser(teamKey, userKeyPair.publicKey);

      // 4. Create Team in DB
      const { data: teamData, error: teamErr } = await supabase
        .from('teams')
        .insert([{ name: newTeamName, created_by: userData.user.id }])
        .select()
        .single();
      
      if (teamErr) throw teamErr;

      // 5. Create Team Member in DB
      const { error: memberErr } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamData.id,
          user_id: userData.user.id,
          role: 'owner',
          public_key: pubKeyBase64,
          encrypted_team_key: encryptedTeamKey
        }]);

      if (memberErr) throw memberErr;

      setNewTeamName("");
      fetchTeams();
    } catch (err) {
      console.error(err);
      alert("Error creating team");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 min-h-screen">
      <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-fg tracking-tight mb-2">Team Workspaces</h1>
          <p className="text-zinc-400">Manage your zero-knowledge shared environments.</p>
        </div>
        <Link href="/env-vault" className="text-sm font-semibold text-zinc-500 hover:text-white transition-colors">
          &larr; Back to Personal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Team Card */}
        <div className="bg-card border border-dashed border-line hover:border-primary/50 rounded-2xl p-6 transition-all group flex flex-col justify-center shadow-sm">
          <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
            <div className="w-12 h-12 bg-field group-hover:bg-primary/10 rounded-xl flex items-center justify-center transition-colors mb-2">
              <PlusIcon className="text-muted group-hover:text-primary" />
            </div>
            <h3 className="text-lg font-bold text-fg">New Team</h3>
            <input 
              type="text" 
              placeholder="e.g. Acme Frontend" 
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
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
          <div className="text-muted text-sm py-8">Loading teams...</div>
        ) : (
          teams.map(team => (
            <Link key={team.id} href={`/env-vault/team/${team.id}`} className="bg-card border border-line hover:border-primary/30 rounded-2xl p-6 transition-all group flex flex-col cursor-pointer shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <UsersIcon className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-fg mb-1">{team.name}</h3>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-6">Role: {team.role}</p>
              
              <div className="mt-auto border-t border-line pt-4 flex justify-between items-center text-sm">
                <span className="text-primary font-medium group-hover:underline">Open Workspace</span>
                <span className="text-muted font-mono text-[10px]">{new Date(team.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
