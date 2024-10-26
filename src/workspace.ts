import type { WorkspaceKey } from "./key/workspace-key.ts";
import type { EventRepository } from "./data/event-repository.ts";
import type { User } from "./user.ts";
import type {
  DecryptedEventData,
  EncryptedEvent,
  Event,
  NewEvent,
} from "./data/types.ts";
import { EventPath } from "./event-path.ts";
import type { EncodingService } from "./encoding-service.ts";

export class Workspace {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly user: User,
    private readonly workspaceKey: WorkspaceKey,
    private readonly eventRepository: EventRepository,
    private readonly encodingService: EncodingService,
  ) {}

  async saveEvent<T>(newEvent: NewEvent<T>): Promise<Event<T>> {
    // Save the current event-count-content-hash for the hashedPath in the workspace
    const date = new Date();
    const eventData = {
      device: globalThis.navigator.userAgent,
      path: newEvent.path,
      user: this.user.id,
      date: date.getTime(),
      data: newEvent.data,
    } satisfies DecryptedEventData<T>;

    const encryptedEventData = await this.workspaceKey.encrypt(
      this.encodingService.encode(eventData),
    );

    const encryptedEvent = {
      id: crypto.randomUUID(),
      version: 0,
      iv: encryptedEventData.iv,
      workspace: this.id,
      hashedPath: await EventPath.hash(newEvent.path),
      event: encryptedEventData.data,
    } satisfies EncryptedEvent;
    this.eventRepository.saveEvent(encryptedEvent);

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

  async loadEvent<T>(id: string): Promise<Event<T>> {
    const encryptedEvent = await this.eventRepository.getWorkspaceEvent(
      this.id,
      id,
    );
    if (!encryptedEvent) {
      throw new Error(
        `Event with id "${id}" in workspace "${this.id}" not found`,
      );
    }

    return await this.decryptAndDecodeEvent(encryptedEvent);
  }

  async loadPath<T>(path: string): Promise<Event<T>[]> {
    const encryptedEvents = await this.eventRepository.getPathEvents(
      this.id,
      await EventPath.hash(path),
    );

    const events = await Promise.all(
      encryptedEvents.map((encryptedEvent) => {
        return this.decryptAndDecodeEvent(encryptedEvent);
      }),
    );

    return events;
  }

  private async decryptAndDecodeEvent<T>(
    encryptedEvent: EncryptedEvent,
  ): Promise<Event<T>> {
    const decryptedEventData = await this.workspaceKey.decrypt({
      iv: encryptedEvent.iv,
      data: encryptedEvent.event,
    });

    try {
      const eventData = this.encodingService.decode(decryptedEventData);

      return {
        id: encryptedEvent.id,
        version: encryptedEvent.version,
        workspace: encryptedEvent.workspace,
        ...eventData,
        date: new Date(eventData.date),
      };
    } catch (error: any) {
      error.message =
        `Event with id "${encryptedEvent.id}" in workspace "${this.id}" could not be decoded: ${error?.message}`;
      throw error;
    }
  }
}
