import { initializeLokalAuth } from "../mod.ts";
import {
    EventAdapters,
    EventEncodingAdapters,
    UserAdapters,
} from "../adapters.ts";
import { assertInstanceOf } from "@std/assert/instance-of";
import { LocalStorageAdapter } from "../src/user/store/adapters/local-storage-adapter.ts";
import { InMemoryAdapter } from "../src/workspace/events/adapters/in-memory-adapter.ts";
import { CborAdapter } from "../src/workspace/encoding/adapters/cbor-adapter.ts";
import { assertEquals } from "@std/assert/equals";
import type { User } from "../src/user/user.ts";
import { assertExists } from "@std/assert/exists";

Deno.test("intializeLokalAuth - creates a new instance and uses the provided adapters", async () => {
    localStorage.clear();
    const eventsAdapter = new EventAdapters.InMemory();
    const userAdapter = new UserAdapters.LocalStorage();
    const lokalAuth = initializeLokalAuth({
        eventsAdapter: eventsAdapter,
        userAdapter: userAdapter,
        eventsEncodingAdapter: new EventEncodingAdapters.BinaryCbor(),
    });

    const user = await lokalAuth.login("some-user", "some-password");

    const workspace = await user.createWorkspace({
        name: "test",
    });

    await workspace.saveEvent({
        path: "test/test",
        data: {
            hello: "world",
        },
    });

    assertInstanceOf((user as User).store, LocalStorageAdapter);
    assertInstanceOf(workspace.eventRepository.adapter, InMemoryAdapter);
    assertInstanceOf(workspace.encodingService.adapter, CborAdapter);

    const encryptedEvents = await eventsAdapter.allEvents();
    assertEquals(encryptedEvents.length, 1);
    const users = await userAdapter.loadUser(user.attributes.id);
    assertExists(users);
});

Deno.test("lokalAuth - can be used to create and read events for multiple workspaces", async () => {
    localStorage.clear();
    const lokalAuth = initializeLokalAuth({
        eventsAdapter: new EventAdapters.InMemory(),
        userAdapter: new UserAdapters.LocalStorage(),
        eventsEncodingAdapter: new EventEncodingAdapters.BinaryCbor(),
    });

    const user = await lokalAuth.login("some-user", "some-password");

    const workspace1 = await user.createWorkspace({
        name: "test1",
    });
    const workspace2 = await user.createWorkspace({
        name: "test2",
    });

    const path = "some/data";
    const data1 = {
        anObject: true,
    };
    const data2 = {
        withString: "string",
    };
    const data3 = {
        withArray: [1, 2, 3],
    };

    await workspace1.saveEvent({ path: path + "/1", data: data1 });
    await workspace1.saveEvent({ path: path + "/2", data: data2 });
    await workspace2.saveEvent({ path: path + "/3", data: data3 });

    const eventsWorkspace1 = await workspace1.loadPathEvents(path);
    const eventsWorkspace2 = await workspace2.loadPathEvents(path);

    assertEquals(eventsWorkspace1.length, 2);
    assertEquals(eventsWorkspace1[0].data, data1);
    assertEquals(eventsWorkspace1[0].user, user.attributes.privacyId);
    assertEquals(eventsWorkspace1[0].workspace, workspace1.attributes.id);
    assertEquals(eventsWorkspace1[1].data, data2);
    assertEquals(eventsWorkspace1[1].user, user.attributes.privacyId);
    assertEquals(eventsWorkspace1[1].workspace, workspace1.attributes.id);

    assertEquals(eventsWorkspace2.length, 1);
    assertEquals(eventsWorkspace2[0].data, data3);
    assertEquals(eventsWorkspace2[0].user, user.attributes.privacyId);
    assertEquals(eventsWorkspace2[0].workspace, workspace2.attributes.id);
});

Deno.test("lokalAuth.login restores all workspaces and events in the workspaces if the inMemoryAdapter is the same", async () => {
    localStorage.clear();
    const inMemoryAdapter = new EventAdapters.InMemory();
    const lokalAuthOld = initializeLokalAuth({
        eventsAdapter: inMemoryAdapter,
        userAdapter: new UserAdapters.LocalStorage(),
        eventsEncodingAdapter: new EventEncodingAdapters.BinaryCbor(),
    });

    const userOld = await lokalAuthOld.login("some-user", "some-password");

    const workspaceOld1 = await userOld.createWorkspace({
        name: "tes1",
    });
    const workspaceOld2 = await userOld.createWorkspace({
        name: "tes2",
    });

    const eventOld = await workspaceOld2.saveEvent({
        path: "test/test",
        data: {
            hello: "world",
        },
    });

    const lokalAuth = initializeLokalAuth({
        eventsAdapter: inMemoryAdapter,
        userAdapter: new UserAdapters.LocalStorage(),
        eventsEncodingAdapter: new EventEncodingAdapters.BinaryCbor(),
    });
    const user = await lokalAuth.login("some-user", "some-password");

    assertEquals(user.workspaces.length, 2);
    const workspace1 = user.workspaces.find((workspace) =>
        workspace.attributes.id === workspaceOld1.attributes.id
    );
    const workspace2 = user.workspaces.find((workspace) =>
        workspace.attributes.id === workspaceOld2.attributes.id
    );
    assertExists(workspace1);
    assertExists(workspace2);
    assertEquals(workspace1.attributes, workspaceOld1.attributes);
    assertEquals(workspace2.attributes, workspaceOld2.attributes);

    const event = await workspace2.loadEvent(eventOld.id);
    assertEquals(event, eventOld);
});
