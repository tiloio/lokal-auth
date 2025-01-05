//deno-lint-ignore-file require-await

import type { EncryptedEvent } from "../../types.ts";
import type { EventStoreAdapter } from "./event-adapter.types.ts";
import { type DBSchema, type IDBPDatabase, openDB } from "npm:idb@8.0.0";

export class IndexedDbEventStoreAdapter implements EventStoreAdapter {
    private db: IDBPDatabase<LokalAuthEventsDB> | undefined;
    static readonly STORE_NAME = "events";

    constructor() {}

    async allEvents(): Promise<EncryptedEvent[]> {
        const { tx, store } = await this.readStore();
        const events = await store.getAll();
        await tx.done;
        return events;
    }

    async getWorkspaceEvent(
        workspace: string,
        id: string,
    ): Promise<EncryptedEvent | undefined> {
        const { tx, store } = await this.readStore();
        const event = await store.index('by-id').get([workspace, id]);
        await tx.done;
        return event;
    }

    async getWorkspaceEvents(workspace: string): Promise<EncryptedEvent[]> {
        const { tx, store } = await this.readStore();

        const lowerBound = [workspace];
        const upperBound = [workspace, [new Uint8Array([255])]];
        let cursor = await store.openCursor(
            IDBKeyRange.bound(lowerBound, upperBound, false, true),
        );

        const events: EncryptedEvent[] = [];
        while (cursor) {
            events.push(cursor.value);
            cursor = await cursor.continue();
        }

        await tx.done;
        return events;
    }

    async getPathEvents(
        workspace: string,
        hashedPath: Uint8Array[],
    ): Promise<EncryptedEvent[]> {
        const { tx, store } = await this.readStore();

        const lowerBound = [workspace, hashedPath]; 
        const upperBound = [workspace, [...hashedPath, new Uint8Array([255])]]; // Append high byte to include all continuations
        let cursor = await store.openCursor(
            IDBKeyRange.bound(lowerBound, upperBound, false, true),
        );

        const events: EncryptedEvent[] = [];
        while (cursor) {
            events.push(cursor.value);
            cursor = await cursor.continue();
        }

        await tx.done;
        return events; 
    }

    async saveEvent(event: EncryptedEvent): Promise<void> {
        const { tx, store } = await this.writeStore();

        await store.put(event);
        await tx.done;
    }

    // TODO fix test leaks
    async close() {
        if (!this.db) return;

        this.db.close();
        this.db = undefined;
    }

    get data() {
        throw new Error("Not implemented");
    }

    private async initDB() {
        if (this.db) {
            return this.db;
        }

        // TODO: implement blocking, blocked, terminated, etc. (https://github.com/jakearchibald/idb)
        const db = await openDB<LokalAuthEventsDB>("lokal-auth-events", 1, {
            upgrade(db) {
                const eventsStore = db.createObjectStore(
                    IndexedDbEventStoreAdapter.STORE_NAME,
                    {
                        keyPath: ["workspace", "hashedPath"],
                    },
                );
                eventsStore.createIndex("by-id", ["workspace", "id"]);
            },
        });
        this.db = db;

        return db;
    }

    private async readStore() {
        const db = await this.initDB();
        const tx = db.transaction(
            IndexedDbEventStoreAdapter.STORE_NAME,
            "readonly",
        );
        const store = tx.objectStore(IndexedDbEventStoreAdapter.STORE_NAME);
        return { tx, store, db };
    }

    private async writeStore() {
        const db = await this.initDB();
        const tx = db.transaction(
            IndexedDbEventStoreAdapter.STORE_NAME,
            "readwrite",
        );
        const store = tx.objectStore(IndexedDbEventStoreAdapter.STORE_NAME);
        return { tx, store, db };
    }
}

interface LokalAuthEventsDB extends DBSchema {
    events: {
        key: Uint8Array[];
        value: EncryptedEvent;
        indexes: { "by-id": string };
    };
}
