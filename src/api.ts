const API = (import.meta as any).env.VITE_API_BASE as string;

async function j(r: Response) {
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const api = {
  ping: () => fetch(`${API}/healthz`).then(r => r.text()),
  listPeople: () => fetch(`${API}/people`).then(j),
  createPerson: (p: any) =>
    fetch(`${API}/people`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).then(j),
  listAssets: () => fetch(`${API}/assets`).then(j),
  createAsset: (a: any) =>
    fetch(`${API}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(a),
    }).then(j),
};
