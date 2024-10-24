import type { EncryptedEvent, EventRepositoryAdapter } from "./types.ts";

export class EventRepository {
  private readonly adapter: EventRepositoryAdapter;

  constructor(adapter: EventRepositoryAdapter) {
    this.adapter = adapter;
  }

  async getWorkspaceEvents(workspace: string): Promise<any[]> {
    return this.adapter.getWorkspaceEvents(workspace);
  }

  async getPathEvents(workspace: string, path: Uint8Array[]): Promise<any[]> {
    return this.adapter.getPathEvents(workspace, path);
  }

  async saveEvent(encryptedEvent: EncryptedEvent): Promise<void> {
    await this.adapter.saveEvent(encryptedEvent);
  }
}
