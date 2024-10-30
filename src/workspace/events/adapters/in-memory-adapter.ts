//deno-lint-ignore-file require-await

import type { EncryptedEvent } from "../types.ts";
import type { EventRepositoryAdapter } from "./event-adapter.types.ts";
import { equals } from "jsr:@std/bytes@1.0.2";

export class InMemoryAdapter implements EventRepositoryAdapter {
    private store: EncryptedEvent[] = [];

    async allEvents(): Promise<EncryptedEvent[]> {
        return [...this.store];
    }

    async getWorkspaceEvent(
        workspace: string,
        id: string,
    ): Promise<EncryptedEvent | undefined> {
        const event = this.store.find((event) =>
            event.workspace === workspace && event.id === id
        );
        return event;
    }

    async getWorkspaceEvents(workspace: string): Promise<EncryptedEvent[]> {
        const events = this.store.filter((event) =>
            event.workspace === workspace
        );
        return events;
    }

    async getPathEvents(
        workspace: string,
        hashedPath: Uint8Array[],
    ): Promise<EncryptedEvent[]> {
        const events = this.store.filter(
            (event) =>
                event.workspace === workspace &&
                hashedPath.every((hashedPathPart, index) =>
                    event.hashedPath[index] &&
                    equals(hashedPathPart, event.hashedPath[index])
                ),
        );
        return events;
    }

    async saveEvent(event: EncryptedEvent): Promise<void> {
        await this.store.push(event);
    }

    async close() {
        this.store = [];
    }

    get data() {
        return this.store;
    }
}
