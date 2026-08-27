import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export function createFilePamStore(dataDir) {
  const usersFile = join(dataDir, "users.json");
  const recordsFile = join(dataDir, "encrypted-records.json");
  const eventsFile = join(dataDir, "sync-events.jsonl");

  return {
    async readUserStore() {
      try {
        return JSON.parse(await readFile(usersFile, "utf8"));
      } catch {
        return { users: [] };
      }
    },

    async saveUserStore(store) {
      await mkdir(dataDir, { recursive: true });
      await writeFile(usersFile, `${JSON.stringify(store, null, 2)}\n`);
    },

    async readRecordStore() {
      try {
        return JSON.parse(await readFile(recordsFile, "utf8"));
      } catch {
        return { records: {} };
      }
    },

    async saveRecordStore(store) {
      await mkdir(dataDir, { recursive: true });
      await writeFile(recordsFile, `${JSON.stringify(store, null, 2)}\n`);
    },

    async appendSyncEvent(event) {
      await mkdir(dataDir, { recursive: true });
      const existing = await readFile(eventsFile, "utf8").catch(() => "");
      await writeFile(eventsFile, `${existing}${JSON.stringify(event)}\n`);
    },
  };
}
