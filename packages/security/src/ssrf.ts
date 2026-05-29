import { URL } from "url";

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fd00:/,
  /^fe80:/,
  /^::ffff:127\./,
  /^::ffff:10\./,
  /^::ffff:172\.(1[6-9]|2\d|3[01])\./,
  /^::ffff:192\.168\./,
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
  "instance-data",
  "kubernetes",
  "kubernetes.default",
];

export function isPrivateIp(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

export function validateUrl(urlString: string): { safe: boolean; error?: string } {
  try {
    const parsed = new URL(urlString);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { safe: false, error: "Only HTTP and HTTPS protocols are allowed" };
    }

    const hostname = parsed.hostname.toLowerCase();

    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { safe: false, error: "Access to this hostname is blocked" };
    }

    if (isPrivateIp(hostname)) {
      return { safe: false, error: "Access to private/internal IPs is blocked" };
    }

    if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
      return { safe: false, error: "Only standard ports 80 and 443 are allowed" };
    }

    return { safe: true };
  } catch {
    return { safe: false, error: "Invalid URL format" };
  }
}

export function isSafeUrl(urlString: string): boolean {
  return validateUrl(urlString).safe;
}
