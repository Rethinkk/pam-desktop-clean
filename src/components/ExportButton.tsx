/* @ts-nocheck */
import React from "react";
import { buildPamExport } from "../lib/exportAll";
import { downloadJson } from "../lib/downloadJson";

export default function ExportButton({ className = "" }: { className?: string }) {
  const onExport = React.useCallback(() => {
    const payload = buildPamExport();
    const date = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-"); // 2025-10-05-14-30-00
    const filename = `pam-backup-${date}.json`;
    downloadJson(filename, payload);
  }, []);

  return (
    <button className={className} onClick={onExport} title="Download je gegevens als JSON">
      Exporteren (JSON)
    </button>
  );
}
