import { assertEquals } from "@std/assert";
import { UserKeyCommand } from "../../../key/user-key.command.ts";
import { InMemoryUserStoreAdapter } from "../../../store/adapters/in-memory-user-store-adapter.ts";
import { CURRENT_USER_VERSION, type User } from "../../../user.types.ts";
import { UserCreateCommand } from "../user-create.command.ts";
import type { UserCreateOptions } from "../user-create.command.types.ts";
import { assertExists } from "@std/assert/exists";
import type { EncryptedUserAttributes } from "../../../attributes/attributes.user.types.ts";
import { WorkspaceKeyCommand } from "../../../../workspace/key/workspace-key.command.ts";

Deno.test("UserCommand: createUser creates a new user", async () => {
    const adapter = new InMemoryUserStoreAdapter();
    const userKeyService = new UserKeyCommand();
    const workspaceKeyCommand = new WorkspaceKeyCommand();
    const commandUser = new UserCreateCommand(
        adapter,
        userKeyService,
        workspaceKeyCommand,
    );

    const newUser: UserCreateOptions = {
        hashedId: "some hash",
        username: "some username",
        password: "some password",
    };
    const user = await commandUser.createUser(newUser);

    const expectedUser: User = {
        id: "some hash",
        username: "some username",
        key: user.key,
        workspaces: [],
        creationDate: user.creationDate,
        lastUpdateDate: user.lastUpdateDate,
        privacyId: user.privacyId,
        _version: CURRENT_USER_VERSION,
    };

    assertEquals(user, expectedUser);

    const loadedUser = await adapter.loadUser(user.id);
    assertExists(loadedUser);

    const expectedUserAttributes: EncryptedUserAttributes = {
        id: user.id,
        privacyId: user.privacyId,
        username: user.username,
        creationDate: user.creationDate.getTime(),
        lastUpdateDate: user.creationDate.getTime(),
        workspaces: [],
        _version: CURRENT_USER_VERSION,
    };

    assertEquals(
        JSON.parse(
            new TextDecoder().decode(
                await userKeyService.decrypt(
                    user.key,
                    loadedUser.encryptedAttributes,
                ),
            ),
        ),
        expectedUserAttributes,
    );
});
