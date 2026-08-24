import { AUTH_API_URL } from "../lib/config";

export type PamUser = {
  id: string;
  name: string;
  email: string;
  vaultId: string;
  createdAt: string;
};

type StoredUser = PamUser & {
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
};

const USERS_KEY = "pam-auth-users-v1";
const SESSION_KEY = "pam-auth-session-v1";
const HASH_ITERATIONS = 210_000;

function authApiPath(path: string) {
  return `${AUTH_API_URL.replace(/\/$/, "")}${path}`;
}

async function readAuthResponse(response: Response): Promise<PamUser> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? "Authenticatie is niet gelukt.");
  }
  if (!payload.user) throw new Error("De auth-server gaf geen gebruiker terug.");
  return payload.user;
}

async function remoteRegister(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PamUser> {
  try {
    const response = await fetch(authApiPath("/api/pam/auth/register"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return readAuthResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message !== "Load failed") throw error;
    throw new Error("De auth-server is niet bereikbaar. Controleer VITE_AUTH_API_URL of gebruik local-first modus.");
  }
}

async function remoteLogin(input: {
  email: string;
  password: string;
}): Promise<PamUser> {
  try {
    const response = await fetch(authApiPath("/api/pam/auth/login"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return readAuthResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message !== "Load failed") throw error;
    throw new Error("De auth-server is niet bereikbaar. Controleer VITE_AUTH_API_URL of gebruik local-first modus.");
  }
}

async function remoteSession(): Promise<PamUser | null> {
  try {
    const response = await fetch(authApiPath("/api/pam/auth/session"), {
      credentials: "include",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.authenticated) return null;
    return payload.user ?? null;
  } catch {
    return null;
  }
}

async function remoteLogout() {
  await fetch(authApiPath("/api/pam/auth/logout"), {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function hashPassword(password: string, salt: Uint8Array, iterations = HASH_ITERATIONS) {
  const encodedPassword = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey(
    "raw",
    encodedPassword,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations,
    },
    key,
    256,
  );
  return bytesToBase64(new Uint8Array(bits));
}

function publicUser(user: StoredUser): PamUser {
  const { passwordHash, passwordSalt, passwordIterations, ...safeUser } = user;
  void passwordHash;
  void passwordSalt;
  void passwordIterations;
  return safeUser;
}

export async function getCurrentUser(): Promise<PamUser | null> {
  if (AUTH_API_URL) return remoteSession();

  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  const user = readUsers().find((candidate) => candidate.id === userId);
  return user ? publicUser(user) : null;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PamUser> {
  if (AUTH_API_URL) return remoteRegister(input);

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!name) throw new Error("Vul je naam in.");
  if (!email.includes("@")) throw new Error("Vul een geldig e-mailadres in.");
  if (password.length < 10) throw new Error("Gebruik minimaal 10 tekens voor je wachtwoord.");

  const users = readUsers();
  if (users.some((user) => user.email === email)) {
    throw new Error("Er bestaat al een PAM-account met dit e-mailadres.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const now = new Date().toISOString();
  const user: StoredUser = {
    id: crypto.randomUUID(),
    vaultId: crypto.randomUUID(),
    name,
    email,
    createdAt: now,
    passwordSalt: bytesToBase64(salt),
    passwordIterations: HASH_ITERATIONS,
    passwordHash: await hashPassword(password, salt),
  };

  writeUsers([...users, user]);
  localStorage.setItem(SESSION_KEY, user.id);
  return publicUser(user);
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<PamUser> {
  if (AUTH_API_URL) return remoteLogin(input);

  const email = normalizeEmail(input.email);
  const user = readUsers().find((candidate) => candidate.email === email);
  if (!user) throw new Error("E-mailadres of wachtwoord klopt niet.");

  const passwordHash = await hashPassword(
    input.password,
    base64ToBytes(user.passwordSalt),
    user.passwordIterations,
  );
  if (passwordHash !== user.passwordHash) {
    throw new Error("E-mailadres of wachtwoord klopt niet.");
  }

  localStorage.setItem(SESSION_KEY, user.id);
  return publicUser(user);
}

export async function logoutUser() {
  if (AUTH_API_URL) {
    await remoteLogout();
    return;
  }

  localStorage.removeItem(SESSION_KEY);
}
