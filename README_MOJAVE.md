# PAM Desktop — Mojave Compatible

Deze versie is aangepast om te draaien op **macOS 10.14.6 (Mojave)**:

- Tauri v1 i.p.v. v2
- Vite v4 (werkt met Node 14)
- Typescript 4.9

## Installatie stappen

1. Installeer Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```

2. Installeer nvm en Node 14 (werkt op Mojave):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
   nvm install 14
   nvm use 14
   ```

3. Controleer Node en npm:
   ```bash
   node -v
   npm -v
   ```

4. Ga naar de projectmap en installeer dependencies:
   ```bash
   cd pam-desktop-mojave
   npm install
   npm run tauri dev
   ```

Als alles goed gaat opent een venster met de PAM-app.
