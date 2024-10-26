import { WorkspaceKey } from "./key/workspace-key.ts";
import { EventRepository } from "./data/event-repository.ts";
import type {
  DecryptedEventData,
  EncryptedEvent,
  Event,
  NewEvent,
} from "./data/types.ts";
import { EventPath } from "./event-path.ts";
import { EncodingService } from "./encoding-service.ts";
import type { EventRepositoryAdapter } from "./data/adapters/event-adapter.types.ts";
import type { EncodingAdapter } from "./data/adapters/encoding-adapter.types.ts";

export class Workspace {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly userId: string,
    public readonly workspaceKey: WorkspaceKey,
    private readonly eventRepository: EventRepository,
    private readonly encodingService: EncodingService,
  ) {}

  static async new(
    options: NewWorkspaceOptions,
    adapters: WorkspaceAdapters,
  ): Promise<Workspace> {
    return new Workspace(
      crypto.randomUUID(),
      options.name,
      options.userId,
      await WorkspaceKey.new(),
      new EventRepository(adapters.repository),
      new EncodingService(adapters.encoding),
    );
  }

  static fromKey(
    options: FromKeyWorkspaceOptions,
    adapters: WorkspaceAdapters,
  ): Workspace {
    return new Workspace(
      options.id,
      options.name,
      options.userId,
      options.key,
      new EventRepository(adapters.repository),
      new EncodingService(adapters.encoding),
    );
  }

  async saveEvent<T>(newEvent: NewEvent<T>): Promise<Event<T>> {
    // Save the current event-count-content-hash (to know what the current state is with one check) for the hashedPath in the workspace
    const date = new Date();
    const eventData = {
      device: globalThis.navigator.userAgent,
      path: newEvent.path,
      user: this.userId,
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

  async loadPathEvents<T>(path: string): Promise<Event<T>[]> {
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

type NewWorkspaceOptions = {
  name: string;
  userId: string;
};

type FromKeyWorkspaceOptions = {
  key: WorkspaceKey;
  id: string;
} & NewWorkspaceOptions;

type WorkspaceAdapters = {
  repository: EventRepositoryAdapter;
  encoding: EncodingAdapter;
};
