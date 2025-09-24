import React, { useEffect, useMemo, useRef, useState } from 'react'

import CategorySelect from "./components/CategorySelect";

type Asset = {
  id: string
  category: string
  name: string
  value?: number
  notes?: string
  createdAt: string
}

const LS_KEY = 'pam-assets-v1'


export default function App() {
  const [tab, setTab] = useState<'assets' | 'docs' | 'about'>('assets')

  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [value, setValue] = useState<string>('')
  const [notes, setNotes] = useState('')

  const [assets, setAssets] = useState<Asset[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(assets)) } catch {} }, [assets])

  const [query, setQuery] = useState('')
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const arr = q
      ? assets.filter(a => [a.name, a.category, a.notes ?? ''].join(' ').toLowerCase().includes(q))
      : assets.slice()
    arr.sort((a, b) => {
      const an = a.name.toLowerCase(), bn = b.name.toLowerCase()
      const cmp = an < bn ? -1 : an > bn ? 1 : 0
      return sortAsc ? cmp : -cmp
    })
    return arr
  }, [assets, query, sortAsc])

  function addAsset(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setAssets(prev => [{
      id: crypto.randomUUID(),
      category: category || 'Onbekend',
      name: name.trim(),
      value: value ? Number(value) : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    }, ...prev])
    setCategory(''); setName(''); setValue(''); setNotes('')
  }

  function removeAsset(id: string) {
    setAssets(prev => prev.filter(a => a.id !== id))
  }

  const fileRef = useRef<HTMLInputElement>(null)
  function exportJSON() {
    const blob = new Blob([JSON.stringify(assets, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'assets-export.json'; a.click()
    URL.revokeObjectURL(url)
  }
  async function importJSON(file: File | null) {
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Asset[]
      if (!Array.isArray(parsed)) throw new Error('Ongeldig formaat')
      setAssets(parsed)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e:any) {
      alert('Import mislukt: ' + e.message)
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', lineHeight: 1.4 }}>
      <header style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>PAM — no-bundler modus</h1>
        <nav style={{ marginTop: 10, display: 'flex', gap: 10 }}>
          <button onClick={() => setTab('assets')} style={btn(tab === 'assets')}>Assets</button>
          <button onClick={() => setTab('docs')} style={btn(tab === 'docs')}>Documenten</button>
          <button onClick={() => setTab('about')} style={btn(tab === 'about')}>Over</button>
        </nav>
      </header>

      {tab === 'assets' && (
        <main style={{ padding: 20, display: 'grid', gap: 20 }}>
          <section style={card()}>
            <h2 style={h2()}>Nieuw asset</h2>
            <form onSubmit={addAsset} style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
              <label style={label()}><span>Naam (bv. ING spaarrekening)</span>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Naam" style={input()} />
              </label>
              <label style={label()}><span>Category</span>
                <CategorySelect value={category} onChange={setCategory} required 
placeholder="Naam" style={input()} />
              </label>
              <label style={label()}><span>Waarde (optioneel, numeriek)</span>
                <input value={value} onChange={e => setValue(e.target.value)} placeholder="0" inputMode="decimal" style={input()} />
              </label>
              <label style={label()}><span>Notities (optioneel)</span>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Opmerkingen…" style={textarea()} />
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={primary()}>Toevoegen</button>
                <span style={{ alignSelf: 'center', color: '#6b7280' }}>Data wordt lokaal opgeslagen (localStorage).</span>
              </div>
            </form>
          </section>

          <section style={card()}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <h2 style={h2()}>Assets</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Zoek op naam/categorie/id…" style={input()} />
                <button onClick={() => setSortAsc(s => !s)} style={btn(false)}>Sort: Naam {sortAsc ? '↑' : '↓'}</button>
                <button onClick={exportJSON} style={btn(false)}>Export JSON</button>
                <label style={fileBtn()}>
                  <span>Importeren</span>
                  <input ref={fileRef} type="file" accept="application/json" onChange={e => importJSON(e.target.files?.[0] ?? null)} hidden />
                </label>
              </div>
            </div>

            {filtered.length === 0 ? (
              <p style={{ color: '#6b7280', marginTop: 12 }}>Geen assets.</p>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={th()}>Naam</th><th style={th()}>Categorie</th><th style={th()}>Waarde</th><th style={th()}>Aangemaakt</th><th style={th()}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => (
                      <tr key={a.id}>
                        <td style={td()}>{a.name}</td>
                        <td style={td()}>{a.category}</td>
                        <td style={td()}>{typeof a.value === 'number' ? a.value.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' }) : '—'}</td>
                        <td style={td()}>{new Date(a.createdAt).toLocaleString('nl-NL')}</td>
                        <td style={td({ textAlign: 'right' })}><button onClick={() => removeAsset(a.id)} style={danger()}>Verwijderen</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      )}

      {tab === 'docs' && (
        <main style={{ padding: 20 }}>
          <section style={card()}>
            <h2 style={h2()}>Documenten</h2>
            <p>Uploaden/koppelen van bijlagen kan later worden toegevoegd.</p>
          </section>
        </main>
      )}

      {tab === 'about' && (
        <main style={{ padding: 20 }}>
          <section style={card()}>
            <h2 style={h2()}>Over</h2>
            <p>PAM — eenvoudige desktopapp voor assets en notities. Opslag: <code>localStorage</code> op dit apparaat.</p>
          </section>
        </main>
      )}
    </div>
  )
}

const btn = (active: boolean): React.CSSProperties => ({
  padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db',
  background: active ? '#111827' : '#fff', color: active ? '#fff' : '#111827', cursor: 'pointer'
})
const primary = (): React.CSSProperties => ({
  padding: '10px 14px', borderRadius: 8, background: '#111827', color: '#fff', border: '1px solid #111827', cursor: 'pointer'
})
const danger = (): React.CSSProperties => ({
  padding: '6px 10px', borderRadius: 8, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', cursor: 'pointer'
})
const input = (): React.CSSProperties => ({
  padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', width: 280
})
const textarea = (): React.CSSProperties => ({
  padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', width: 420
})
const label = (): React.CSSProperties => ({ display: 'grid', gap: 6 })
const card = (): React.CSSProperties => ({
  border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
})
const h2 = (): React.CSSProperties => ({ margin: 0, fontSize: 18, marginBottom: 8 })
const th = (): React.CSSProperties => ({ textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb', padding: '8px 6px', whiteSpace: 'nowrap' })
const td = (extra: Partial<React.CSSProperties> = {}): React.CSSProperties => ({ borderBottom: '1px solid #f3f4f6', padding: '8px 6px', ...extra })

const fileBtn = (): React.CSSProperties => ({
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#111827',
  cursor: 'pointer',
  display: 'inline-block'
})
