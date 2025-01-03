import type { EncryptedEvent } from "../types.ts";
import type { EventStoreAdapter } from "./adapters/event-adapter.types.ts";

export class EventStore {
    constructor(public readonly adapter: EventStoreAdapter) {}

    async getWorkspaceEvents(workspace: string): Promise<EncryptedEvent[]> {
        return await this.adapter.getWorkspaceEvents(workspace);
    }

    async getWorkspaceEvent(
        workspace: string,
        id: string,
    ): Promise<EncryptedEvent | undefined> {
        return await this.adapter.getWorkspaceEvent(workspace, id);
    }

    async getPathEvents(
        workspace: string,
        path: Uint8Array[],
    ): Promise<EncryptedEvent[]> {
        return await this.adapter.getPathEvents(workspace, path);
    }

    async saveEvent(encryptedEvent: EncryptedEvent): Promise<void> {
        await this.adapter.saveEvent(encryptedEvent);
    }
}
