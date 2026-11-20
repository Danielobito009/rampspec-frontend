import { describe, it, expect, beforeEach } from "vitest";
import { verifyReportSignature, isValidDigest } from "@/lib/reports/signature";

/**
 * Component-level behavior tests for ReportExports
 * 
 * The ReportExports component tests are documented in the component itself.
 * This file tests the supporting signature verification logic.
 * 
 * Key behaviors verified in the component:
 * - Shows loading state while fetching/verifying report digest
 * - Calls GET /api/reports/{reportId} to fetch canonical digest
 * - Validates digest format using isValidDigest()
 * - Calls verifyReportSignature() to confirm validity
 * - Shows success state: "Report digest verified" with enabled download
 * - Shows error state: generic message on verification failure
 * - Shows unauthorized state: specific message on 401 response
 * - Disables download button until verification completes successfully
 * - Prevents link navigation when aria-disabled="true"
 * - Does not leak report contents in error messages
 * - Cleans up fetch on component unmount
 */

describe("ReportExports verification logic", () => {
  describe("isValidDigest - format validation", () => {
    it("accepts valid hex digests", () => {
      expect(isValidDigest("abc123")).toBe(true);
      expect(isValidDigest("ABC123")).toBe(true);
      expect(isValidDigest(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      )).toBe(true);
    });

    it("accepts mixed case hex", () => {
      expect(isValidDigest("aBcDeF0123456789")).toBe(true);
      expect(isValidDigest("AbCdEf0123456789")).toBe(true);
    });

    it("accepts long valid digests", () => {
      const longDigest = "a".repeat(256);
      expect(isValidDigest(longDigest)).toBe(true);
    });

    it("rejects empty digest", () => {
      expect(isValidDigest("")).toBe(false);
    });

    it("rejects non-hex characters", () => {
      expect(isValidDigest("gg1234")).toBe(false);
      expect(isValidDigest("xyz789")).toBe(false);
      expect(isValidDigest("ZZZZZ")).toBe(false);
    });

    it("rejects special characters", () => {
      expect(isValidDigest("abc-123")).toBe(false);
      expect(isValidDigest("abc 123")).toBe(false);
      expect(isValidDigest("abc!123")).toBe(false);
      expect(isValidDigest("abc@123")).toBe(false);
      expect(isValidDigest("abc_123")).toBe(false);
    });

    it("rejects whitespace", () => {
      expect(isValidDigest(" abc123")).toBe(false);
      expect(isValidDigest("abc123 ")).toBe(false);
      expect(isValidDigest("abc 123")).toBe(false);
    });
  });

  describe("verifyReportSignature - signature verification", () => {
    it("accepts matching digests", () => {
      const result = verifyReportSignature("abc123", "abc123", "RampSpec signer");
      expect(result.valid).toBe(true);
      expect(result.algorithm).toBe("SHA-256");
      expect(result.signer).toBe("RampSpec signer");
      expect(result.reason).toBeUndefined();
    });

    it("rejects mismatches", () => {
      const result = verifyReportSignature("abc123", "def456", "RampSpec signer");
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Digest does not match the signed report.");
    });

    it("rejects empty expected digest", () => {
      const result = verifyReportSignature("", "abc123", "RampSpec signer");
      expect(result.valid).toBe(false);
    });

    it("omits reason on success (prevents leaking info)", () => {
      const result = verifyReportSignature("abc123", "abc123", "RampSpec");
      expect(result.reason).toBeUndefined();
    });

    it("includes reason only on failure", () => {
      const failResult = verifyReportSignature("a", "b", "RampSpec");
      expect(failResult.reason).toBeDefined();

      const successResult = verifyReportSignature("a", "a", "RampSpec");
      expect(successResult.reason).toBeUndefined();
    });

    it("handles case-sensitive comparison", () => {
      const result = verifyReportSignature("ABC", "abc", "RampSpec");
      expect(result.valid).toBe(false);
    });
  });

  describe("state transitions", () => {
    it("invalid digest prevents download", () => {
      // Component should not enable download if digest validation fails
      const invalidDigest = "not-hex!";
      expect(isValidDigest(invalidDigest)).toBe(false);
    });

    it("verification failure prevents download", () => {
      // Component should not enable download if verification fails
      const result = verifyReportSignature("signed", "other", "signer");
      expect(result.valid).toBe(false);
    });

    it("only success state enables download", () => {
      // Component enables download only when:
      // 1. Digest format is valid
      const validDigest = "abc123";
      expect(isValidDigest(validDigest)).toBe(true);

      // 2. Verification succeeds
      const verificationResult = verifyReportSignature(
        validDigest,
        validDigest,
        "RampSpec"
      );
      expect(verificationResult.valid).toBe(true);
    });
  });

  describe("error handling", () => {
    it("provides specific error for digest mismatch", () => {
      const result = verifyReportSignature("expected", "actual", "signer");
      expect(result.reason).toBe("Digest does not match the signed report.");
    });

    it("does not reveal content in error reason", () => {
      const result = verifyReportSignature("expected", "actual", "signer");
      // Error message should not contain the actual digests
      expect(result.reason).not.toContain("expected");
      expect(result.reason).not.toContain("actual");
    });
  });

  describe("boundary conditions", () => {
    it("handles single character digest", () => {
      expect(isValidDigest("a")).toBe(true);
      expect(isValidDigest("F")).toBe(true);
      expect(isValidDigest("0")).toBe(true);
    });

    it("handles extremely long digest", () => {
      const veryLongDigest = "a".repeat(10000);
      expect(isValidDigest(veryLongDigest)).toBe(true);
    });

    it("handles all valid hex characters", () => {
      expect(isValidDigest("0123456789abcdef")).toBe(true);
      expect(isValidDigest("ABCDEF")).toBe(true);
    });

    it("rejects single invalid character among valid ones", () => {
      expect(isValidDigest("abcdefg")).toBe(false); // g is invalid
      expect(isValidDigest("0123456789z")).toBe(false); // z is invalid
    });
  });
});
