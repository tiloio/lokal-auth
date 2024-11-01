import { assertEquals } from "@std/assert/equals";
import { CborAdapter } from "../../workspace/encoding/adapters/cbor-adapter.ts";
import { InMemoryAdapter } from "../../workspace/events/adapters/in-memory-adapter.ts";
import { UserService } from "../user-service.ts";
import {
    assertExists,
    assertGreaterOrEqual,
    assertLessOrEqual,
} from "@std/assert";
import { WorkspaceAttributes } from "../../workspace/workspace-attributes.ts";
import { FakeTime } from "jsr:@std/testing/time";
import { InMemoryUserStoreAdapter } from "../store/adapters/in-memory-user-store-adapter.ts";

Deno.test("User.newWorkspace: creates a new workspace", async () => {
    const adapter = new InMemoryUserStoreAdapter();
    const userService = new UserService(adapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    const user = await userService.login("some user", "some password");

    const expectedAttributes = {
        name: "some workspace",
        adapters: {
            repository: new InMemoryAdapter(),
            encoding: new CborAdapter(),
        },
    };

    const workspace = await user.createWorkspace(expectedAttributes);

    assertEquals(workspace.attributes.name, expectedAttributes.name);
    assertEquals(workspace.attributes.userPrivacyId, user.attributes.privacyId);
    assertEquals(
        workspace.eventRepository.adapter,
        expectedAttributes.adapters.repository,
    );
    assertEquals(
        workspace.encodingService.adapter,
        expectedAttributes.adapters.encoding,
    );
});

Deno.test("User.newWorkspace: saves the new workspace in the store", async () => {
    const adapter = new InMemoryUserStoreAdapter();
    const userService = new UserService(adapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    const user = await userService.login("some user", "some password");

    const expectedAttributes = {
        name: "some workspace",
        adapters: {
            repository: new InMemoryAdapter(),
            encoding: new CborAdapter(),
        },
    };

    const workspace = await user.createWorkspace(expectedAttributes);

    const loadedUser = await adapter.loadUser(user.attributes.id);

    assertExists(loadedUser);
    assertEquals(loadedUser.workspaces.length, 1);

    const loadedWorkspace = loadedUser.workspaces[0];

    assertExists(loadedWorkspace);

    assertEquals(loadedWorkspace.id, workspace.attributes.id);
    const workspaceAttributes = await WorkspaceAttributes.fromEncryptedJSON(
        workspace.key,
        loadedWorkspace.encryptedAttributes,
    );

    assertEquals(workspaceAttributes.id, workspace.attributes.id);
    assertEquals(workspaceAttributes.name, expectedAttributes.name);
    assertEquals(workspaceAttributes.userPrivacyId, user.attributes.privacyId);
});

Deno.test("User.newWorkspace.saveEvent: saves the new lastUpdateDate in the store", async () => {
    using time = new FakeTime();
    const adapter = new InMemoryUserStoreAdapter();
    const userService = new UserService(adapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    const user = await userService.login("some user", "some password");

    const expectedAttributes = {
        name: "some workspace",
        adapters: {
            repository: new InMemoryAdapter(),
            encoding: new CborAdapter(),
        },
    };

    const workspace = await user.createWorkspace(expectedAttributes);
    time.tick(1000);
    const before = new Date();
    await workspace.saveEvent({
        path: "test/test",
        data: { test: "a" },
    });

    const loadedUser = await adapter.loadUser(user.attributes.id);

    assertExists(loadedUser);
    assertEquals(loadedUser.workspaces.length, 1);

    const loadedWorkspace = loadedUser.workspaces[0];

    assertExists(loadedWorkspace);
    assertEquals(loadedWorkspace.id, workspace.attributes.id);
    const workspaceAttributes = await WorkspaceAttributes.fromEncryptedJSON(
        workspace.key,
        loadedWorkspace.encryptedAttributes,
    );

    assertLessOrEqual(
        workspaceAttributes.lastUpdateDate.getTime(),
        new Date().getTime(),
    );
    assertGreaterOrEqual(
        workspaceAttributes.lastUpdateDate.getTime(),
        before.getTime(),
    );
});
