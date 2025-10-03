/* @ts-nocheck */
const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || ""; // bv. https://your-domain/send

export async function sendPdfViaEmail(to: string, subject: string, filename: string, pdfBlob: Blob) {
  if (!EMAIL_API_URL) {
    return { ok: false, reason: "Geen EMAIL_API_URL geconfigureerd." };
  }
  const arrBuf = await pdfBlob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrBuf)));

  const res = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, filename, fileBase64: base64, mime: "application/pdf" }),
  });
  if (!res.ok) {
    return { ok: false, reason: `Server ${res.status}` };
  }
  return { ok: true };
}
