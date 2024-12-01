import { assertExists } from "@std/assert/exists";
import { initLokalAuth } from "./test.utils.ts";
import { UserAttributesFromByteEncodedJSON } from "../src/user/attributes/attributes.user.ts";
import { assertEquals } from "@std/assert/equals";

Deno.test("intializeLokalAuth - provides createWorkspace which creates a new workspace", async () => {
    const { lokalAuth, adapter, keyCommands } = initLokalAuth();

    const user = await lokalAuth.login("some username", "some password");

    const workspace = await lokalAuth.createWorkspace(user, "some workspace");

    const storedUser = await adapter.user.store.loadUser(user.id);
    assertExists(storedUser);

    const storedUserAttributes = await UserAttributesFromByteEncodedJSON(
        keyCommands.workspace,
        await keyCommands.user.decrypt(
            user.key,
            storedUser.encryptedAttributes,
        ),
    );
    assertEquals(storedUserAttributes.workspaces, [workspace]);
});

Deno.test("intializeLokalAuth - provides createWorkspace which creates multiple workspaces", async () => {
    const { lokalAuth, adapter, keyCommands } = initLokalAuth();

    const user = await lokalAuth.login("some username", "some password");

    const workspace1 = await lokalAuth.createWorkspace(user, "some workspace1");
    const workspace2 = await lokalAuth.createWorkspace(user, "some workspace2");
    const workspace3 = await lokalAuth.createWorkspace(user, "some workspace3");

    const storedUser = await adapter.user.store.loadUser(user.id);
    assertExists(storedUser);

    const storedUserAttributes = await UserAttributesFromByteEncodedJSON(
        keyCommands.workspace,
        await keyCommands.user.decrypt(
            user.key,
            storedUser.encryptedAttributes,
        ),
    );
    assertEquals(storedUserAttributes.workspaces, [
        workspace1,
        workspace2,
        workspace3,
    ]);
});

Deno.test("intializeLokalAuth - provides createWorkspace which creates multiple workspaces for multiple users", async () => {
    const { lokalAuth, adapter, keyCommands } = initLokalAuth();

    const user1 = await lokalAuth.login("some username1", "some password1");
    const user2 = await lokalAuth.login("some username2", "some password2");

    const workspace1 = await lokalAuth.createWorkspace(
        user1,
        "some workspace1",
    );
    const workspace2 = await lokalAuth.createWorkspace(
        user2,
        "some workspace2",
    );
    const workspace3 = await lokalAuth.createWorkspace(
        user1,
        "some workspace3",
    );
    const workspace4 = await lokalAuth.createWorkspace(
        user2,
        "some workspace4",
    );

    const storedUser1 = await adapter.user.store.loadUser(user1.id);
    assertExists(storedUser1);

    const storedUser2 = await adapter.user.store.loadUser(user2.id);
    assertExists(storedUser2);

    const storedUserAttributes1 = await UserAttributesFromByteEncodedJSON(
        keyCommands.workspace,
        await keyCommands.user.decrypt(
            user1.key,
            storedUser1.encryptedAttributes,
        ),
    );
    const storedUserAttributes2 = await UserAttributesFromByteEncodedJSON(
        keyCommands.workspace,
        await keyCommands.user.decrypt(
            user2.key,
            storedUser2.encryptedAttributes,
        ),
    );
    assertEquals(storedUserAttributes1.workspaces, [workspace1, workspace3]);
    assertEquals(storedUserAttributes2.workspaces, [workspace2, workspace4]);
});

Deno.test("intializeLokalAuth - login lists all workspaces for a user", async () => {
    const { lokalAuth } = initLokalAuth();
    const user1 = await lokalAuth.login("some username1", "some password1");
    const user2 = await lokalAuth.login("some username2", "some password2");

    const workspace1 = await lokalAuth.createWorkspace(
        user1,
        "some workspace1",
    );
    const workspace2 = await lokalAuth.createWorkspace(
        user2,
        "some workspace2",
    );
    const workspace3 = await lokalAuth.createWorkspace(
        user1,
        "some workspace3",
    );
    const workspace4 = await lokalAuth.createWorkspace(
        user2,
        "some workspace4",
    );

    const userWithWorkspaces1 = await lokalAuth.login(
        "some username1",
        "some password1",
    );
    const userWithWorkspaces2 = await lokalAuth.login(
        "some username2",
        "some password2",
    );

    assertEquals(userWithWorkspaces1.workspaces.length, 2);
    assertEquals(userWithWorkspaces2.workspaces.length, 2);
    assertEquals(userWithWorkspaces1.workspaces[0].id, workspace1.id);
    assertEquals(userWithWorkspaces1.workspaces[1].id, workspace3.id);
    assertEquals(userWithWorkspaces2.workspaces[0].id, workspace2.id);
    assertEquals(userWithWorkspaces2.workspaces[1].id, workspace4.id);
});
