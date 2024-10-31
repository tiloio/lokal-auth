import { assertEquals } from "@std/assert/equals";
import { CborAdapter } from "../../workspace/encoding/adapters/cbor-adapter.ts";
import { InMemoryAdapter } from "../../workspace/events/adapters/in-memory-adapter.ts";
import { LocalStorageAdapter } from "../store/adapters/local-storage-adapter.ts";
import { UserService } from "../user-service.ts";
import { assertExists } from "@std/assert";
import { WorkspaceAttributes } from "../../workspace/workspace-attributes.ts";

Deno.test("User.newWorkspace: creates a new workspace", async () => {
    localStorage.clear();
    const adapter = new LocalStorageAdapter();
    const userService = new UserService(adapter);

    const user = await userService.login("some user", "some password");

    const expectedAttributes = {
        name: "some workspace",
        adapters: {
            repository: new InMemoryAdapter(),
            encoding: new CborAdapter(),
        },
    };

    const workspace = await user.newWorkspace(expectedAttributes);

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
    localStorage.clear();
    const adapter = new LocalStorageAdapter();
    const userService = new UserService(adapter);

    const user = await userService.login("some user", "some password");

    const expectedAttributes = {
        name: "some workspace",
        adapters: {
            repository: new InMemoryAdapter(),
            encoding: new CborAdapter(),
        },
    };

    const workspace = await user.newWorkspace(expectedAttributes);

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
