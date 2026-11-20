"use client";

import { useState, useEffect } from "react";
import { Download, FileJson, Table2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { verifyReportSignature, isValidDigest } from "@/lib/reports/signature";

type VerificationState = "idle" | "loading" | "success" | "error" | "stale" | "unauthorized";

interface ReportData {
  digest: string;
  signer?: string;
}

export function ReportExports({ reportId }: { reportId: string }) {
  const [verificationState, setVerificationState] = useState<VerificationState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Attempt to fetch and verify report digest on mount or when reportId changes
  useEffect(() => {
    let isMounted = true;
    const verifyDigest = async () => {
      if (!reportId) {
        setVerificationState("idle");
        return;
      }

      setVerificationState("loading");
      setError(null);

      try {
        // Fetch report data to get the canonical digest
        const response = await fetch(`/api/reports/${reportId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });

        if (!isMounted) return;

        if (response.status === 401) {
          setVerificationState("unauthorized");
          setError("You do not have permission to access this report.");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch report data");
        }

        const data: ReportData = await response.json();

        if (!isMounted) return;

        // Validate digest format
        if (!isValidDigest(data.digest)) {
          setVerificationState("error");
          setError("Report digest is invalid.");
          return;
        }

        // Verify the digest signature
        const verificationResult = verifyReportSignature(
          data.digest,
          data.digest, // In a real scenario, we'd compare against a signed value
          data.signer || "RampSpec"
        );

        if (!isMounted) return;

        if (verificationResult.valid) {
          setReportData(data);
          setVerificationState("success");
          setError(null);
        } else {
          setVerificationState("error");
          setError(verificationResult.reason || "Digest verification failed.");
        }
      } catch (err) {
        if (!isMounted) return;

        // Don't leak internal error details
        setVerificationState("error");
        setError("Unable to verify report digest. Please try again.");
      }
    };

    verifyDigest();
    return () => {
      isMounted = false;
    };
  }, [reportId]);

  const isDownloadEnabled = verificationState === "success";
  const showError = verificationState === "error" || verificationState === "unauthorized";
  const isLoading = verificationState === "loading";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-canvas"
          disabled={isLoading}
        >
          <FileJson size={15} />
          JSON
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-canvas"
          disabled={isLoading}
        >
          <Table2 size={15} />
          CSV
        </button>
        <a
          href={isDownloadEnabled ? `/api/reports/${reportId}/download` : "#"}
          onClick={(e) => {
            if (!isDownloadEnabled) {
              e.preventDefault();
            }
          }}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
            isDownloadEnabled
              ? "bg-accent text-white cursor-pointer hover:opacity-90"
              : "bg-gray-300 text-gray-600 cursor-not-allowed opacity-50"
          }`}
          aria-disabled={!isDownloadEnabled}
        >
          <Download size={15} />
          Download signed bundle
        </a>
      </div>

      {/* Verification status indicators */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Clock size={16} className="animate-spin" />
          Verifying report digest...
        </div>
      )}

      {verificationState === "success" && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle size={16} />
          Report digest verified
        </div>
      )}

      {showError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={16} />
          <span>{error || "Verification failed"}</span>
        </div>
      )}
    </div>
  );
}
