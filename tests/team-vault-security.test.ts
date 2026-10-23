import { describe, it, expect } from "vitest";
import {
  generateUserKeyPair,
  exportPublicKey,
  importPublicKey,
  wrapPrivateKey,
  unwrapPrivateKey,
  generateTeamKey,
  encryptTeamKeyForUser,
  decryptTeamKey,
  encryptTeamVault,
  decryptTeamVault,
  generateRecoveryKey,
  wrapPrivateKeyWithRecoveryKey,
  unwrapPrivateKeyWithRecoveryKey,
  PBKDF2_RECOMMENDED_ITERATIONS,
} from "@/lib/crypto-team";

describe("Team Vault Cryptographic Engine (Phase 2 Hardened Security)", () => {
  const masterPassphrase = "Correct-Horse-Battery-Staple-2026!";

  it("enforces PBKDF2 recommended iterations of at least 600,000", () => {
    expect(PBKDF2_RECOMMENDED_ITERATIONS).toBeGreaterThanOrEqual(600000);
  });

  it("wraps private key with 600,000 PBKDF2 iterations and unwrap enforces non-extractable keys", async () => {
    const keyPair = await generateUserKeyPair();
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();

    const startWrap = performance.now();
    const wrappedBundle = await wrapPrivateKey(keyPair.privateKey, masterPassphrase, {
      iterations: 600000,
    });
    const wrapDuration = performance.now() - startWrap;

    // Verify bundle structure
    expect(wrappedBundle.version).toBe(1);
    expect(wrappedBundle.iterations).toBe(600000);
    expect(wrappedBundle.algorithm).toBe("AES-GCM-256");
    expect(wrappedBundle.salt).toBeTruthy();
    expect(wrappedBundle.iv).toBeTruthy();
    expect(wrappedBundle.encryptedKey).toBeTruthy();

    // Verify 600,000 iterations runs within reasonable interactive bounds
    expect(wrapDuration).toBeLessThan(5000);

    // Unwrap with the correct passphrase
    const unwrappedPrivateKey = await unwrapPrivateKey(wrappedBundle, masterPassphrase);
    expect(unwrappedPrivateKey).toBeDefined();
    expect(unwrappedPrivateKey.type).toBe("private");
    expect(unwrappedPrivateKey.algorithm.name).toBe("RSA-OAEP");

    // Critical Security Invariant: In-memory private key must NOT be extractable!
    expect(unwrappedPrivateKey.extractable).toBe(false);

    // Attempting to export a non-extractable key must throw an error
    await expect(
      crypto.subtle.exportKey("pkcs8", unwrappedPrivateKey)
    ).rejects.toThrow();
  });

  it("rejects unwrapping private key when passphrase is incorrect", async () => {
    const keyPair = await generateUserKeyPair();
    const wrappedBundle = await wrapPrivateKey(keyPair.privateKey, masterPassphrase, {
      iterations: 50000, // Faster iteration for negative test
    });

    const wrongPassphrase = "Wrong-Password-Attempt-999";
    await expect(
      unwrapPrivateKey(wrappedBundle, wrongPassphrase)
    ).rejects.toThrow(/Failed to decrypt private key/i);
  });

  it("rejects weak passphrases under 8 characters", async () => {
    const keyPair = await generateUserKeyPair();
    await expect(wrapPrivateKey(keyPair.privateKey, "short")).rejects.toThrow(
      /at least 8 characters/i
    );
  });

  it("executes complete Zero-Knowledge team workflow across simulated devices", async () => {
    // 1. User Alice registers and sets up her master key on Device 1
    const aliceKeyPair = await generateUserKeyPair();
    const aliceWrappedBundle = await wrapPrivateKey(aliceKeyPair.privateKey, masterPassphrase, {
      iterations: 50000,
    });

    // 2. Alice creates a team and generates an AES-GCM 256 team key
    const teamKeyV1 = await generateTeamKey(true);
    const encryptedTeamKeyRecord = await encryptTeamKeyForUser(
      teamKeyV1,
      aliceKeyPair.publicKey,
      1
    );
    expect(encryptedTeamKeyRecord.key_version).toBe(1);
    expect(encryptedTeamKeyRecord.encrypted_team_key).toBeTruthy();

    // 3. Alice encrypts team environment variables
    const rawEnv = "DATABASE_URL=postgres://user:p4ss@db.internal:5432/prod\nJWT_SECRET=super_secret_token";
    const encryptedVault = await encryptTeamVault(rawEnv, teamKeyV1, 1);
    expect(encryptedVault.key_version).toBe(1);
    expect(encryptedVault.encrypted_payload).toBeTruthy();
    expect(encryptedVault.iv).toBeTruthy();

    // --- SIMULATE NEW DEVICE LOGIN (Device 2) ---
    // Device 2 only possesses the passphrase and the encrypted blobs from Supabase
    const device2AlicePrivateKey = await unwrapPrivateKey(
      aliceWrappedBundle,
      masterPassphrase
    );
    expect(device2AlicePrivateKey.extractable).toBe(false);

    // Decrypt team key on Device 2 with non-extractable invariant
    const device2TeamKey = await decryptTeamKey(
      encryptedTeamKeyRecord.encrypted_team_key,
      device2AlicePrivateKey,
      false // extractable = false
    );
    expect(device2TeamKey.extractable).toBe(false);

    // Decrypt vault payload
    const decryptedEnv = await decryptTeamVault(
      encryptedVault.encrypted_payload,
      encryptedVault.iv,
      device2TeamKey
    );

    expect(decryptedEnv).toBe(rawEnv);
  });

  it("supports multi-recipient asymmetric sharing between Alice and Bob", async () => {
    // Alice setup
    const aliceKeyPair = await generateUserKeyPair();
    const teamKey = await generateTeamKey(true);

    // Bob setup on his own device
    const bobKeyPair = await generateUserKeyPair();
    const bobPassphrase = "Bob-Secret-Passphrase-Secure!";
    const bobWrappedBundle = await wrapPrivateKey(bobKeyPair.privateKey, bobPassphrase, {
      iterations: 50000,
    });
    const bobPublicKeyB64 = await exportPublicKey(bobKeyPair.publicKey);

    // Alice invites Bob: Alice imports Bob's public key and encrypts teamKey for him
    const importedBobPubKey = await importPublicKey(bobPublicKeyB64);
    const bobTeamKeyRecord = await encryptTeamKeyForUser(teamKey, importedBobPubKey, 1);

    // Encrypt vault with teamKey
    const secretContent = "STRIPE_SECRET_KEY=sk_live_998877665544";
    const vault = await encryptTeamVault(secretContent, teamKey, 1);

    // Bob receives his encrypted team key and decrypts in memory
    const bobPrivateKey = await unwrapPrivateKey(bobWrappedBundle, bobPassphrase);
    const bobDecryptedTeamKey = await decryptTeamKey(
      bobTeamKeyRecord.encrypted_team_key,
      bobPrivateKey,
      false
    );

    const bobDecryptedContent = await decryptTeamVault(
      vault.encrypted_payload,
      vault.iv,
      bobDecryptedTeamKey
    );

    expect(bobDecryptedContent).toBe(secretContent);

    // Adversary Eve cannot decrypt Bob's team key
    const eveKeyPair = await generateUserKeyPair();
    await expect(
      decryptTeamKey(bobTeamKeyRecord.encrypted_team_key, eveKeyPair.privateKey)
    ).rejects.toThrow();
  });

  it("enforces cryptographic revocation via key rotation (Key Versioning)", async () => {
    // 1. Initial State: Team Key Version 1 shared with Alice and Bob
    const aliceKeyPair = await generateUserKeyPair();
    const bobKeyPair = await generateUserKeyPair();

    const teamKeyV1 = await generateTeamKey(true);
    const bobTeamKeyV1 = await encryptTeamKeyForUser(teamKeyV1, bobKeyPair.publicKey, 1);
    const bobDecryptedTeamKeyV1 = await decryptTeamKey(bobTeamKeyV1.encrypted_team_key, bobKeyPair.privateKey);

    // Vault v1 encrypted with teamKeyV1
    const vaultV1 = await encryptTeamVault("V1_DATA=active", teamKeyV1, 1);
    expect(await decryptTeamVault(vaultV1.encrypted_payload, vaultV1.iv, bobDecryptedTeamKeyV1)).toBe("V1_DATA=active");

    // 2. Revocation Event: Alice removes Bob and rotates the Team Key to Version 2
    const teamKeyV2 = await generateTeamKey(true); // New key
    const vaultV2 = await encryptTeamVault("V2_DATA=bob_is_revoked", teamKeyV2, 2);

    // Alice only encrypts teamKeyV2 for remaining members (Alice herself). Bob is excluded!
    const aliceTeamKeyV2 = await encryptTeamKeyForUser(teamKeyV2, aliceKeyPair.publicKey, 2);
    const aliceDecryptedTeamKeyV2 = await decryptTeamKey(aliceTeamKeyV2.encrypted_team_key, aliceKeyPair.privateKey);

    // Alice can decrypt v2 vault
    expect(await decryptTeamVault(vaultV2.encrypted_payload, vaultV2.iv, aliceDecryptedTeamKeyV2)).toBe("V2_DATA=bob_is_revoked");

    // Bob attempts to decrypt v2 vault with his old v1 key -> MUST FAIL cryptographically!
    await expect(
      decryptTeamVault(vaultV2.encrypted_payload, vaultV2.iv, bobDecryptedTeamKeyV1)
    ).rejects.toThrow(/Vault decryption failed/i);
  });

  it("supports Emergency Recovery Kit without backdoors", async () => {
    const keyPair = await generateUserKeyPair();
    const recoveryKey = generateRecoveryKey();

    expect(recoveryKey).toMatch(/^[0-9a-f]{64}$/); // 256-bit hex

    // Wrap private key with recovery key
    const recoveryBundle = await wrapPrivateKeyWithRecoveryKey(
      keyPair.privateKey,
      recoveryKey
    );
    expect(recoveryBundle).toContain(":");

    // Unwrap using recovery key
    const recoveredPrivateKey = await unwrapPrivateKeyWithRecoveryKey(
      recoveryBundle,
      recoveryKey
    );
    expect(recoveredPrivateKey).toBeDefined();
    expect(recoveredPrivateKey.extractable).toBe(false);

    // Test encryption/decryption with recovered key
    const teamKey = await generateTeamKey(true);
    const encryptedTeamKey = await encryptTeamKeyForUser(teamKey, keyPair.publicKey);
    const decryptedTeamKey = await decryptTeamKey(
      encryptedTeamKey.encrypted_team_key,
      recoveredPrivateKey
    );

    const vault = await encryptTeamVault("RECOVERED_SECRET=success", decryptedTeamKey);
    const decrypted = await decryptTeamVault(vault.encrypted_payload, vault.iv, decryptedTeamKey);
    expect(decrypted).toBe("RECOVERED_SECRET=success");

    // Rejects with invalid recovery key
    const bogusRecoveryKey = "0".repeat(64);
    await expect(
      unwrapPrivateKeyWithRecoveryKey(recoveryBundle, bogusRecoveryKey)
    ).rejects.toThrow();
  });
});
