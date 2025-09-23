// ---------- Storage ----------
const KEY_ASSETS = 'pam.assets.v1';
const KEY_DOCS   = 'pam.docs.v1'; // attachments/inbox

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function uid(prefix='id') { return `${prefix}-` + Math.random().toString(36).slice(2,10); }

// ---------- State ----------
let ASSETS = load(KEY_ASSETS, []);
let DOCS   = load(KEY_DOCS, []);   // {id, name, mime, dataUrl, archived:false, linkedAssetId:null}

// ---------- Helpers ----------
const el = id => document.getElementById(id);
const escapeHtml = s => String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

// ---------- Tabs ----------
function show(tab) {
  el('tab-assets').classList.toggle('active', tab==='assets');
  el('tab-docs').classList.toggle('active', tab==='docs');
  el('tab-about').classList.toggle('active', tab==='about');
  el('view-assets').style.display = tab==='assets'? '' : 'none';
  el('view-docs').style.display   = tab==='docs'  ? '' : 'none';
  el('view-about').style.display  = tab==='about' ? '' : 'none';
  if (tab==='docs') { renderDocs(); }
}
el('tab-assets').onclick = ()=> show('assets');
el('tab-docs').onclick   = ()=> show('docs');
el('tab-about').onclick  = ()=> show('about');

// ---------- Assets UI ----------
const $list = el('list');
const $search = el('search');
const $sort = el('sort');

function renderAssets() {
  const q = ($search.value||'').toLowerCase();
  let rows = [...ASSETS];

  if (q) {
    rows = rows.filter(a =>
      (a.name||'').toLowerCase().includes(q) ||
      (a.category||'').toLowerCase().includes(q) ||
      (a.id||'').toLowerCase().includes(q)
    );
  }
  const s = $sort.value;
  rows.sort((a,b)=>{
    if (s==='value') return (Number(b.value||0) - Number(a.value||0));
    return String(a[s]||'').localeCompare(String(b[s]||''), 'nl', {sensitivity:'base'});
  });

  $list.innerHTML = '';
  rows.forEach(a=>{
    const attCount = (a.attachment_ids||[]).length;
    const li = document.createElement('li');
    li.innerHTML = `
      <div style="flex:1">
        <div><strong>${escapeHtml(a.name||'—')}</strong> <span class="pill">${escapeHtml(a.category||'—')}</span></div>
        <div class="muted">${escapeHtml(a.id||'')} ${a.value ? ` · €${Number(a.value).toLocaleString('nl-NL')}`:''}
          ${attCount? ` · 📎 ${attCount}`:''}
        </div>
        ${a.notes ? `<div class="muted">${escapeHtml(a.notes)}</div>`:''}
      </div>
      <div class="actions">
        <button data-act="edit">Wijzig</button>
        <button data-act="del">Verwijder</button>
      </div>
    `;
    li.querySelector('[data-act="edit"]').onclick = ()=> editAsset(a.id_internal);
    li.querySelector('[data-act="del"]').onclick = ()=> deleteAsset(a.id_internal);
    $list.appendChild(li);
  });

  // vul de asset-select voor Documenten-tab
  const sel = el('asset-select');
  sel.innerHTML = '';
  ASSETS.forEach(a=>{
    const opt = document.createElement('option');
    opt.value = a.id_internal;
    opt.textContent = `${a.category||'—'} — ${a.name||'—'}`;
    sel.appendChild(opt);
  });
}

el('btn-add').onclick = ()=>{
  const a = {
    id_internal: uid('ast'),
    id: el('a-id').value.trim(),
    category: el('a-category').value.trim(),   // terug naar tekstveld
    name: el('a-name').value.trim(),
    value: el('a-value').value ? Number(el('a-value').value) : null,
    notes: el('a-notes').value.trim(),
    attachment_ids: []
  };
  if (!a.name) { alert('Naam is verplicht'); return; }
  ASSETS.push(a);
  save(KEY_ASSETS, ASSETS);
  ['a-id','a-category','a-name','a-value','a-notes'].forEach(id=> el(id).value='');
  renderAssets();
};

function editAsset(id) {
  const a = ASSETS.find(x=>x.id_internal===id); if (!a) return;
  const name = prompt('Naam', a.name||''); if (name===null) return;
  const category = prompt('Categorie', a.category||''); if (category===null) return;
  const extId = prompt('Identificatie', a.id||''); if (extId===null) return;
  const valueStr = prompt('Waarde (numeriek of leeg)', a.value==null?'':String(a.value)); if (valueStr===null) return;
  const notes = prompt('Notities', a.notes||''); if (notes===null) return;
  a.name = name.trim();
  a.category = category.trim();
  a.id = extId.trim();
  a.value = valueStr.trim()? Number(valueStr): null;
  a.notes = notes.trim();
  save(KEY_ASSETS, ASSETS);
  renderAssets();
}
function deleteAsset(id) {
  if (!confirm('Weet je zeker dat je dit asset wilt verwijderen?')) return;
  ASSETS = ASSETS.filter(x=>x.id_internal!==id);
  DOCS = DOCS.map(d => d.linkedAssetId===id ? {...d, linkedAssetId:null} : d);
  save(KEY_ASSETS, ASSETS); save(KEY_DOCS, DOCS);
  renderAssets(); renderDocs();
}

$search.oninput = renderAssets;
$sort.onchange  = renderAssets;

el('btn-export').onclick = ()=>{
  const blob = new Blob([JSON.stringify({ assets: ASSETS, docs: DOCS }, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pam_data.json';
  a.click(); URL.revokeObjectURL(url);
};
el('btn-import').onclick = async ()=>{
  const input = el('file-import');
  if (!input.files || !input.files[0]) { alert('Kies eerst een JSON-bestand'); return; }
  try {
    const text = await input.files[0].text();
    const json = JSON.parse(text);
    if (!Array.isArray(json.assets)) throw new Error('Ongeldige JSON: assets ontbreekt');
    ASSETS = json.assets.map(a => ({...a, id_internal: a.id_internal || uid('ast'), attachment_ids: a.attachment_ids||[]}));
    DOCS   = Array.isArray(json.docs) ? json.docs : [];
    save(KEY_ASSETS, ASSETS); save(KEY_DOCS, DOCS);
    renderAssets(); renderDocs();
  } catch (e) { alert('Import mislukt: ' + e.message); }
};

// ---------- Documenten (Swipe-inbox) ----------
const $files = el('files');
const $inboxList = el('inbox-list');
const $previewBox = el('preview-box');
const $docMeta = el('doc-meta');

function renderDocs() {
  const inbox = DOCS.filter(d => !d.archived);
  $inboxList.innerHTML = '';
  inbox.forEach(d=>{
    const li = document.createElement('li');
    li.innerHTML = `
      <div style="flex:1">
        <div><strong>${escapeHtml(d.name)}</strong> <span class="pill">${escapeHtml(d.mime)}</span></div>
        <div class="tiny muted">${d.linkedAssetId ? '🔗 gekoppeld' : '— niet gekoppeld —'}</div>
      </div>
      <div class="actions nowrap">
        <button data-act="pick">Openen</button>
        <button data-act="arch">Archiveer</button>
      </div>
    `;
    li.querySelector('[data-act="pick"]').onclick = ()=> openDoc(d.id);
    li.querySelector('[data-act="arch"]').onclick = ()=> archiveDoc(d.id);
    $inboxList.appendChild(li);
  });

  if (inbox[0]) renderDocPreview(inbox[0].id);
  else {
    $previewBox.innerHTML = `<div class="tiny muted">Inbox leeg. Importeer bestanden om te starten.</div>`;
    $docMeta.textContent = '';
  }

  const sel = el('asset-select');
  sel.innerHTML = '';
  ASSETS.forEach(a=>{
    const opt = document.createElement('option');
    opt.value = a.id_internal;
    opt.textContent = `${a.category||'—'} — ${a.name||'—'}`;
    sel.appendChild(opt);
  });
}

async function filesToDocs(files) {
  for (const f of files) {
    const dataUrl = await fileToDataURL(f);
    DOCS.push({
      id: uid('doc'),
      name: f.name,
      mime: f.type || 'application/octet-stream',
      dataUrl,
      archived: false,
      linkedAssetId: null
    });
  }
  save(KEY_DOCS, DOCS);
  renderDocs();
}
function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
$files.onchange = e => {
  const files = e.target.files;
  if (!files || !files.length) return;
  filesToDocs(files);
  $files.value = '';
};

function openDoc(id) { renderDocPreview(id); }
function archiveDoc(id) {
  const d = DOCS.find(x=>x.id===id); if (!d) return;
  d.archived = true;
  save(KEY_DOCS, DOCS);
  renderDocs();
}
el('btn-clear-arch').onclick = ()=>{
  DOCS = DOCS.map(d => ({...d, archived:true}));
  save(KEY_DOCS, DOCS);
  renderDocs();
};

function renderDocPreview(id) {
  const d = DOCS.find(x=>x.id===id); if (!d) return;
  $docMeta.textContent = `${d.name} — ${d.mime}`;
  if (d.mime.startsWith('image/')) {
    $previewBox.innerHTML = `<img class="thumb" src="${d.dataUrl}" alt="${escapeHtml(d.name)}"/>`;
  } else {
    $previewBox.innerHTML = `<div class="docbox"><strong>${escapeHtml(d.name)}</strong><div class="tiny muted">${escapeHtml(d.mime)}</div><div class="tiny muted">Voorbeeld niet beschikbaar</div></div>`;
  }
  el('btn-archive').dataset.doc = id;
  el('btn-link').dataset.doc = id;
}

el('btn-archive').onclick = ()=>{
  const id = el('btn-archive').dataset.doc;
  if (!id) return;
  archiveDoc(id);
};
el('btn-link').onclick = ()=>{
  const id = el('btn-link').dataset.doc;
  const assetId = el('asset-select').value;
  if (!id || !assetId) { alert('Kies een asset.'); return; }
  const d = DOCS.find(x=>x.id===id); if (!d) return;

  d.linkedAssetId = assetId;

  const a = ASSETS.find(x=>x.id_internal===assetId);
  if (a) {
    a.attachment_ids = a.attachment_ids || [];
    if (!a.attachment_ids.includes(id)) a.attachment_ids.push(id);
  }

  save(KEY_DOCS, DOCS); save(KEY_ASSETS, ASSETS);
  renderAssets(); renderDocs();
};

// ---------- Init ----------
renderAssets();
