import type { EventEncodingService } from "../../events/encoding/event-encoding-service.ts";
import type { EventStore } from "../../events/store/event-store.ts";
import type { Workspace } from "../../workspace.type.ts";
import type { EncryptedEvent, Event, EventData } from "../../events/types.ts";
import { EventPath } from "../../events/event-path.ts";
import type { WorkspaceKeyCommand } from "../../key/workspace-key.command.ts";

export class ReadEventQuery {
    constructor(
        private readonly eventRepository: EventStore,
        private readonly encodingService: EventEncodingService,
        private readonly workspaceKeyCommand: WorkspaceKeyCommand,
    ) {}

    async loadEvent<T extends EventData>(
        workspace: Workspace,
        eventId: string,
    ): Promise<Event<T>> {
        const encryptedEvent = await this.eventRepository.getWorkspaceEvent(
            workspace.id,
            eventId,
        );
        if (!encryptedEvent) {
            throw new Error(
                `Event with id "${eventId}" in workspace "${workspace.id}" not found`,
            );
        }

        return await this.decryptAndDecodeEvent(workspace, encryptedEvent);
    }

    async loadPathEvents<T extends EventData>(
        workspace: Workspace,
        path: string,
    ): Promise<Event<T>[]> {
        const encryptedEvents = await this.eventRepository.getPathEvents(
            workspace.id,
            await EventPath.hash(path),
        );

        const events = await Promise.all(
            encryptedEvents.map((encryptedEvent) => {
                return this.decryptAndDecodeEvent<T>(workspace, encryptedEvent);
            }),
        );

        return events;
    }

    private async decryptAndDecodeEvent<T extends EventData>(
        workspace: Workspace,
        encryptedEvent: EncryptedEvent,
    ): Promise<Event<T>> {
        const decryptedEventData = await this.workspaceKeyCommand.decrypt(
            workspace.key,
            {
                iv: encryptedEvent.iv,
                data: encryptedEvent.event,
            },
        );

        try {
            const eventData = this.encodingService.decode<T>(
                decryptedEventData,
            );

            return {
                id: encryptedEvent.id,
                version: encryptedEvent.version,
                workspace: encryptedEvent.workspace,
                ...eventData,
                date: new Date(eventData.date),
            };
        } catch (error: unknown) {
            if (error && typeof error === "object" && "message" in error) {
                error.message =
                    `Event with id "${encryptedEvent.id}" in workspace "${workspace.id}" could not be decoded: ${error?.message}`;
            }
            throw error;
        }
    }
}
