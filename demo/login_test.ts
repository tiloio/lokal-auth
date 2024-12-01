import { assertEquals } from "@std/assert/equals";
import { assertExists } from "@std/assert/exists";
import { UserAttributesFromByteEncodedJSON } from "../src/user/attributes/attributes.user.ts";
import type { UserAttributes } from "../src/user/attributes/attributes.user.types.ts";
import { assertRejects } from "@std/assert/rejects";
import { assertNotEquals } from "@std/assert/not-equals";
import { initLokalAuth } from "./test.utils.ts";
import { createSalt } from "../src/key/key-utils.ts";
import { CURRENT_USER_VERSION } from "../src/user/user.types.ts";
import type { LokalAuthUser } from "../src/types.ts";
import type { LokalAuthSaltedKey } from "../src/key/types.ts";

Deno.test("intializeLokalAuth - provides a login function which logins a already stored user", async () => {
    const { lokalAuth, adapter, keyCommands } = initLokalAuth();

    const username = "some username";
    const hashedUsername = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";
    const salt = createSalt();

    const password = "some password";
    const someData = "some data";
    const userKey = await keyCommands.user.keyFromSaltedPassword(
        password,
        salt,
    );

    await adapter.user.store.saveUser({
        id: hashedUsername,
        encryptedAttributes: await keyCommands.user.encrypt(
            userKey,
            new TextEncoder().encode(
                JSON.stringify({
                    username,
                    privacyId: "some",
                    id: hashedUsername,
                    workspaces: [],
                    creationDate: new Date().getTime(),
                    lastUpdateDate: new Date().getTime(),
                    _version: CURRENT_USER_VERSION,
                }),
            ),
        ),
        salt,
    });

    const user = await lokalAuth.login(username, password);

    const encryptedData = await keyCommands.user.encrypt(
        userKey,
        new TextEncoder().encode(someData),
    );
    assertEquals(
        await keyCommands.user.decrypt(user.key, encryptedData),
        new TextEncoder().encode(someData),
    );
});

Deno.test("intializeLokalAuth - provides a login function which creates a new user and stores it in the user store", async () => {
    const { lokalAuth, adapter, keyCommands } = initLokalAuth();

    const user = await lokalAuth.login("some-user", "some-password");

    const storedUser = await adapter.user.store.loadUser(user.id);
    assertExists(storedUser);

    const userKey = await keyCommands.user.keyFromSaltedPassword(
        "some-password",
        user.key.salt,
    );
    const storedUserAttributes = await UserAttributesFromByteEncodedJSON(
        keyCommands.workspace,
        await keyCommands.user.decrypt(userKey, storedUser.encryptedAttributes),
    );
    const userAttributes = removeKeyFromUserAttributes(user);
    assertEquals(storedUserAttributes, userAttributes);
});

Deno.test("intializeLokalAuth - provides a login function which creates a new user and stores it encrypted in the user store which is not readable with a wrong password", async () => {
    const { lokalAuth, adapter, keyCommands } = initLokalAuth();

    const user = await lokalAuth.login("some-user", "some-password");

    const storedUser = await adapter.user.store.loadUser(user.id);
    assertExists(storedUser);

    const userKey = await keyCommands.user.keyFromSaltedPassword(
        "some-wpassword",
        user.key.salt,
    );
    assertRejects(() =>
        keyCommands.user.decrypt(userKey, storedUser.encryptedAttributes)
    );
});

Deno.test("intializeLokalAuth - provides a login function which can login multiple times with the same user", async () => {
    const { lokalAuth, adapter, keyCommands } = initLokalAuth();

    const user = await lokalAuth.login("some-user", "some-password");
    const user2 = await lokalAuth.login("some-user", "some-password");
    const user3 = await lokalAuth.login("some-user", "some-password");

    const storedUser = await adapter.user.store.loadUser(user.id);
    assertExists(storedUser);

    const storedUserAttributes = await UserAttributesFromByteEncodedJSON(
        keyCommands.workspace,
        await keyCommands.user.decrypt(
            user2.key,
            storedUser.encryptedAttributes,
        ),
    );
    const userAttributes = removeKeyFromUserAttributes(user);
    assertEquals(storedUserAttributes, userAttributes);

    assertEquals(user2, user3);
});

Deno.test("intializeLokalAuth - provides a login function which can create multiple users", async () => {
    const { lokalAuth, adapter, keyCommands } = initLokalAuth();
    const user = await lokalAuth.login("some-user", "some-password");
    const newUser = await lokalAuth.login("some-new-user", "some-new-password");

    const storedUser = await adapter.user.store.loadUser(user.id);
    assertExists(storedUser);

    const storedNewUser = await adapter.user.store.loadUser(newUser.id);
    assertExists(storedNewUser);

    const storedUserAttributes = await UserAttributesFromByteEncodedJSON(
        keyCommands.workspace,
        await keyCommands.user.decrypt(
            user.key,
            storedUser.encryptedAttributes,
        ),
    );
    const newStoredUserAttributes = await UserAttributesFromByteEncodedJSON(
        keyCommands.workspace,
        await keyCommands.user.decrypt(
            newUser.key,
            storedNewUser.encryptedAttributes,
        ),
    );

    const userAttributes = removeKeyFromUserAttributes(user);
    assertEquals(storedUserAttributes, userAttributes);

    const newUserAttributes = removeKeyFromUserAttributes(newUser);
    assertEquals(newStoredUserAttributes, newUserAttributes);

    assertNotEquals(user.id, newUser.id);
    assertNotEquals(user.privacyId, newUser.privacyId);
    assertNotEquals(user.username, newUser.username);
    assertNotEquals(user.creationDate, newUser.creationDate);
});

function removeKeyFromUserAttributes(
    userAttributes: LokalAuthUser,
): UserAttributes {
    const userAttributesWithoutKey: UserAttributes & {
        key?: LokalAuthSaltedKey;
    } = Object.assign(
        {},
        userAttributes,
    );
    delete userAttributesWithoutKey.key;
    return userAttributesWithoutKey;
}
