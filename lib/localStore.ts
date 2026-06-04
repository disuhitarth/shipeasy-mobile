import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch {
      return fallback;
    }
  }
  try {
    const raw = await SecureStore.getItemAsync(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch {}
}

async function readArray<T>(key: string): Promise<T[]> {
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }
  try {
    const raw = await SecureStore.getItemAsync(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

async function writeArray<T>(key: string, value: T[]): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch {}
}

const KEY_PINNED_SHIPMENTS = 'pinned_shipments_v1';
const KEY_SHIPMENT_NOTES = 'shipment_notes_v1';
const KEY_SHIPMENT_TAGS = 'shipment_tags_v1';
const KEY_FAVORITE_ADDRESSES = 'favorite_addresses_v1';
const KEY_RECENT_RECIPIENTS = 'recent_recipients_v1';
const KEY_DISMISSED_NEWS = 'dismissed_news_v1';
const KEY_SHIPPING_GOAL = 'shipping_goal_v1';
const KEY_SEARCH_HISTORY = 'search_history_v1';
const KEY_TOUR_SEEN = 'tour_seen_v1';

export type ShippingTag = 'gift' | 'fragile' | 'return' | 'important';

export const SHIPMENT_TAGS: { id: ShippingTag; label: string; color: string; bg: string }[] = [
  { id: 'gift', label: 'Gift', color: '#9333EA', bg: '#F3E8FF' },
  { id: 'fragile', label: 'Fragile', color: '#C8860B', bg: '#FBF0DA' },
  { id: 'return', label: 'Return', color: '#0EA5E9', bg: '#E0F2FE' },
  { id: 'important', label: 'Important', color: '#E0483D', bg: '#FDE8E8' },
];

export interface RecentRecipient {
  name: string;
  address1: string;
  city: string;
  province: string;
  postal: string;
  country: string;
  usedAt: number;
}

export interface PinnedSet {
  pinned: string[];
  notes: Record<string, string>;
  tags: Record<string, ShippingTag[]>;
}

export type ShippingGoal = 'daily' | 'weekly' | 'monthly' | 'occasionally';

export interface SearchHistory {
  shipments: string[];
  addresses: string[];
  skus: string[];
}

const DEFAULT_PINNED: PinnedSet = { pinned: [], notes: {}, tags: {} };

export const LocalStore = {
  async getPinned(): Promise<string[]> {
    const s = await readJSON<PinnedSet>(KEY_PINNED_SHIPMENTS, DEFAULT_PINNED);
    return s.pinned;
  },

  async togglePinned(shipCode: string): Promise<string[]> {
    const s = await readJSON<PinnedSet>(KEY_PINNED_SHIPMENTS, DEFAULT_PINNED);
    const idx = s.pinned.indexOf(shipCode);
    if (idx >= 0) s.pinned.splice(idx, 1);
    else s.pinned.unshift(shipCode);
    await writeJSON(KEY_PINNED_SHIPMENTS, s);
    return s.pinned;
  },

  async getShipmentNote(shipCode: string): Promise<string> {
    const s = await readJSON<PinnedSet>(KEY_SHIPMENT_NOTES, { pinned: [], notes: {}, tags: {} });
    return s.notes[shipCode] || '';
  },

  async setShipmentNote(shipCode: string, note: string): Promise<void> {
    const s = await readJSON<PinnedSet>(KEY_SHIPMENT_NOTES, { pinned: [], notes: {}, tags: {} });
    if (note.trim()) s.notes[shipCode] = note;
    else delete s.notes[shipCode];
    await writeJSON(KEY_SHIPMENT_NOTES, s);
  },

  async getShipmentTags(shipCode: string): Promise<ShippingTag[]> {
    const s = await readJSON<PinnedSet>(KEY_SHIPMENT_TAGS, { pinned: [], notes: {}, tags: {} });
    return s.tags[shipCode] || [];
  },

  async setShipmentTags(shipCode: string, tags: ShippingTag[]): Promise<void> {
    const s = await readJSON<PinnedSet>(KEY_SHIPMENT_TAGS, { pinned: [], notes: {}, tags: {} });
    if (tags.length > 0) s.tags[shipCode] = tags;
    else delete s.tags[shipCode];
    await writeJSON(KEY_SHIPMENT_TAGS, s);
  },

  async toggleShipmentTag(shipCode: string, tag: ShippingTag): Promise<ShippingTag[]> {
    const s = await readJSON<PinnedSet>(KEY_SHIPMENT_TAGS, { pinned: [], notes: {}, tags: {} });
    const current = s.tags[shipCode] || [];
    const idx = current.indexOf(tag);
    let next: ShippingTag[];
    if (idx >= 0) next = current.filter((t) => t !== tag);
    else next = [...current, tag];
    if (next.length > 0) s.tags[shipCode] = next;
    else delete s.tags[shipCode];
    await writeJSON(KEY_SHIPMENT_TAGS, s);
    return next;
  },

  async getFavoriteAddresses(): Promise<string[]> {
    return readArray<string>(KEY_FAVORITE_ADDRESSES);
  },

  async toggleFavoriteAddress(addressId: string): Promise<string[]> {
    const list = await readArray<string>(KEY_FAVORITE_ADDRESSES);
    const idx = list.indexOf(addressId);
    if (idx >= 0) list.splice(idx, 1);
    else list.unshift(addressId);
    await writeArray(KEY_FAVORITE_ADDRESSES, list);
    return list;
  },

  async getRecentRecipients(): Promise<RecentRecipient[]> {
    return readArray<RecentRecipient>(KEY_RECENT_RECIPIENTS);
  },

  async addRecentRecipient(recipient: Omit<RecentRecipient, 'usedAt'>): Promise<RecentRecipient[]> {
    const list = await readArray<RecentRecipient>(KEY_RECENT_RECIPIENTS);
    const filtered = list.filter(
      (r) => !(r.name === recipient.name && r.postal === recipient.postal),
    );
    const next: RecentRecipient[] = [{ ...recipient, usedAt: Date.now() }, ...filtered].slice(0, 12);
    await writeArray(KEY_RECENT_RECIPIENTS, next);
    return next;
  },

  async getDismissedNews(): Promise<string[]> {
    return readArray<string>(KEY_DISMISSED_NEWS);
  },

  async dismissNews(id: string): Promise<string[]> {
    const list = await readArray<string>(KEY_DISMISSED_NEWS);
    if (!list.includes(id)) list.push(id);
    await writeArray(KEY_DISMISSED_NEWS, list);
    return list;
  },

  async getShippingGoal(): Promise<ShippingGoal | null> {
    const v = await readJSON<{ goal: ShippingGoal | null }>(KEY_SHIPPING_GOAL, { goal: null });
    return v.goal;
  },

  async setShippingGoal(goal: ShippingGoal | null): Promise<void> {
    await writeJSON(KEY_SHIPPING_GOAL, { goal });
  },

  async getSearchHistory(scope: keyof SearchHistory): Promise<string[]> {
    const all = await readJSON<SearchHistory>(KEY_SEARCH_HISTORY, {
      shipments: [], addresses: [], skus: [],
    });
    return all[scope] || [];
  },

  async addSearchHistory(scope: keyof SearchHistory, term: string): Promise<string[]> {
    const t = term.trim();
    if (!t) return [];
    const all = await readJSON<SearchHistory>(KEY_SEARCH_HISTORY, {
      shipments: [], addresses: [], skus: [],
    });
    const list = (all[scope] || []).filter((x) => x.toLowerCase() !== t.toLowerCase());
    list.unshift(t);
    all[scope] = list.slice(0, 10);
    await writeJSON(KEY_SEARCH_HISTORY, all);
    return all[scope];
  },

  async clearSearchHistory(scope: keyof SearchHistory): Promise<void> {
    const all = await readJSON<SearchHistory>(KEY_SEARCH_HISTORY, {
      shipments: [], addresses: [], skus: [],
    });
    all[scope] = [];
    await writeJSON(KEY_SEARCH_HISTORY, all);
  },

  async getTourSeen(id: string): Promise<boolean> {
    const all = await readJSON<Record<string, boolean>>(KEY_TOUR_SEEN, {});
    return !!all[id];
  },

  async markTourSeen(id: string): Promise<void> {
    const all = await readJSON<Record<string, boolean>>(KEY_TOUR_SEEN, {});
    all[id] = true;
    await writeJSON(KEY_TOUR_SEEN, all);
  },
};

export const SEARCH_SCOPES = {
  shipments: 'shipments' as const,
  addresses: 'addresses' as const,
  skus: 'skus' as const,
};

export type SearchScope = keyof typeof SEARCH_SCOPES;
