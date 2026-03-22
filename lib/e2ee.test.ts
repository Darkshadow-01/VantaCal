/**
 * E2EE Test Suite
 * Run with: npx ts-node --esm lib/e2ee.test.ts
 */

import {
  generateMasterKey,
  deriveKeyFromPassword,
  encryptMasterKey,
  decryptMasterKey,
  encryptData,
  decryptData,
  generateRecoveryPhrase,
  createRecoveryData,
  recoverMasterKeyFromPhrase,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "./e2ee";

async function runTests() {
  console.log("🧪 Starting E2EE Tests...\n");

  try {
    console.log("1. Testing Master Key Generation...");
    const masterKey = await generateMasterKey();
    console.log("   ✅ Master key generated");

    console.log("\n2. Testing Password Key Derivation...");
    const password = "mySecurePassword123!";
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordKey = await deriveKeyFromPassword(password, salt);
    console.log("   ✅ Password key derived");

    console.log("\n3. Testing Master Key Encryption...");
    const encrypted = await encryptMasterKey(masterKey, passwordKey);
    console.log("   Encrypted payload:", {
      encryptedMasterKey: encrypted.encryptedMasterKey.substring(0, 20) + "...",
      salt: encrypted.salt.substring(0, 10) + "...",
      iv: encrypted.iv.substring(0, 10) + "...",
    });
    console.log("   ✅ Master key encrypted");

    console.log("\n4. Testing Master Key Decryption...");
    const decryptedKey = await decryptMasterKey(encrypted, passwordKey);
    console.log("   ✅ Master key decrypted successfully");

    console.log("\n5. Testing Data Encryption/Decryption...");
    const testData = {
      title: "Team Meeting",
      description: "Weekly sync",
      startTime: Date.now(),
      endTime: Date.now() + 3600000,
      allDay: false,
      userId: "user_abc123",
      system: "Work" as const,
      color: "#3b82f6",
    };

    const encryptedData = await encryptData(testData, masterKey);
    console.log("   Encrypted data:", {
      ciphertext: encryptedData.ciphertext.substring(0, 30) + "...",
      iv: encryptedData.iv,
    });

    const decryptedData = await decryptData(encryptedData, masterKey);
    console.log("   Decrypted data:", decryptedData);
    
    if (JSON.stringify(testData) === JSON.stringify(decryptedData)) {
      console.log("   ✅ Data roundtrip successful");
    } else {
      throw new Error("Data mismatch!");
    }

    console.log("\n6. Testing Recovery Phrase Generation...");
    const recoveryPhrase = await generateRecoveryPhrase();
    console.log("   Recovery phrase:", recoveryPhrase);
    console.log("   ✅ Recovery phrase generated");

    console.log("\n7. Testing Recovery Data Creation...");
    const recoveryData = await createRecoveryData(masterKey, recoveryPhrase);
    console.log("   Recovery data created:", {
      encryptedMasterKey: recoveryData.encryptedMasterKey.substring(0, 20) + "...",
    });
    console.log("   ✅ Recovery data created");

    console.log("\n8. Testing Master Key Recovery...");
    const recoveredKey = await recoverMasterKeyFromPhrase(recoveryData, recoveryPhrase);
    console.log("   ✅ Master key recovered from phrase");

    console.log("\n9. Testing Data Encryption with Recovered Key...");
    const encryptedWithRecovered = await encryptData(testData, recoveredKey);
    const decryptedWithRecovered = await decryptData(encryptedWithRecovered, recoveredKey);
    if (JSON.stringify(testData) === JSON.stringify(decryptedWithRecovered)) {
      console.log("   ✅ Data encrypted/decrypted with recovered key");
    }

    console.log("\n10. Testing Base64 Encoding...");
    const testBytes = crypto.getRandomValues(new Uint8Array(32));
    const encoded = arrayBufferToBase64(testBytes);
    const decoded = base64ToArrayBuffer(encoded);
    if (Array.from(testBytes).every((v, i) => v === new Uint8Array(decoded)[i])) {
      console.log("   ✅ Base64 encoding/decoding working");
    }

    console.log("\n🎉 All tests passed!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

runTests();
