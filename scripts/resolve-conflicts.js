const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IGNORE = new Set(['node_modules','dist','target','.git','.next','.turbo']);

function listFiles(dir) {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of ents) {
    if (IGNORE.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(listFiles(p));
    else files.push(p);
  }
  return files;
}

function resolveConflicts(content) {
  const lines = content.split(/\r?\n/);
  let out = [];
  let state = 'normal'; // normal | inTop | inBottom
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.startsWith('<<<<<<< ')) { state = 'inTop'; changed = true; continue; }
    if (ln.startsWith('=======')) { if (state === 'inTop') state = 'inBottom'; continue; }
    if (ln.startsWith('>>>>>>> ')) { state = 'normal'; continue; }

    if (state === 'normal' || state === 'inTop') {
      out.push(ln);
    }
    // state === 'inBottom' => sla regels over
  }

  return { changed, text: out.join('\n') };
}

const files = listFiles(ROOT);
let cleaned = [];
for (const f of files) {
  try {
    const txt = fs.readFileSync(f, 'utf8');
    if (!(/<<<<<<< |=======|>>>>>>> /m.test(txt))) continue;
    const { changed, text } = resolveConflicts(txt);
    if (changed) {
      fs.writeFileSync(f + '.BAK.conflict', txt, 'utf8'); // backup
      fs.writeFileSync(f, text, 'utf8');
      cleaned.push(path.relative(ROOT, f));
    }
  } catch(_) {}
}

if (cleaned.length) {
  console.log('Cleaned files:\n' + cleaned.map(s => ' - ' + s).join('\n'));
} else {
  console.log('No conflict markers found.');
}
