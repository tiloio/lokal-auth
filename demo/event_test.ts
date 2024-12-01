import { assertExists } from "@std/assert/exists";
import { initLokalAuth } from "./test.utils.ts";
import { assertEquals } from "@std/assert/equals";
import { EventEncodingService } from "../src/workspace/events/encoding/event-encoding-service.ts";
import { assertGreaterOrEqual } from "@std/assert/greater-or-equal";
import { assertLessOrEqual } from "@std/assert/less-or-equal";

Deno.test("intializeLokalAuth - provides createEvent which creates a new event", async () => {
    const { lokalAuth, adapter, keyCommands } = initLokalAuth();

    const user = await lokalAuth.login("some username", "some password");
    const workspace = await lokalAuth.createWorkspace(user, "some workspace");

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
    const encodingService = new EventEncodingService(adapter.event.encoding);
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
