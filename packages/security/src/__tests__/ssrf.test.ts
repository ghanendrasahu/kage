import { describe, it, expect } from "vitest";
import { isSafeUrl, validateUrl } from "../ssrf";

describe("SSRF Protection", () => {
  describe("isSafeUrl", () => {
    it("allows public HTTPS URLs", () => {
      expect(isSafeUrl("https://example.com")).toBe(true);
      expect(isSafeUrl("https://google.com")).toBe(true);
      expect(isSafeUrl("https://github.com")).toBe(true);
    });

    it("allows public HTTP URLs", () => {
      expect(isSafeUrl("http://example.com")).toBe(true);
    });

    it("blocks localhost", () => {
      expect(isSafeUrl("http://localhost")).toBe(false);
      expect(isSafeUrl("http://localhost:3000")).toBe(false);
      expect(isSafeUrl("http://127.0.0.1")).toBe(false);
      expect(isSafeUrl("http://127.0.0.1:8080")).toBe(false);
    });

    it("blocks private IP ranges", () => {
      expect(isSafeUrl("http://10.0.0.1")).toBe(false);
      expect(isSafeUrl("http://10.255.255.255")).toBe(false);
      expect(isSafeUrl("http://172.16.0.1")).toBe(false);
      expect(isSafeUrl("http://172.31.255.255")).toBe(false);
      expect(isSafeUrl("http://192.168.0.1")).toBe(false);
      expect(isSafeUrl("http://192.168.1.100")).toBe(false);
    });

    it("blocks cloud metadata endpoints", () => {
      expect(isSafeUrl("http://169.254.169.254")).toBe(false);
      expect(isSafeUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    });

    it("blocks non-standard schemes", () => {
      expect(isSafeUrl("ftp://example.com")).toBe(false);
      expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    });

    it("blocks invalid URLs", () => {
      expect(isSafeUrl("not-a-url")).toBe(false);
      expect(isSafeUrl("")).toBe(false);
    });
  });

  describe("validateUrl", () => {
    it("returns safe: true for valid public URLs", () => {
      const result = validateUrl("https://example.com");
      expect(result.safe).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("returns error for private IPs", () => {
      const result = validateUrl("http://192.168.1.1");
      expect(result.safe).toBe(false);
      expect(result.error).toContain("private");
    });

    it("returns error for blocked hostnames", () => {
      const result = validateUrl("http://localhost");
      expect(result.safe).toBe(false);
      expect(result.error).toContain("blocked");
    });

    it("returns error for non-HTTP protocols", () => {
      const result = validateUrl("ftp://example.com");
      expect(result.safe).toBe(false);
      expect(result.error).toContain("protocol");
    });
  });
});
