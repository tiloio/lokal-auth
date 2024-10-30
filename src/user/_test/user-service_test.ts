import { assertEquals } from "@std/assert/equals";
import { LocalStorageSaltAdapter } from "../store/adapters/local-storage-salt-adapter.ts";
import { UserService } from "../user-service.ts";
import { createSalt } from "../../key/key-utils.ts";
import { UserKey } from "../user-key.ts";
import { assertRejects } from "@std/assert/rejects";

Deno.test("UserService: login new user with user id and password", async () => {
    const adapter = new LocalStorageSaltAdapter();
    const userService = new UserService(adapter);

    const id = "some id";

    const user = await userService.login(id, "some password");

    assertEquals(user.attributes.id, id);
    assertEquals(user.key.options.type, "user");
});

Deno.test("UserService: login old user with user id and password", async () => {
    const adapter = new LocalStorageSaltAdapter();

    const userService = new UserService(adapter);

    const id = "some id";
    const salt = createSalt();
    await adapter.saveSalt(id, salt);

    const password = "some password";
    const someData = "some data";
    const userKey = await UserKey.fromSaltedPassword(password, salt);

    const user = await userService.login(id, password);

    const encryptedData = await userKey.encrypt(
        new TextEncoder().encode(someData),
    );
    assertEquals(
        await user.key.decrypt(encryptedData),
        new TextEncoder().encode(someData),
    );
});

Deno.test("UserService: login fails with wrong salt", async () => {
    const adapter = new LocalStorageSaltAdapter();
    const userService = new UserService(adapter);

    const id = "some id";
    const password = "some password";
    const salt = createSalt();
    await userService.login(id, password);
    await adapter.saveSalt(id, salt);

    assertRejects(() => userService.login(id, password));
});

Deno.test("UserService: login fails with wrong password", async () => {
    const adapter = new LocalStorageSaltAdapter();
    const userService = new UserService(adapter);

    const id = "some id";
    const password = "some password";
    const salt = createSalt();
    await userService.login(id, password);
    await adapter.saveSalt(id, salt);

    assertRejects(() => userService.login(id, password + "a"));
});
