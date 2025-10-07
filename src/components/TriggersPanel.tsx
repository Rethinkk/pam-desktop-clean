/**
 * TriggersPanel.tsx — polished UI (scoped), same functionality
 * Data stores: pam-assets-v1, pam-people-v1, pam-triggers-v1
 */

import * as React from 'react';
import './TriggersPanel.css'; // <- scoped styles for this panel only

// ---------------- Types ----------------
export type Person = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  displayName?: string;
  email?: string;
};
export type Asset = {
  id?: string;
  _id?: string;
  key?: string;
  label?: string;
  name?: string;
  title?: string;
  domain?: string;
  typeLabel?: string;
  type?: string;
  category?: string;
  expiryDate?: string;
  endDate?: string;
  vervaldatum?: string;
  expiry?: string;
  validUntil?: string;
  ownerIds?: string[];
  ownerId?: string;
  peopleIds?: string[];
  personIds?: string[];
  costPerYear?: number;
  pricePerYear?: number;
  premium?: number;
  kosten?: number;
};
export type Trigger = {
  id: string;
  type: 'expiry-reminder';
  label: string;
  enabled: boolean;
  monthsAhead: number; // 1|2|3|6|12
  targetPeopleIds: string[]; // empty = everyone
  typeFilters: string[]; // empty = default set
};
export type ExpiryItem = {
  id: string;
  typeLabel: string;
  label: string;
  ownerIds: string[];
  owners: { id: string; name?: string; email?: string }[];
  expiryDate?: string; // YYYY-MM-DD
  costPerYear?: number;
};

// ---------------- Constants ----------------
const KEYS = {
  ASSETS: 'pam-assets-v1',
  PEOPLE: 'pam-people-v1',
  TRIGGERS: 'pam-triggers-v1',
} as const;
const DEFAULT_SUPPORTED_TYPES = [
  'Abonnementen',
  'Domeinnamen',
  'Rijbewijzen',
  'Identificatie bewijzen',
] as const;

// ---------------- Utils ----------------
function safeParseJSON<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function addMonths(d: Date, m: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function dateLoose(v: unknown): Date | null {
  if (!v) return null;
  const s = typeof v === 'string' ? v : String(v);
  const d = new Date(s);
  return Number.isNaN(+d) ? null : d;
}
function csvEscape(s: string) {
  return '"' + s.replace(/"/g, '""') + '"';
}
function dl(name: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function fmtEUR(n?: number) {
  return Number.isFinite(Number(n))
    ? new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
      }).format(Number(n))
    : '';
}

// ---------------- Storage + normalizers ----------------
function getPeopleMap(): Map<string, Person> {
  const parsed = safeParseJSON<any>(localStorage.getItem(KEYS.PEOPLE), []);
  const arr: Person[] = Array.isArray(parsed?.people)
    ? parsed.people
    : Array.isArray(parsed)
      ? parsed
      : [];
  const map = new Map<string, Person>();
  for (const p of arr) {
    const id = p?.id || p?._id || p?.email || p?.name;
    if (id) map.set(String(id), p);
  }
  return map;
}
function getAssetsArray(): Asset[] {
  const parsed = safeParseJSON<any>(localStorage.getItem(KEYS.ASSETS), []);
  return Array.isArray(parsed?.assets)
    ? parsed.assets
    : Array.isArray(parsed?.rows)
      ? parsed.rows
      : Array.isArray(parsed)
        ? parsed
        : [];
}
function loadTriggers(): Trigger[] {
  const parsed = safeParseJSON<any>(localStorage.getItem(KEYS.TRIGGERS), []);
  return Array.isArray(parsed) ? (parsed as Trigger[]) : [];
}
function saveTriggers(list: Trigger[]): void {
  localStorage.setItem(KEYS.TRIGGERS, JSON.stringify(list));
}

// ---------------- Core selection ----------------
function collect(typeFilters: string[]): ExpiryItem[] {
  const people = getPeopleMap();
  const assets = getAssetsArray();
  const allow = new Set<string>(
    typeFilters.length ? typeFilters : [...DEFAULT_SUPPORTED_TYPES],
  );
  const out: ExpiryItem[] = [];
  for (const a of assets) {
    const typeLabel = a.typeLabel || a.type || a.category || '';
    if (!allow.has(typeLabel)) continue;
    const expiryRaw =
      a.expiryDate || a.endDate || a.vervaldatum || a.expiry || a.validUntil;
    const expiry = dateLoose(expiryRaw);
    const ownerIds: string[] = Array.isArray(a.ownerIds)
      ? a.ownerIds
      : a.ownerId
        ? [a.ownerId]
        : Array.isArray(a.peopleIds)
          ? a.peopleIds
          : Array.isArray(a.personIds)
            ? a.personIds
            : [];
    const owners = ownerIds.map((id) => {
      const p = people.get(String(id));
      return p
        ? {
            id: String(id),
            name: p.name || p.fullName || p.displayName,
            email: p.email,
          }
        : { id: String(id) };
    });
    out.push({
      id:
        a.id ||
        a._id ||
        a.key ||
        a.label ||
        Math.random().toString(36).slice(2),
      typeLabel,
      label: a.label || a.name || a.title || a.domain || '(zonder titel)',
      ownerIds,
      owners,
      expiryDate: expiry ? toISO(expiry) : undefined,
      costPerYear:
        a.costPerYear ?? a.pricePerYear ?? a.premium ?? a.kosten ?? undefined,
    });
  }
  return out;
}
function itemsForTrigger(t: Trigger): ExpiryItem[] {
  if (t.type !== 'expiry-reminder') return [];
  const items = collect(t.typeFilters || []);
  const now = new Date();
  const limit = addMonths(now, t.monthsAhead || 1);
  return items
    .filter((r) => r.expiryDate)
    .filter((r) => {
      const d = dateLoose(r.expiryDate);
      return !!d && d >= now && d <= limit;
    })
    .filter(
      (r) =>
        !t.targetPeopleIds?.length ||
        r.ownerIds?.some((id) =>
          new Set(t.targetPeopleIds.map(String)).has(String(id)),
        ),
    )
    .sort((a, b) => (String(a.expiryDate) < String(b.expiryDate) ? -1 : 1));
}

// ---------------- Exports (CSV/ICS/email) ----------------
function toCSV(rows: ExpiryItem[]): string {
  const head = [
    'Type',
    'Naam',
    'Vervaldatum',
    'Eigenaren',
    'E-mails',
    'Kosten/jaar',
  ];
  const body = rows.map((r) => [
    r.typeLabel,
    r.label,
    r.expiryDate || '',
    r.owners.map((o) => o.name || o.id).join('; '),
    r.owners
      .map((o) => o.email || '')
      .filter(Boolean)
      .join('; '),
    r.costPerYear != null ? String(r.costPerYear) : '',
  ]);
  const lines = [head, ...body]
    .map((line) => line.map((v) => csvEscape(String(v))).join(','))
    .join('\n');
  return lines + '\n';
}
function icsDate(iso: string) {
  return iso.replace(/-/g, '') + 'T090000Z';
}
function toICS(rows: ExpiryItem[]): string {
  const NL = '\r\n',
    uid = () => Math.random().toString(36).slice(2) + '@pam',
    now = icsDate(toISO(new Date()));
  const L: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PAM//Triggers//NL',
  ];
  for (const r of rows) {
    if (!r.expiryDate) continue;
    L.push('BEGIN:VEVENT');
    L.push('UID:' + uid());
    L.push('DTSTAMP:' + now);
    L.push('DTSTART:' + icsDate(r.expiryDate));
    L.push('SUMMARY:' + `VERVALT: ${r.label} (${r.typeLabel})`);
    L.push(
      'DESCRIPTION:' +
        `Eigenaren: ${r.owners.map((o) => o.name || o.id).join(', ')}`,
    );
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join(NL);
}
function buildEmailDraft(
  rows: ExpiryItem[],
  monthsAhead: number,
): { href: string; preview: string } {
  const grouped = new Map<
    string,
    { name?: string; email?: string; items: ExpiryItem[] }
  >();
  for (const r of rows)
    for (const o of r.owners) {
      const k = o.email || o.id;
      const g = grouped.get(k) || { name: o.name, email: o.email, items: [] };
      g.items.push(r);
      grouped.set(k, g);
    }
  const emails = Array.from(grouped.values())
    .map((g) => g.email)
    .filter((e): e is string => Boolean(e))
    .join(',');
  const subject = encodeURIComponent(
    `Heads-up: items die binnen ${monthsAhead} maand(en) verlopen`,
  );
  const lines = [
    'Beste allemaal,',
    '',
    `Even een seintje: onderstaande items verlopen binnen ${monthsAhead} maand(en).`,
    '',
  ];
  rows.forEach((r) =>
    lines.push(`- ${r.label} (${r.typeLabel}) — ${r.expiryDate || 'onbekend'}`),
  );
  lines.push('', 'Groet,');
  const body = encodeURIComponent(lines.join('\n'));
  return {
    href: `mailto:?bcc=${encodeURIComponent(emails)}&subject=${subject}&body=${body}`,
    preview: lines.join('\n'),
  };
}

// ---------------- Tiny UI helpers ----------------
function Chip(props: {
  active: boolean;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  const { active, title, onClick, children } = props;
  return (
    <button
      className={`tp-chip ${active ? 'is-active' : ''}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      <span className="tp-chip-box">{active ? '✓' : ''}</span>
      <span>{children}</span>
    </button>
  );
}
function Switch(props: {
  checked: boolean;
  onChange: (v: boolean) => void;
}): React.ReactElement {
  const { checked, onChange } = props;
  return (
    <button
      className={`tp-switch ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      type="button"
    >
      <span className="tp-switch-handle" />
      <span className="tp-switch-label">{checked ? 'aan' : 'uit'}</span>
    </button>
  );
}

// ---------------- Form: new trigger ----------------
function TriggerForm(props: {
  onAdd: (t: Trigger) => void;
}): React.ReactElement {
  const { onAdd } = props;
  const peopleMap = React.useMemo(() => getPeopleMap(), []);
  const people = React.useMemo(
    () =>
      Array.from(peopleMap.values()).map((p) => ({
        id: String(p.id || p._id || p.email || p.name),
        name:
          p.name ||
          p.fullName ||
          p.displayName ||
          p.email ||
          String(p.id || p._id) ||
          '(naamloos)',
        email: p.email,
      })),
    [peopleMap],
  );

  // --- Koppeling tussen Label en Melden ---
  const makeLabel = (m: number) =>
    `Expiraties binnen ${m} maand${m === 1 ? '' : 'en'}`;

  const [monthsAhead, setMonthsAhead] = React.useState<number>(2);
  const [label, setLabel] = React.useState<string>(makeLabel(2));
  const [labelTouched, setLabelTouched] = React.useState<boolean>(false);

  const [targetPeopleIds, setTargetPeopleIds] = React.useState<string[]>([]);
  const [typeFilters, setTypeFilters] = React.useState<string[]>([
    ...DEFAULT_SUPPORTED_TYPES,
  ]);

  function togglePerson(id: string) {
    setTargetPeopleIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }
  function toggleType(t: string) {
    setTypeFilters((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t],
    );
  }

  function submit() {
    const finalLabel = (label || '').trim() || makeLabel(monthsAhead);
    const t: Trigger = {
      id: Math.random().toString(36).slice(2),
      type: 'expiry-reminder',
      label: finalLabel,
      enabled: true,
      monthsAhead,
      targetPeopleIds,
      typeFilters,
    };
    onAdd(t);
    // reset
    setMonthsAhead(2);
    setLabel(makeLabel(2));
    setLabelTouched(false);
    setTargetPeopleIds([]);
    setTypeFilters([...DEFAULT_SUPPORTED_TYPES]);
  }

  return (
    <div className="tp-card">
      <div className="tp-form">
        <div className="tp-form-title">Nieuwe trigger</div>

        {/* 1) Informeer mij (eerst) */}
        <div className="tp-field-row">
          <span className="tp-label">Informeer mij</span>
          <select
            className="tp-select"
            value={monthsAhead}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const m = Number(e.target.value);
              setMonthsAhead(m);
              const autoLabelRegex = /^Expiraties binnen \d+\s*maand(en)?$/i;
              if (!labelTouched || autoLabelRegex.test(label.trim())) {
                setLabel(makeLabel(m));
              }
            }}
          >
            {[1, 2, 3, 6, 12].map((m) => (
              <option key={m} value={m}>
                {m} maand(en) vooraf
              </option>
            ))}
          </select>
        </div>

        {/* 2) Label (eronder) */}
        <label className="tp-field">
          <span className="tp-label">Label</span>
          <input
            className="tp-input"
            value={label}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setLabelTouched(true);
              setLabel(e.target.value);
            }}
          />
        </label>

        {/* Types */}
        <div className="tp-field">
          <div className="tp-label">Types:</div>
          <div className="tp-chip-row">
            {DEFAULT_SUPPORTED_TYPES.map((t) => (
              <Chip
                key={t}
                active={typeFilters.includes(t)}
                onClick={() => toggleType(t)}
              >
                {t}
              </Chip>
            ))}
          </div>
        </div>

        {/* Personen */}
        <div className="tp-field">
          <div className="tp-label">Personen:</div>
          <div className="tp-chip-row">
            {people.length === 0 ? (
              <span className="tp-muted">(geen personen beschikbaar)</span>
            ) : (
              people.map((p) => (
                <Chip
                  key={p.id}
                  active={targetPeopleIds.includes(p.id)}
                  onClick={() => togglePerson(p.id)}
                  title={p.email || ''}
                >
                  {p.name}
                </Chip>
              ))
            )}
          </div>
        </div>

        <div className="tp-actions-right">
          <button
            className="tp-btn tp-btn-primary"
            onClick={submit}
            type="button"
          >
            Trigger toevoegen
          </button>
        </div>
      </div>
    </div>
  );
}
// ---------------- Card: trigger preview/actions ----------------
function TriggerCard(props: {
  t: Trigger;
  onChange: (t: Trigger) => void;
  onDelete: (id: string) => void;
}): React.ReactElement {
  const { t, onChange, onDelete } = props;
  const rows = React.useMemo(() => itemsForTrigger(t), [t]);
  const draft = React.useMemo(
    () => buildEmailDraft(rows, t.monthsAhead),
    [rows, t.monthsAhead],
  );
  const total = React.useMemo(
    () => rows.reduce((s, r) => s + (Number(r.costPerYear) || 0), 0),
    [rows],
  );

  function onDeleteClick() {
    if (confirm(`Trigger verwijderen: “${t.label}”?`)) onDelete(t.id);
  }

  return (
    <div className="tp-card">
      <div className="tp-card-head">
        <div className="tp-card-title">
          <Switch
            checked={t.enabled}
            onChange={(v: boolean) => onChange({ ...t, enabled: v })}
          />
          <span className="tp-title-text">{t.label}</span>
          {rows.length > 0 && <span className="tp-badge">{rows.length}</span>}
        </div>
        <button
          className="tp-link-danger"
          onClick={onDeleteClick}
          type="button"
        >
          verwijderen
        </button>
      </div>

      <div className="tp-subtle">
        {t.monthsAhead} maand(en) vooraf • Types:{' '}
        {(t.typeFilters?.length
          ? t.typeFilters
          : Array.from(DEFAULT_SUPPORTED_TYPES)
        ).join(', ')}
        {t.targetPeopleIds?.length
          ? ` • Personen: ${t.targetPeopleIds.length}`
          : ''}
      </div>

      <div className="tp-table-wrap">
        <table className="tp-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Type</th>
              <th>Item</th>
              <th>Eigenaar / e-mail</th>
              <th className="tp-num">Kosten/jaar</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="tp-empty" colSpan={5}>
                  Geen expiraties binnen de ingestelde periode.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.expiryDate || '?'}</td>
                  <td>{r.typeLabel}</td>
                  <td>{r.label}</td>
                  <td>
                    {r.owners.length ? (
                      r.owners.map((o) => (
                        <div key={o.id}>
                          <span>{o.name || o.id}</span>
                          {o.email ? (
                            <>
                              {' '}
                              · <a href={`mailto:${o.email}`}>{o.email}</a>
                            </>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <span className="tp-muted">(geen eigenaar)</span>
                    )}
                  </td>
                  <td className="tp-num">{fmtEUR(r.costPerYear)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="tp-toolbar">
        <div className="tp-subtle">
          Totaal kosten/jaar (zichtbaar): {fmtEUR(total)}
        </div>
        <div className="tp-btn-row">
          <button
            className="tp-btn"
            onClick={() =>
              dl(
                `trigger_${t.id}_${t.monthsAhead}m.csv`,
                toCSV(rows),
                'text/csv;charset=utf-8',
              )
            }
          >
            Export CSV
          </button>
          <button
            className="tp-btn"
            onClick={() =>
              dl(
                `trigger_${t.id}_${t.monthsAhead}m.ics`,
                toICS(rows),
                'text/calendar;charset=utf-8',
              )
            }
          >
            Export ICS
          </button>
          <button
            className="tp-btn"
            onClick={() => {
              const txt = rows
                .map(
                  (r) =>
                    `${r.expiryDate || '????-??-??'} • ${r.typeLabel} • ${r.label}`,
                )
                .join('\n');
              if (navigator.clipboard?.writeText)
                navigator.clipboard.writeText(txt).catch(() => {});
            }}
          >
            Kopieer lijst
          </button>
          <a className="tp-btn-link" href={draft.href}>
            Maak e-mails
          </a>
        </div>
      </div>

      <details className="tp-details">
        <summary>Voorbeeld e-mailtekst</summary>
        <pre className="tp-pre">{draft.preview}</pre>
      </details>
    </div>
  );
}

// ---------------- Main ----------------
export default function TriggersPanel(): React.ReactElement {
  const [triggers, setTriggers] = React.useState<Trigger[]>(() =>
    loadTriggers(),
  );
  const addTrigger = React.useCallback(
    (t: Trigger) => {
      const list = [t, ...triggers];
      setTriggers(list);
      saveTriggers(list);
    },
    [triggers],
  );
  const updateTrigger = React.useCallback(
    (t: Trigger) => {
      const list = triggers.map((x) => (x.id === t.id ? t : x));
      setTriggers(list);
      saveTriggers(list);
    },
    [triggers],
  );
  const deleteTrigger = React.useCallback(
    (id: string) => {
      const list = triggers.filter((x) => x.id !== id);
      setTriggers(list);
      saveTriggers(list);
    },
    [triggers],
  );

  return (
    <div className="tp">
      <h2 className="tp-h2">Triggers</h2>
      <p className="tp-subtle">
        Stel automatiseringen in die je vooraf waarschuwen of acties
        klaarzetten.
      </p>

      <TriggerForm onAdd={addTrigger} />

      {triggers.length === 0 ? (
        <div className="tp-empty-note">Nog geen triggers ingesteld.</div>
      ) : (
        <div className="tp-list">
          {triggers.map((t) => (
            <TriggerCard
              key={t.id}
              t={t}
              onChange={updateTrigger}
              onDelete={deleteTrigger}
            />
          ))}
        </div>
      )}
    </div>
  );
}
