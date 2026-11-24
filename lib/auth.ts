export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

export const STORAGE_KEY_USERS = "enhance_ai_users";
export const STORAGE_KEY_SESSION = "enhance_ai_user";

/**
 * Validates basic email formatting.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Generates simple client-side reversible obfuscation / hash for local demo storage.
 */
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `pwd_${Math.abs(hash)}_${password.length}`;
}

/**
 * Retrieves the list of all registered users from localStorage.
 */
export function getRegisteredUsers(): UserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse registered users:", e);
    return [];
  }
}

/**
 * Registers a new user account with validation.
 */
export function registerUser(
  displayName: string,
  email: string,
  password: string
): { user?: UserAccount; error?: string } {
  const cleanName = displayName.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanName) {
    return { error: "Please provide your full name." };
  }

  if (!validateEmail(cleanEmail)) {
    return { error: "Please enter a valid email address (e.g. name@domain.com)." };
  }

  if (cleanPassword.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const users = getRegisteredUsers();
  const existing = users.find((u) => u.email === cleanEmail);
  if (existing) {
    return { error: "An account with this email address is already registered." };
  }

  const newUser: UserAccount = {
    uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    displayName: cleanName,
    passwordHash: hashPassword(cleanPassword),
    createdAt: new Date().toISOString(),
  };

  try {
    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    saveActiveSession(newUser);
    return { user: newUser };
  } catch (err: any) {
    return { error: "Failed to persist user registration." };
  }
}

/**
 * Authenticates an existing user against registered accounts.
 */
export function authenticateUser(
  email: string,
  password: string
): { user?: UserAccount; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    return { error: "Please provide both email and password." };
  }

  const users = getRegisteredUsers();
  const user = users.find((u) => u.email === cleanEmail);

  if (!user) {
    return { error: "No account found with this email. Please sign up first." };
  }

  if (user.passwordHash !== hashPassword(cleanPassword)) {
    return { error: "Incorrect password. Please verify your credentials." };
  }

  saveActiveSession(user);
  return { user };
}

/**
 * Saves current user session.
 */
export function saveActiveSession(user: UserAccount): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY_SESSION,
    JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    })
  );
}

/**
 * Retrieves currently active session.
 */
export function getActiveSession(): { uid: string; email: string; displayName: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clears active session (logout).
 */
export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_SESSION);
}
