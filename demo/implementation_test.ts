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
