touch Tue Sep 23 21:23:53 CEST 2025

Plak dit in je projectroot:

# In je projectmap (waar README.md staat)
cd ~/projecten/pam-desktop-stable

# Secties toevoegen aan README.md
cat >> README.md <<'MD'

---

# Release checklist

## 1) Pre-flight
```bash
git pull
npm ci
npm run dev        # smoke test
npm run build      # check prod (./dist)


Check:

 Geen rode errors in de console

 dist/ bevat index.html + assets/*

 Geen grote bestanden in Git (find . -type f -size +90M -not -path "./.git/*")

2) Versie & changelog
# kies patch / minor / major
npm version patch
# of:
git tag -a vX.Y.Z -m "Release vX.Y.Z"

3) Web release (GitHub Pages)
npm run build -- --base=/pam-desktop-clean/
npx gh-pages -d dist


Ga naar Settings → Pages en zet Source op gh-pages.
Live link: https://rethinkk.github.io/pam-desktop-clean/

4) Desktop build (Tauri)
npm run tauri:dev     # testen
npm run tauri:build   # productie build (macOS .app/.dmg, etc.)

5) Push + tag
git push
git push --tags

Contributing
Workflow

Branches:

main = stabiel

features: feat/<korte-naam>

fixes: fix/<korte-naam>

Commits klein & duidelijk (bv. feat(assets): import/export JSON)

Setup
git clone git@github.com:Rethinkk/pam-desktop-clean.git
cd pam-desktop-clean
npm ci
npm run dev

Code style

React + TSX, function components

Lichtgewicht (geen zware UI libs), inline styles of kleine helpers

Review checklist

 npm run build ok

 Geen console errors/warnings

 Geen secrets of 100MB+ files (backups/ & *.zip staan in .gitignore)

Releases

Semver (patch/minor/major)

Tag elke release: git tag -a vX.Y.Z -m "..." && git push --tags

Publiceer web (Pages) en optioneel desktop-builds
MD

Commit & push

git add README.md
git commit -m "docs: add Release checklist + Contributing (pam-desktop-clean)"
git push


Wil je ook handige scripts in `package.json` zetten voor Pages?
```bash
# (optioneel) voegt scripts toe; voer dit alleen uit als je JSON geen conflicten heeft
node -e "let p=require('./package.json');p.scripts=p.scripts||{};p.scripts['pages:build']='vite build --base=/pam-desktop-clean/';p.scripts['pages:deploy']='gh-pages -d dist';require('fs').writeFileSync('package.json',JSON.stringify(p,null,2))"
npm i -D gh-pages


Dan kun je releasen met:

npm run pages:build && npm run pages:deploy


Roep maar als je wilt dat ik nog een mini “Getting Started” boven in de README zet met je exacte Pages-link.

You said:
ok
ChatGPT said:
Thought for 7s

Top! Dan zijn we klaar voor vandaag 🙌

Snelle next steps (optioneel):

Pages checken: open https://rethinkk.github.io/pam-desktop-clean/

Release taggen:

git tag -a v0.1.0 -m "Baseline werkend"
git push origin v0.1.0


Dev starten morgen:

npm run dev
# of desktop:
npm run tauri:dev

Workflow:
- Werk op feature/* branches
- Voor push: npm run typecheck && npm run build (pre-push hook aanwezig)
- ‘Stable’ = laatst geteste staat
- ‘Golden’ tags: golden-YYYYMMDD-<kort-label>


