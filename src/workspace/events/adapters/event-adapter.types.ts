import type { EncryptedEvent } from "../types.ts";

export interface EventRepositoryAdapter {
    getWorkspaceEvents(workspace: string): Promise<EncryptedEvent[]>;
    getWorkspaceEvent(
        workspace: string,
        id: string,
    ): Promise<EncryptedEvent | undefined>;
    getPathEvents(
        workspace: string,
        hashedPath: Uint8Array[],
    ): Promise<EncryptedEvent[]>;
    saveEvent(event: EncryptedEvent): Promise<void>;
    close(): Promise<void>;
    allEvents(): Promise<EncryptedEvent[]>;
}
