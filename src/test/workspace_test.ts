import {
  assert,
  assertEquals,
  assertExists,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
  assertObjectMatch,
} from "jsr:@std/assert";
import { InMemoryAdapter } from "../data/adapters/events/in-memory-adapter.ts";
import { EventRepository } from "../data/event-repository.ts";
import { Workspace } from "../workspace.ts";
import { UserKey } from "../key/user-key.ts";
import { WorkspaceKey } from "../key/workspace-key.ts";
import { User } from "../user.ts";
import type { DecryptedEventData } from "../data/types.ts";
import { CborAdapter } from "../data/adapters/encoding/cbor-adapter.ts";

async function newWorkspace() {
  const encoder = new CborAdapter();
  const adapter = new InMemoryAdapter();
  const eventRepository = new EventRepository(adapter);
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
    eventRepository,
    encoder,
  );

  return {
    workspace,
    workspaceKey,
    user,
    encoder,
    adapter,
  };
}

Deno.test({
  name: "Workspace: saveEvent returns the event",
  async fn() {
    const startTime = new Date();

    const { workspace } = await newWorkspace();

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

    const { workspace, workspaceKey, user, adapter, encoder } =
      await newWorkspace();

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
    assertEquals(event.workspace, workspace.id);
    assertEquals(event.hashedPath, [
      new Uint8Array([
        169,
        74,
        143,
        229,
        204,
        177,
        155,
        166,
        28,
        76,
        8,
        115,
        211,
        145,
        233,
        135,
        152,
        47,
        187,
        211,
      ]),
      new Uint8Array([
        169,
        74,
        143,
        229,
        204,
        177,
        155,
        166,
        28,
        76,
        8,
        115,
        211,
        145,
        233,
        135,
        152,
        47,
        187,
        211,
      ]),
    ]);
    assertInstanceOf(event.event, Uint8Array);
    assertInstanceOf(event.iv, Uint8Array);

    const decryptedEventCbor = await workspaceKey.decrypt({
      iv: event.iv,
      data: event.event,
    });
    const decryptedEvent = encoder.decode(
      decryptedEventCbor,
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

Deno.test({
  name: "Workspace: loadEvent loads encrypted event and decrypts it",
  async fn() {
    const startTime = new Date();

    const { workspace, workspaceKey, user, adapter, encoder } =
      await newWorkspace();

    const expectedEvent = Object.freeze({
      path: "test/test",
      data: Object.freeze({
        hello: "world",
        num: 1,
        bool: false,
        array: Object.freeze([1, 2, 3]),
        object: Object.freeze({
          a: 1,
          b: 2,
          c: 3,
        }),
      }),
    });

    const savedEvent = await workspace.saveEvent(expectedEvent);
    const event = await workspace.loadEvent(savedEvent.id);

    assertGreaterOrEqual(event.date.getTime(), startTime.getTime());
    assertLessOrEqual(event.date.getTime(), new Date().getTime());

    assertEquals(event.id, savedEvent.id);
    assertEquals(event.version, savedEvent.version);

    assertEquals(event.device, globalThis.navigator.userAgent);
    assertEquals(event.workspace, workspace.id);
    assertEquals(event.path, expectedEvent.path);
    assertEquals(event.user, user.id);

    assertObjectMatch(event.data, expectedEvent.data);
  },
});
