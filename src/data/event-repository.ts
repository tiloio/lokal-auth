import type { EncryptedEvent } from "./types.ts";
import type { EventRepositoryAdapter } from "./adapters/event-adapter.types.ts";

export class EventRepository {
  private readonly adapter: EventRepositoryAdapter;

  constructor(adapter: EventRepositoryAdapter) {
    this.adapter = adapter;
  }

  async getWorkspaceEvents(workspace: string): Promise<EncryptedEvent[]> {
    return this.adapter.getWorkspaceEvents(workspace);
  }

  async getWorkspaceEvent(
    workspace: string,
    id: string,
  ): Promise<EncryptedEvent | undefined> {
    return this.adapter.getWorkspaceEvent(workspace, id);
  }

  async getPathEvents(
    workspace: string,
    path: Uint8Array[],
  ): Promise<EncryptedEvent[]> {
    return this.adapter.getPathEvents(workspace, path);
  }

  async saveEvent(encryptedEvent: EncryptedEvent): Promise<void> {
    await this.adapter.saveEvent(encryptedEvent);
  }
}
