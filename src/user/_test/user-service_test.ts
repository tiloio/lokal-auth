import { assertEquals } from "@std/assert/equals";
import { UserService } from "../user-service.ts";
import { createSalt } from "../../key/key-utils.ts";
import { UserKey } from "../user-key.ts";
import { assertRejects } from "@std/assert/rejects";
import { LocalStorageAdapter } from "../store/adapters/local-storage-adapter.ts";
import { CURRENT_VERESION } from "../user-attributes.ts";
import { CborAdapter } from "../../workspace/encoding/adapters/cbor-adapter.ts";
import { InMemoryAdapter } from "../../workspace/events/adapters/in-memory-adapter.ts";

Deno.test("UserService: login new user with user username and password", async () => {
    localStorage.clear();
    const adapter = new LocalStorageAdapter();
    const userService = new UserService(adapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    const username = "some username";
    const epxectedId = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";

    const user = await userService.login(username, "some password");

    assertEquals(user.attributes.id, epxectedId);
    assertEquals(user.key.options.type, "user");
});

Deno.test("UserService: login old user with user username and password", async () => {
    localStorage.clear();
    const adapter = new LocalStorageAdapter();
    const userService = new UserService(adapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    const username = "some username";
    const hashedUsername = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";
    const salt = createSalt();

    const password = "some password";
    const someData = "some data";
    const userKey = await UserKey.fromSaltedPassword(password, salt);

    await adapter.saveUser({
        id: hashedUsername,
        encryptedAttributes: await userKey.encrypt(
            new TextEncoder().encode(
                JSON.stringify({
                    username,
                    privacyId: "some",
                    id: hashedUsername,
                    _version: CURRENT_VERESION,
                }),
            ),
        ),
        salt,
        workspaces: [],
    });

    const user = await userService.login(username, password);

    const encryptedData = await userKey.encrypt(
        new TextEncoder().encode(someData),
    );
    assertEquals(
        await user.key.decrypt(encryptedData),
        new TextEncoder().encode(someData),
    );
});

Deno.test("UserService: login fails with wrong salt", async () => {
    localStorage.clear();
    const adapter = new LocalStorageAdapter();
    const userService = new UserService(adapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    const username = "some username";
    const hashedUsername = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";
    const password = "some password";
    const salt = createSalt();
    const user = await userService.login(username, password);
    await adapter.saveUser({
        id: hashedUsername,
        encryptedAttributes: await user.key.encrypt(
            new Uint8Array([1, 3, 56, 32]),
        ),
        salt,
        workspaces: [],
    });

    await assertRejects(() => userService.login(username, password));
});

Deno.test("UserService: login fails with wrong password", async () => {
    localStorage.clear();
    const adapter = new LocalStorageAdapter();
    const userService = new UserService(adapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    const username = "some username";
    const password = "some password";

    await userService.login(username, password);

    await assertRejects(() => userService.login(username, password + "a"));
});

Deno.test("UserService: login fails if user attributes missing something", async () => {
    localStorage.clear();
    const adapter = new LocalStorageAdapter();
    const userService = new UserService(adapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    const username = "some username";
    const hashedUsername = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";
    const salt = createSalt();

    const password = "some password";
    const userKey = await UserKey.fromSaltedPassword(password, salt);

    await adapter.saveUser({
        id: hashedUsername,
        encryptedAttributes: await userKey.encrypt(
            new TextEncoder().encode(
                JSON.stringify({
                    privacyId: "some",
                    id: "hashedUsername",
                    _version: CURRENT_VERESION,
                }),
            ),
        ),
        salt,
        workspaces: [],
    });

    await assertRejects(() => userService.login(username, password));

    await adapter.saveUser({
        id: hashedUsername,
        encryptedAttributes: await userKey.encrypt(
            new TextEncoder().encode(
                JSON.stringify({
                    username: "some username",
                    id: "hashedUsername",
                    _version: CURRENT_VERESION,
                }),
            ),
        ),
        salt,
        workspaces: [],
    });

    await assertRejects(() => userService.login(username, password));

    await adapter.saveUser({
        id: hashedUsername,
        encryptedAttributes: await userKey.encrypt(
            new TextEncoder().encode(
                JSON.stringify({
                    username: "some username",
                    privacyId: "some",
                    _version: CURRENT_VERESION,
                }),
            ),
        ),
        salt,
        workspaces: [],
    });

    await assertRejects(() => userService.login(username, password));

    await adapter.saveUser({
        id: hashedUsername,
        encryptedAttributes: await userKey.encrypt(
            new TextEncoder().encode(
                JSON.stringify({
                    username: "some username",
                    privacyId: "some",
                    id: "hashedUsername",
                }),
            ),
        ),
        salt,
        workspaces: [],
    });

    await assertRejects(() => userService.login(username, password));

    await adapter.saveUser({
        id: hashedUsername,
        encryptedAttributes: await userKey.encrypt(
            new TextEncoder().encode(
                JSON.stringify({
                    username: "some username",
                    privacyId: "some",
                    id: "hashedUsername",
                    _version: 999,
                }),
            ),
        ),
        salt,
        workspaces: [],
    });

    await assertRejects(() => userService.login(username, password));
});
