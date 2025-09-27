import type { Person } from "../types";

const LS_KEY = "pam-people-v1";

type PeopleState = { people: Person[] };

function loadRaw(): PeopleState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { people: [] };
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.people) ? parsed : { people: [] };
  } catch {
    return { people: [] };
  }
}

function saveRaw(next: PeopleState) {
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

export function allPeople(): Person[] {
  return loadRaw().people;
}

export function upsertPerson(p: Person) {
  const s = loadRaw();
  const i = s.people.findIndex(x => x.id === p.id);
  if (i >= 0) {
    s.people[i] = { ...s.people[i], ...p, updatedAt: new Date().toISOString() };
  } else {
    s.people.push(p);
  }
  saveRaw(s);
}

export function removePerson(id: string) {
  const s = loadRaw();
  s.people = s.people.filter(p => p.id !== id);
  saveRaw(s);
}

export function getPerson(id?: string) {
  if (!id) return undefined;
  return allPeople().find(p => p.id === id);
}
