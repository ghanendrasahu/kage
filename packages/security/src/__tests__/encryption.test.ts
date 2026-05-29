import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../encryption";

const TEST_KEY = "test-encryption-key-32-chars-long!!";

describe("Encryption", () => {
  it("encrypts and decrypts strings", () => {
    process.env["ENCRYPTION_KEY"] = TEST_KEY;
    const plaintext = "sensitive-data-12345";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toContain(":");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for same plaintext", () => {
    process.env["ENCRYPTION_KEY"] = TEST_KEY;
    const plaintext = "same-data";
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("decrypts empty string", () => {
    process.env["ENCRYPTION_KEY"] = TEST_KEY;
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("handles unicode", () => {
    process.env["ENCRYPTION_KEY"] = TEST_KEY;
    const plaintext = "Hello World";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("throws on invalid encrypted data", () => {
    process.env["ENCRYPTION_KEY"] = TEST_KEY;
    expect(() => decrypt("invalid-data")).toThrow();
  });

  it("throws on wrong key", () => {
    process.env["ENCRYPTION_KEY"] = TEST_KEY;
    const encrypted = encrypt("test");
    process.env["ENCRYPTION_KEY"] = "wrong-key-32-chars-long!!!!!!!";
    expect(() => decrypt(encrypted)).toThrow();
    process.env["ENCRYPTION_KEY"] = TEST_KEY;
  });

  it("throws without ENCRYPTION_KEY", () => {
    delete process.env["ENCRYPTION_KEY"];
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");
  });
});
