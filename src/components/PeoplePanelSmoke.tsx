


/* @ts-nocheck */
import React from "react";
import { allPeople, upsertPerson } from "../lib/peopleStore";

export default function PeoplePanelSmoke() {
  const [count, setCount] = React.useState<number>(() => {
    try { return (allPeople() || []).length; } catch { return -1; }
  });

  const seed = () => {
    const now = new Date().toISOString();
    try {
      upsertPerson({
        id: String(Date.now()),
        name: "Test Persoon",
        fullName: "Test Persoon",
        role: "overig",
        createdAt: now,
        updatedAt: now,
      });
      setCount((allPeople() || []).length);
    } catch (e) {
        const msg =
        e instanceof Error
          ? e.message
          : (e && typeof e === "object" && "message" in e
              ? (e as any).message
              : String(e));
      console.error("seed failed", e);
      alert("seed failed: " + msg);
    }
  };

  return (
    <div style={{padding:12, border:'1px solid #ddd', borderRadius:8}}>
      <div data-test="people-smoke-title" style={{fontWeight:700}}>
        PEOPLE SMOKE — mounted ✅
      </div>
      <div data-test="people-smoke-count">records: {String(count)}</div>
      <button onClick={seed} style={{marginTop:8, padding:'6px 10px', border:'1px solid #ccc', borderRadius:6}}>
        Voeg testpersoon toe
      </button>
    </div>
  );
}
