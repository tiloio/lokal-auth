import { InMemoryAdapter } from "../adapters/in-memory-adapter.ts";
import { EventRepository } from "../event-repository.ts";
import {
  assertExists,
  assertEquals,
  assertLessOrEqual,
  assertObjectMatch,
  assertGreaterOrEqual,
  assertNotEquals,
} from "jsr:@std/assert";

Deno.test({
  name: "EventRepository: saveEvent saves encrypted into the adapter",
  async fn() {
    const adapter = new InMemoryAdapter();
    const eventRepository = new EventRepository(adapter);

    const newEvent = {
      id: crypto.randomUUID(),
      path: "test/test",
      workspace: "test",
      user: "test",
      data: {},
      version: 0,
      date: new Date(),
      device: globalThis.navigator.userAgent,
      iv: new Uint8Array(1),
      hashedPath: [new Uint8Array(2)],
      event: new Uint8Array(3),
    };

    await eventRepository.saveEvent(newEvent);

    const events = await adapter.allEvents();
    const event = events[0];

    assertObjectMatch(event, newEvent);
    assertEquals(events.length, 1);
  },
});
