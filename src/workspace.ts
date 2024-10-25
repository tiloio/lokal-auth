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
import type { EncodingAdapter } from "./data/adapters/encoding-adapter.types.ts";

export class Workspace {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly user: User,
    private readonly workspaceKey: WorkspaceKey,
    private readonly eventRepository: EventRepository,
    private readonly encoder: EncodingAdapter,
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
      this.encoder.encode(eventData),
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

    const decryptedEventData = await this.workspaceKey.decrypt({
      iv: encryptedEvent.iv,
      data: encryptedEvent.event,
    });

    const eventData = this.encoder.decode(
      decryptedEventData,
    ) as unknown;

    if (
      !eventData || typeof eventData !== "object" || !("date" in eventData) ||
      !(typeof eventData.date === "bigint" ||
        typeof eventData.date === "number")
    ) {
      throw new Error(
        `Event with id "${id}" in workspace "${this.id}" has no valid "date" property as number. Got "${
          (eventData as any)?.date
        }" as type "${typeof (eventData as any)?.date}"`,
      );
    }

    if (
      !eventData || typeof eventData !== "object" || !("path" in eventData) ||
      typeof eventData.path !== "string" || !eventData.path
    ) {
      throw new Error(
        `Event with id "${id}" in workspace "${this.id}" has no "path" property as string.`,
      );
    }

    if (
      !eventData || typeof eventData !== "object" || !("device" in eventData) ||
      typeof eventData.device !== "string" || !eventData.device
    ) {
      throw new Error(
        `Event with id "${id}" in workspace "${this.id}" has no "device" property as string.`,
      );
    }

    if (
      !eventData || typeof eventData !== "object" || !("data" in eventData) ||
      typeof eventData.data !== "object" || !eventData.data
    ) {
      throw new Error(
        `Event with id "${id}" in workspace "${this.id}" has no "data" property as object.`,
      );
    }

    if (
      !eventData || typeof eventData !== "object" || !("user" in eventData) ||
      typeof eventData.user !== "string" || !eventData.user
    ) {
      throw new Error(
        `Event with id "${id}" in workspace "${this.id}" has no "user" property as string.`,
      );
    }

    return {
      id: encryptedEvent.id,
      version: encryptedEvent.version,
      date: new Date(Number(eventData.date)),
      device: eventData.device,
      workspace: encryptedEvent.workspace,
      path: eventData.path,
      data: eventData.data,
      user: eventData.user,
    };
  }
}
