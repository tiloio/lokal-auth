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

Deno.test("intializeLokalAuth - creates a new instance and uses the provided adapters", async () => {
    const lokalAuth = initializeLokalAuth({
        eventsAdapter: new EventAdapters.InMemory(),
        userAdapter: new UserAdapters.LocalStorage(),
        eventsEncodingAdapter: new EventEncodingAdapters.BinaryCbor(),
    });

    const user = await lokalAuth.login("some-user", "some-password");

    const workspace = await user.createWorkspace({
        name: "test",
    });

    assertInstanceOf(user.store, LocalStorageAdapter);
    assertInstanceOf(workspace.eventRepository.adapter, InMemoryAdapter);
    assertInstanceOf(workspace.encodingService.adapter, CborAdapter);
});

Deno.test("lokalAuth - can be used to create and read events for multiple workspaces", async () => {
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
