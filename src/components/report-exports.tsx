import { Download, FileJson, Table2 } from "lucide-react";

export type IntegrityState = "pending" | "verified" | "rejected";

export function ReportExports({
  reportId,
  integrityState = "verified",
}: {
  reportId: string;
  integrityState?: IntegrityState;
}) {
  const isDisabled = integrityState === "pending";
  const isRejected = integrityState === "rejected";

  const baseButtonClasses =
    "inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold";
  const enabledClasses =
    "bg-surface hover:bg-canvas cursor-pointer transition-colors";
  const disabledClasses =
    "bg-surface opacity-50 cursor-not-allowed" +
    (isRejected ? " border-red-300" : "");

  const jsonButtonClasses = `${baseButtonClasses} ${isDisabled || isRejected ? disabledClasses : enabledClasses}`;
  const csvButtonClasses = `${baseButtonClasses} ${isDisabled || isRejected ? disabledClasses : enabledClasses}`;

  const bundleButtonClasses = `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white ${
    isDisabled || isRejected
      ? "bg-accent opacity-50 cursor-not-allowed"
      : "bg-accent hover:bg-accent/90 cursor-pointer transition-colors"
  }`;

  const disabledReason =
    integrityState === "pending"
      ? "Report verification is in progress. Exports are temporarily unavailable."
      : "Report integrity verification failed. Exports are not available.";

  const disabledAriaLabel =
    integrityState === "pending"
      ? "Export unavailable while verification is pending"
      : "Export unavailable due to verification failure";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={jsonButtonClasses}
        disabled={isDisabled || isRejected}
        aria-disabled={isDisabled || isRejected}
        title={isDisabled || isRejected ? disabledReason : undefined}
        aria-label={`Export as JSON${isDisabled || isRejected ? ` (${disabledAriaLabel})` : ""}`}
      >
        <FileJson size={15} aria-hidden="true" />
        JSON
      </button>

      <button
        className={csvButtonClasses}
        disabled={isDisabled || isRejected}
        aria-disabled={isDisabled || isRejected}
        title={isDisabled || isRejected ? disabledReason : undefined}
        aria-label={`Export as CSV${isDisabled || isRejected ? ` (${disabledAriaLabel})` : ""}`}
      >
        <Table2 size={15} aria-hidden="true" />
        CSV
      </button>

      <a
        href={
          isDisabled || isRejected
            ? undefined
            : `/api/reports/${reportId}/download`
        }
        onClick={
          isDisabled || isRejected
            ? (e) => {
                e.preventDefault();
              }
            : undefined
        }
        className={bundleButtonClasses}
        role={isDisabled || isRejected ? "button" : undefined}
        tabIndex={isDisabled || isRejected ? 0 : undefined}
        aria-disabled={isDisabled || isRejected}
        title={isDisabled || isRejected ? disabledReason : undefined}
        aria-label={`Download signed bundle${isDisabled || isRejected ? ` (${disabledAriaLabel})` : ""}`}
      >
        <Download size={15} aria-hidden="true" />
        Download signed bundle
      </a>
    </div>
  );
}
