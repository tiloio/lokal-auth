import { assertExists } from "@std/assert/exists";
import { initLokalAuth } from "./test.utils.ts";
import { assertEquals } from "@std/assert/equals";
import { assertGreaterOrEqual } from "@std/assert/greater-or-equal";
import { assertLessOrEqual } from "@std/assert/less-or-equal";
import { EventStoreAdapters } from "../mod.ts";
import type { EventStoreAdapter } from "../src/workspace/events/store/adapters/event-adapter.types.ts";
import { EventEncodingService } from "../src/workspace/events/encoding/event-encoding-service.ts";
import { testInitIndexedDB } from "../src/workspace/events/store/_test/indexeddb-test-init.ts";

const eventStoreAdaptersToTest: [
    () => {
        adapter: EventStoreAdapter;
        [Symbol.asyncDispose]: () => Promise<void>;
    },
    string,
][] = [
    [() => {
        return {
            adapter: new EventStoreAdapters.InMemory(),
            [Symbol.asyncDispose]: async () => {},
        };
    }, "InMemory"],
    [() => {
        testInitIndexedDB();
        const adapter = new EventStoreAdapters.IndexedDB();
        return {
            adapter,
            async [Symbol.asyncDispose]() {
                await adapter.close();
            },
        };
    }, "IndexedDB"],
];

for (const [eventStoreAdapter, name] of eventStoreAdaptersToTest) {
    Deno.test(`intializeLokalAuth - provides createEvent which creates a new event - ${name}`, async () => {
        await using eventStoreAdapterInit = await eventStoreAdapter();
        const { lokalAuth, adapter, keyCommands } = initLokalAuth(
            eventStoreAdapterInit.adapter,
        );

        const user = await lokalAuth.login("some username", "some password");
        const workspace = await lokalAuth.createWorkspace(
            user,
            "some workspace",
        );

        const expectedEvent = {
            path: "some/data",
            data: {
                hello: "world",
            },
        };
        const dateBefore = new Date();
        const event = await lokalAuth.createEvent(workspace, expectedEvent);

        const events = await adapter.event.store.allEvents();
        assertEquals(events.length, 1);

        const decryptedEvent = await keyCommands.workspace.decrypt(
            workspace.key,
            {
                data: events[0].event,
                iv: events[0].iv,
            },
        );
        const encodingService = new EventEncodingService(
            adapter.event.encoding,
        );
        const decryptedEventData = await encodingService.decode(decryptedEvent);

        assertEquals(event.path, expectedEvent.path);
        assertEquals(event.data, expectedEvent.data);
        assertExists(event.device);
        assertEquals(event.user, user.privacyId);
        assertGreaterOrEqual(event.date, dateBefore);
        assertLessOrEqual(event.date, new Date());

        assertEquals(decryptedEventData.path, expectedEvent.path);
        assertEquals(decryptedEventData.data, expectedEvent.data);
        assertExists(decryptedEventData.device);
        assertEquals(decryptedEventData.user, user.privacyId);
        assertGreaterOrEqual(decryptedEventData.date, dateBefore.getTime());
        assertLessOrEqual(decryptedEventData.date, Date.now());
    });

    Deno.test(
        `intializeLokalAuth - provides listEvents which lists all event under a specific path sorted by date - ${name}`,
        async () => {
            await using eventStoreAdapterInit = await eventStoreAdapter();
            const { lokalAuth } = initLokalAuth(eventStoreAdapterInit.adapter);

            const user = await lokalAuth.login(
                "some username",
                "some password",
            );
            const workspace = await lokalAuth.createWorkspace(
                user,
                "some workspace",
            );

            const event1Data = { data: { event: 1 } };
            const event2Data = { data: { event: 2 } };
            const event3Data = { data: { event: 3 } };
            const event4Data = { data: { event: 4 } };
            const event5Data = { data: { event: 5 } };

            const event1 = await lokalAuth.createEvent(workspace, {
                path: "some/data",
                data: event1Data,
            });
            // deno-lint-ignore no-unused-vars
            const event2 = await lokalAuth.createEvent(workspace, {
                path: "another/path",
                data: event2Data,
            });
            const event3 = await lokalAuth.createEvent(workspace, {
                path: "some/otherdata",
                data: event3Data,
            });
            const event4 = await lokalAuth.createEvent(workspace, {
                path: "some/data/subpath",
                data: event4Data,
            });
            const event5 = await lokalAuth.createEvent(workspace, {
                path: "some/data",
                data: event5Data,
            });

            // create some other user, workspaces and events
            const workspace2 = await lokalAuth.createWorkspace(
                user,
                "some workspace2",
            );
            await lokalAuth.createEvent(workspace2, {
                path: "some/data",
                data: { shouldNotBeListed: "should not be listed" },
            });
            const user2 = await lokalAuth.login(
                "some username2",
                "some password2",
            );
            const workspace3 = await lokalAuth.createWorkspace(
                user2,
                "some workspace3",
            );
            await lokalAuth.createEvent(workspace3, {
                path: "some/data",
                data: { shouldNotBeListed: "should not be listed" },
            });

            const directPathEvents = await lokalAuth.listEvents(
                workspace,
                "some/data",
            );
            assertEquals(
                directPathEvents,
                [
                    event1,
                    event4,
                    event5,
                ],
            );

            const topPathEvents = await lokalAuth.listEvents(workspace, "some");
            assertEquals(
                topPathEvents,
                [
                    event1,
                    event3,
                    event4,
                    event5,
                ],
            );

            const specificPathEvents = await lokalAuth.listEvents(
                workspace,
                "some/data/subpath",
            );
            assertEquals(specificPathEvents, [
                event4,
            ]);
        },
    );
}
