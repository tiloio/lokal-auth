import type { EventEncodingService } from "../../events/encoding/event-encoding-service.ts";
import { EventPath } from "../../events/event-path.ts";
import type { EventStore } from "../../events/store/event-store.ts";
import type {
    CreateEvent,
    DecryptedEventData,
    EncryptedEvent,
    Event,
} from "../../events/types.ts";
import type { WorkspaceKeyCommand } from "../../key/workspace-key.command.ts";
import type { Workspace } from "../../workspace.type.ts";

export class EventCreateCommand {
    constructor(
        private readonly eventStore: EventStore,
        private readonly encodingService: EventEncodingService,
        private readonly workspaceKeyCommand: WorkspaceKeyCommand,
    ) {}

    async createEvent<T>(
        workspace: Workspace,
        newEvent: CreateEvent<T>,
    ): Promise<Event<T>> {
        // Save the current event-count-content-hash (to know what the current state is with one check) for the hashedPath in the workspace
        const date = new Date();
        const eventData = {
            device: globalThis.navigator.userAgent,
            path: newEvent.path,
            user: workspace.userPrivacyId,
            date: date.getTime(),
            data: newEvent.data,
        } satisfies DecryptedEventData<T>;

        const encryptedEventData = await this.workspaceKeyCommand.encrypt(
            workspace.key,
            this.encodingService.encode(eventData),
        );

        const encryptedEvent = {
            id: crypto.randomUUID(),
            version: 0,
            iv: encryptedEventData.iv,
            workspace: workspace.id,
            hashedPath: await EventPath.hash(newEvent.path),
            event: encryptedEventData.data,
        } satisfies EncryptedEvent;
        this.eventStore.saveEvent(encryptedEvent);

        return {
            id: encryptedEvent.id,
            version: encryptedEvent.version,
            date: date,
            device: eventData.device,
            workspace: encryptedEvent.workspace,
            path: newEvent.path,
            data: newEvent.data,
            user: eventData.user,
        };
    }
}
