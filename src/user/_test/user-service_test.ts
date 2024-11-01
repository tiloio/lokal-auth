import { assertEquals } from "@std/assert/equals";
import { UserService } from "../user-service.ts";
import { createSalt } from "../../key/key-utils.ts";
import { UserKey } from "../user-key.ts";
import { assertRejects } from "@std/assert/rejects";
import { CURRENT_VERESION } from "../user-attributes.ts";
import { CborAdapter } from "../../workspace/encoding/adapters/cbor-adapter.ts";
import { InMemoryAdapter } from "../../workspace/events/adapters/in-memory-adapter.ts";
import { FakeTime } from "jsr:@std/testing/time";
import { assertExists } from "@std/assert/exists";
import { assertLessOrEqual } from "@std/assert/less-or-equal";
import { assertGreaterOrEqual } from "@std/assert/greater-or-equal";
import { InMemoryUserStoreAdapter } from "../store/adapters/in-memory-user-store-adapter.ts";

Deno.test("UserService: login new user with user username and password", async () => {
    const adapter = new InMemoryUserStoreAdapter();
    const userService = new UserService(adapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    const username = "some username";
    const epxectedId = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";

    const before = new Date();
    const user = await userService.login(username, "some password");

    assertEquals(user.attributes.id, epxectedId);
    assertEquals(user.key.options.type, "user");
    assertLessOrEqual(
        user.attributes.creationDate.getTime(),
        new Date().getTime(),
    );
    assertGreaterOrEqual(
        user.attributes.creationDate.getTime(),
        before.getTime(),
    );
});

Deno.test("UserService: login old user with user username and password", async () => {
    const adapter = new InMemoryUserStoreAdapter();
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
                    creationDate: new Date().getTime(),
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

Deno.test("UserService: login old user and load the workspaces with lastUpdateDate", async () => {
    using time = new FakeTime();
    const adapter = new InMemoryUserStoreAdapter();
    const userService = new UserService(adapter, {
        encoding: new CborAdapter(),
        repository: new InMemoryAdapter(),
    });

    const username = "some username";
    const password = "some password";

    const userOld = await userService.login(username, password);
    const workspaceOld1 = await userOld.createWorkspace({
        name: "some workspace1",
    });
    const workspaceOld2 = await userOld.createWorkspace({
        name: "some workspace2",
    });

    time.tick(1000);
    const beforeUpdateWorkspaceOld1 = new Date();
    await workspaceOld1.saveEvent({
        path: "test/test",
        data: { test: "a" },
    });
    const afterUpdateWorkspaceOld1 = new Date();
    time.tick(1000);

    const user = await userService.login(username, password);

    assertEquals(user.workspaces.length, 2);
    const workspace1 = user.workspaces.find((workspace) =>
        workspace.attributes.id === workspaceOld1.attributes.id
    );
    const workspace2 = user.workspaces.find((workspace) =>
        workspace.attributes.id === workspaceOld2.attributes.id
    );
    assertExists(workspace1);
    assertExists(workspace2);

    assertEquals(
        workspace1.attributes.creationDate.getTime(),
        workspaceOld1.attributes.creationDate.getTime(),
    );
    assertEquals(
        workspace2.attributes.creationDate.getTime(),
        workspaceOld2.attributes.creationDate.getTime(),
    );
    assertEquals(
        workspace2.attributes.lastUpdateDate.getTime(),
        workspaceOld2.attributes.lastUpdateDate.getTime(),
    );

    assertLessOrEqual(
        workspace1.attributes.lastUpdateDate.getTime(),
        afterUpdateWorkspaceOld1.getTime(),
    );
    assertGreaterOrEqual(
        workspace1.attributes.lastUpdateDate.getTime(),
        beforeUpdateWorkspaceOld1.getTime(),
    );
});

Deno.test("UserService: login fails with wrong salt", async () => {
    const adapter = new InMemoryUserStoreAdapter();
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
    const adapter = new InMemoryUserStoreAdapter();
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
    const adapter = new InMemoryUserStoreAdapter();
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
