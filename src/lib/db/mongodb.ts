import fs from 'node:fs';
import path from 'node:path';
import { MongoClient, Db } from 'mongodb';
import {
  SEED_USER,
  SEED_CONTACTS,
  SEED_FACILITIES,
  SEED_INCIDENTS,
} from './seed-data.ts';
import {
  User,
  TrustedContact,
  SafetyFacility,
  Trip,
  TripCheckin,
  IncidentReport,
  SafetyEvent,
} from '../types.ts';

/**
 * SafeStride AI Dual-Engine Database Manager
 * Supports:
 *   1. Official MongoDB Atlas driver when MONGODB_URI is provided.
 *   2. Persistent, zero-config embedded store when running in standalone / demo container.
 */

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'safestride.json');

interface DatabaseStore {
  users: User[];
  trustedContacts: TrustedContact[];
  safetyFacilities: SafetyFacility[];
  trips: Trip[];
  tripCheckins: TripCheckin[];
  incidentReports: IncidentReport[];
  safetyEvents: SafetyEvent[];
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let memoryStore: DatabaseStore | null = null;

function ensureDataFile(): DatabaseStore {
  if (memoryStore) return memoryStore;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      memoryStore = JSON.parse(content) as DatabaseStore;
      return memoryStore;
    } catch {
      // Re-initialize if corrupted
    }
  }

  // Seed default data
  memoryStore = {
    users: [SEED_USER],
    trustedContacts: [...SEED_CONTACTS],
    safetyFacilities: [...SEED_FACILITIES],
    trips: [],
    tripCheckins: [],
    incidentReports: [...SEED_INCIDENTS],
    safetyEvents: [],
  };

  saveDataFile(memoryStore);
  return memoryStore;
}

function saveDataFile(store: DatabaseStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SafeStride DB] Failed to persist data file:', err);
  }
}

export interface CollectionInterface<T extends { _id: string }> {
  find(filter?: Partial<T> | Record<string, unknown>): Promise<T[]>;
  findOne(filter: Partial<T> | Record<string, unknown>): Promise<T | null>;
  insertOne(doc: T): Promise<T>;
  updateOne(
    filter: Partial<T> | Record<string, unknown>,
    update: { $set?: Partial<T> } | Partial<T>
  ): Promise<boolean>;
  deleteOne(filter: Partial<T> | Record<string, unknown>): Promise<boolean>;
  countDocuments(filter?: Partial<T> | Record<string, unknown>): Promise<number>;
}

function matchFilter<T>(item: T, filter?: Record<string, unknown>): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, val] of Object.entries(filter)) {
    const itemVal = (item as Record<string, unknown>)[key];
    if (val !== undefined && itemVal !== val) {
      return false;
    }
  }
  return true;
}

function createEmbeddedCollection<T extends { _id: string }>(
  collectionKey: keyof DatabaseStore
): CollectionInterface<T> {
  return {
    async find(filter = {}) {
      const store = ensureDataFile();
      const list = (store[collectionKey] as unknown as T[]) || [];
      return list.filter((item) => matchFilter(item, filter as Record<string, unknown>));
    },
    async findOne(filter) {
      const store = ensureDataFile();
      const list = (store[collectionKey] as unknown as T[]) || [];
      const found = list.find((item) => matchFilter(item, filter as Record<string, unknown>));
      return found || null;
    },
    async insertOne(doc) {
      const store = ensureDataFile();
      const list = store[collectionKey] as unknown as T[];
      list.push(doc);
      saveDataFile(store);
      return doc;
    },
    async updateOne(filter, update) {
      const store = ensureDataFile();
      const list = store[collectionKey] as unknown as T[];
      const index = list.findIndex((item) => matchFilter(item, filter as Record<string, unknown>));
      if (index === -1) return false;

      const setPayload = '$set' in update && update.$set ? update.$set : update;
      list[index] = { ...list[index], ...setPayload };
      saveDataFile(store);
      return true;
    },
    async deleteOne(filter) {
      const store = ensureDataFile();
      const list = store[collectionKey] as unknown as T[];
      const index = list.findIndex((item) => matchFilter(item, filter as Record<string, unknown>));
      if (index === -1) return false;

      list.splice(index, 1);
      saveDataFile(store);
      return true;
    },
    async countDocuments(filter = {}) {
      const store = ensureDataFile();
      const list = (store[collectionKey] as unknown as T[]) || [];
      return list.filter((item) => matchFilter(item, filter as Record<string, unknown>)).length;
    },
  };
}

export async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI?.trim();
  
  // Only attempt Atlas connection if a valid, non-placeholder MongoDB URI is provided
  if (
    !uri ||
    (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) ||
    uri.includes('<username>') ||
    uri.includes('<password>')
  ) {
    // Gracefully use the embedded persistent database engine
    return null;
  }

  if (cachedDb) return cachedDb;

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      await cachedClient.connect();
      console.log('[SafeStride DB] Connected to external MongoDB Atlas successfully.');
    }
    const dbName = process.env.MONGODB_DB || 'safestride';
    cachedDb = cachedClient.db(dbName);
    return cachedDb;
  } catch (err) {
    console.warn(
      '[SafeStride DB] External MongoDB Atlas connection unavailable, using embedded persistent engine:',
      (err as Error).message
    );
    return null;
  }
}

/**
 * Returns a typed collection abstraction that operates seamlessly over either Atlas or Embedded store.
 */
export async function getCollection<T extends { _id: string }>(
  name: keyof DatabaseStore
): Promise<CollectionInterface<T>> {
  const db = await getMongoDb();
  if (db) {
    const col = db.collection(name);
    return {
      async find(filter = {}) {
        const docs = await col.find(filter as any).toArray();
        return docs as unknown as T[];
      },
      async findOne(filter) {
        const doc = await col.findOne(filter as any);
        return (doc as unknown as T) || null;
      },
      async insertOne(doc) {
        await col.insertOne(doc as Record<string, unknown>);
        return doc;
      },
      async updateOne(filter, update) {
        const res = await col.updateOne(filter as any, update as any);
        return res.modifiedCount > 0;
      },
      async deleteOne(filter) {
        const res = await col.deleteOne(filter as any);
        return res.deletedCount > 0;
      },
      async countDocuments(filter = {}) {
        return await col.countDocuments(filter as any);
      },
    };
  }

  // Fallback to embedded persistent store
  return createEmbeddedCollection<T>(name);
}

export function resetDemoDatabase(): void {
  memoryStore = {
    users: [SEED_USER],
    trustedContacts: [...SEED_CONTACTS],
    safetyFacilities: [...SEED_FACILITIES],
    trips: [],
    tripCheckins: [],
    incidentReports: [...SEED_INCIDENTS],
    safetyEvents: [],
  };
  saveDataFile(memoryStore);
}
