import { initializeLokalAuth } from "../mod.ts";
import {
    EventAdapters,
    EventEncodingAdapters,
    UserAdapters,
} from "../adapters.ts";
import { assertInstanceOf } from "@std/assert/instance-of";
import { InMemoryAdapter } from "../src/workspace/events/adapters/in-memory-adapter.ts";
import { CborAdapter } from "../src/workspace/encoding/adapters/cbor-adapter.ts";
import { assertEquals } from "@std/assert/equals";
import type { User } from "../src/user/user.ts";
import { assertExists } from "@std/assert/exists";
import { InMemoryUserStoreAdapter } from "../src/user/store/adapters/in-memory-user-store-adapter.ts";

Deno.test("intializeLokalAuth - creates a new instance and uses the provided adapters", async () => {
    const eventsAdapter = new EventAdapters.InMemory();
    const userAdapter = new UserAdapters.InMemory();
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

    assertInstanceOf((user as User).store, InMemoryUserStoreAdapter);
    assertInstanceOf(workspace.eventRepository.adapter, InMemoryAdapter);
    assertInstanceOf(workspace.encodingService.adapter, CborAdapter);

    const encryptedEvents = await eventsAdapter.allEvents();
    assertEquals(encryptedEvents.length, 1);
    const users = await userAdapter.loadUser(user.attributes.id);
    assertExists(users);
});

Deno.test("lokalAuth - can be used to create and read events for multiple workspaces", async () => {
    const lokalAuth = initializeLokalAuth({
        eventsAdapter: new EventAdapters.InMemory(),
        userAdapter: new UserAdapters.InMemory(),
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
    const inMemoryEventAdapter = new EventAdapters.InMemory();
    const inMemoryUserAdapter = new UserAdapters.InMemory();
    const lokalAuthOld = initializeLokalAuth({
        eventsAdapter: inMemoryEventAdapter,
        userAdapter: inMemoryUserAdapter,
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
        eventsAdapter: inMemoryEventAdapter,
        userAdapter: inMemoryUserAdapter,
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
