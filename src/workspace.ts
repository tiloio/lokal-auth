import type { WorkspaceKey } from "./key/workspace-key.ts";
import type { EventRepository } from "./data/event-repository.ts";
import type { User } from "./user.ts";
import type {
  NewEvent,
  Event,
  EncryptedEvent,
  DecryptedEventData,
} from "./data/types.ts";
import { EventPath } from "./event-path.ts";
import { encodeCbor } from "jsr:@std/cbor/encode-cbor";

export class Workspace {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly user: User,
    private readonly workspaceKey: WorkspaceKey,
    private readonly eventRepository: EventRepository
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
      encodeCbor(eventData)
    );

    const encryptedEvent = {
      id: crypto.randomUUID(),
      version: 0,
      iv: encryptedEventData.iv,
      workspace: this.name,
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
}
