export type SavedSettings = { effect: string; timer: number; mirror: boolean; frozen: boolean; caption: string };
export type SettingsLoad = { settings: SavedSettings | null; recovered: boolean };
const DB_NAME = 'postcard-fx';
const STORE = 'postcards';

const EFFECTS = ['orbit', 'rays', 'confetti'];
const TIMERS = [0, 3, 10];

/** Only accept the exact preference shape written by this version of the app. */
export function isSavedSettings(value: unknown): value is SavedSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Record<string, unknown>;
  const keys = Object.keys(settings).sort();
  return keys.length === 5 && keys.join(',') === 'caption,effect,frozen,mirror,timer'
    && typeof settings.effect === 'string' && EFFECTS.includes(settings.effect)
    && typeof settings.timer === 'number' && TIMERS.includes(settings.timer)
    && typeof settings.mirror === 'boolean'
    && typeof settings.frozen === 'boolean'
    && typeof settings.caption === 'string' && settings.caption.length <= 42;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePostcard(blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, 'latest');
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadPostcard(): Promise<Blob | null> {
  const db = await openDb();
  const value = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get('latest');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  db.close(); return value ?? null;
}

export async function deletePostcard(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete('latest');
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function saveSettings(settings: SavedSettings) {
  if (!isSavedSettings(settings)) throw new Error('Invalid Postcard FX settings');
  localStorage.setItem('postcard-fx-settings', JSON.stringify(settings));
}

/**
 * Preferences are user-controlled local data. Remove a malformed legacy value
 * so a bad import or interrupted write can never prevent startup.
 */
export function loadSettings(): SettingsLoad {
  const raw = localStorage.getItem('postcard-fx-settings');
  if (!raw) return { settings: null, recovered: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSavedSettings(parsed)) return { settings: parsed, recovered: false };
  } catch { /* Handle truncated or manually edited local data below. */ }
  localStorage.removeItem('postcard-fx-settings');
  return { settings: null, recovered: true };
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const match = /^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(dataUrl);
  if (!match || match[2].length % 4 !== 0) throw new Error('Invalid base64 data URL');
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: match[1] });
}
