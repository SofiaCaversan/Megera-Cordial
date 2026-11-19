export const ADMIN_SESSION_KEY = 'megera-cordial-admin-unlocked';
export const ADMIN_ACCESS_CODE = 'megera2026';

export interface SimpleSessionStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export function resolveInitialAdminMode(
  search: string,
  storage?: SimpleSessionStorage | null
): boolean {
  const params = new URLSearchParams(search);
  const adminParam = params.get('admin');

  if (adminParam === 'true') {
    try {
      storage?.setItem(ADMIN_SESSION_KEY, '1');
    } catch {
      // Ignore storage failures
    }
    return true;
  }

  if (adminParam === 'false') {
    try {
      storage?.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore storage failures
    }
    return false;
  }

  try {
    return storage?.getItem(ADMIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function verifyAdminPassword(input: string): boolean {
  return input.trim() === ADMIN_ACCESS_CODE;
}

export function setAdminSession(
  unlocked: boolean,
  storage?: SimpleSessionStorage | null
): boolean {
  try {
    if (unlocked) {
      storage?.setItem(ADMIN_SESSION_KEY, '1');
    } else {
      storage?.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    // Ignore storage failures
  }
  return unlocked;
}
