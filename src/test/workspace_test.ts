import {
  assertExists,
  assertEquals,
  assertLessOrEqual,
  assertObjectMatch,
  assertGreaterOrEqual,
  assertInstanceOf,
} from "jsr:@std/assert";
import { InMemoryAdapter } from "../data/adapters/in-memory-adapter.ts";
import { EventRepository } from "../data/event-repository.ts";
import { Workspace } from "../workspace.ts";
import { UserKey } from "../key/user-key.ts";
import { WorkspaceKey } from "../key/workspace-key.ts";
import { User } from "../user.ts";
import type { DecryptedEventData } from "../data/types.ts";
import { decodeCbor, encodeCbor } from "jsr:@std/cbor@0.1.2";

function inMemoryRepository() {
  const adapter = new InMemoryAdapter();
  return { eventRepository: new EventRepository(adapter), adapter };
}

Deno.test({
  name: "Workspace: saveEvent returns the event",
  async fn() {
    const startTime = new Date();

    const { eventRepository } = inMemoryRepository();
    const userKey = await UserKey.new("test");
    const userId = "some user id";
    const user = new User(userId, userKey);
    const workspaceKey = await WorkspaceKey.new();
    const workspaceId = "some workspace id";
    const workspaceName = "Some Workspace";
    const workspace = new Workspace(
      workspaceId,
      workspaceName,
      user,
      workspaceKey,
      eventRepository
    );

    const data = {
      hello: "world",
      num: 1,
      bool: false,
      array: [1, 2, 3],
      object: {
        a: 1,
        b: 2,
        c: 3,
      },
    };

    const newEvent = {
      path: "test/test",
      data,
    };

    const event = await workspace.saveEvent(newEvent);

    assertObjectMatch(event, newEvent);

    assertExists(event.id);
    assertEquals(event.version, 0);
    assertGreaterOrEqual(event.date.getTime(), startTime.getTime());
    assertLessOrEqual(event.date.getTime(), new Date().getTime());
    assertEquals(event.device, globalThis.navigator.userAgent);
  },
});

Deno.test({
  name: "Workspace: saveEvent saves encrypted event inside the adapter",
  async fn() {
    const startTime = new Date();

    const { eventRepository, adapter } = inMemoryRepository();
    const userKey = await UserKey.new("test");
    const userId = "some user id";
    const user = new User(userId, userKey);
    const workspaceKey = await WorkspaceKey.new();
    const workspaceId = "some workspace id";
    const workspaceName = "Some Workspace";
    const workspace = new Workspace(
      workspaceId,
      workspaceName,
      user,
      workspaceKey,
      eventRepository
    );

    const data = Object.freeze({
      hello: "world",
      num: 1,
      bool: false,
      array: Object.freeze([1, 2, 3]),
      object: Object.freeze({
        a: 1,
        b: 2,
        c: 3,
      }),
    });

    const newEvent = Object.freeze({
      path: "test/test",
      data,
    });

    await workspace.saveEvent(newEvent);

    const events = await adapter.allEvents();

    assertEquals(events.length, 1);

    const event = events[0];

    assertExists(event.id);
    assertEquals(event.version, 0);
    assertEquals(event.hashedPath, [
      new Uint8Array([
        169, 74, 143, 229, 204, 177, 155, 166, 28, 76, 8, 115, 211, 145, 233,
        135, 152, 47, 187, 211,
      ]),
      new Uint8Array([
        169, 74, 143, 229, 204, 177, 155, 166, 28, 76, 8, 115, 211, 145, 233,
        135, 152, 47, 187, 211,
      ]),
    ]);
    assertInstanceOf(event.event, Uint8Array);
    assertInstanceOf(event.iv, Uint8Array);

    const decryptedEventCbor = await workspaceKey.decrypt({
      iv: event.iv,
      data: event.event,
    });
    const decryptedEvent = decodeCbor(
      decryptedEventCbor
    ) as any as DecryptedEventData<typeof newEvent.data>;

    assertGreaterOrEqual(decryptedEvent.date, startTime.getTime());
    assertLessOrEqual(decryptedEvent.date, new Date().getTime());
    assertObjectMatch(decryptedEvent, {
      device: globalThis.navigator.userAgent,
      path: newEvent.path,
      data: newEvent.data,
      user: user.id,
    });

    assertEquals((event as any).data, undefined);
    assertEquals((event as any).device, undefined);
    assertEquals((event as any).path, undefined);
    assertEquals((event as any).user, undefined);
    assertEquals((event as any).date, undefined);
  },
});
