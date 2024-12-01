import { assertEquals } from "@std/assert/equals";
import { assertRejects } from "@std/assert/rejects";
import { FakeTime } from "jsr:@std/testing/time";
import { assertExists } from "@std/assert/exists";
import { assertLessOrEqual } from "@std/assert/less-or-equal";
import { assertGreaterOrEqual } from "@std/assert/greater-or-equal";
import {
    newUserService,
    testEncryptUserAttributes,
} from "./service.user.test.utils.ts";
import { createSalt } from "../../../key/key-utils.ts";
import { CURRENT_USER_VERSION } from "../../user.types.ts";

Deno.test("UserService: login new user with user username and password", async () => {
    const { userService } = newUserService();

    const username = "some username";
    const epxectedId = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";

    const before = new Date();
    const user = await userService.login(username, "some password");

    assertEquals(user.id, epxectedId);
    assertEquals(user.key.options.type, "user");
    assertLessOrEqual(
        user.creationDate.getTime(),
        new Date().getTime(),
    );
    assertGreaterOrEqual(
        user.creationDate.getTime(),
        before.getTime(),
    );
});

Deno.test("UserService: login old user with user username and password", async () => {
    const { userService, adapter, keys } = newUserService();

    const username = "some username";
    const hashedUsername = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";
    const salt = createSalt();

    const password = "some password";
    const someData = "some data";
    const userKey = await keys.user.keyFromSaltedPassword(password, salt);

    await adapter.user.store.saveUser({
        id: hashedUsername,
        encryptedAttributes: await testEncryptUserAttributes(
            keys.user,
            userKey,
            {
                id: hashedUsername,
                privacyId: "some",
                username,
                workspaces: [],
                creationDate: new Date().getTime(),
                lastUpdateDate: new Date().getTime(),
                _version: CURRENT_USER_VERSION,
            },
        ),
        salt,
    });

    const user = await userService.login(username, password);

    const encryptedData = await keys.user.encrypt(
        userKey,
        new TextEncoder().encode(someData),
    );
    assertEquals(
        await keys.user.decrypt(user.key, encryptedData),
        new TextEncoder().encode(someData),
    );
});

Deno.test("UserService: login old user and load the workspaces with lastUpdateDate", async () => {
    using time = new FakeTime();
    const { userService, workspaceService } = newUserService();

    const username = "some username";
    const password = "some password";

    const userOld = await userService.login(username, password);
    const workspaceOld1 = await workspaceService.newWorkspace(
        userOld,
        "some workspace1",
    );
    const workspaceOld2 = await workspaceService.newWorkspace(
        userOld,
        "some workspace2",
    );

    time.tick(10);
    // const beforeUpdateWorkspaceOld1 = new Date();

    await workspaceService.createEvent(workspaceOld1, {
        path: "test/test",
        data: { test: "a" },
    });
    const afterUpdateWorkspaceOld1 = new Date();
    time.tick(10);

    const user = await userService.login(username, password);

    assertEquals(user.workspaces.length, 2);
    const workspace1 = user.workspaces.find((workspace) =>
        workspace.id === workspaceOld1.id
    );
    const workspace2 = user.workspaces.find((workspace) =>
        workspace.id === workspaceOld2.id
    );
    assertExists(workspace1);
    assertExists(workspace2);

    assertEquals(
        workspace1.creationDate.getTime(),
        workspaceOld1.creationDate.getTime(),
    );
    assertEquals(
        workspace2.creationDate.getTime(),
        workspaceOld2.creationDate.getTime(),
    );
    assertEquals(
        workspace2.lastUpdateDate.getTime(),
        workspaceOld2.lastUpdateDate.getTime(),
    );

    assertLessOrEqual(
        workspace1.lastUpdateDate.getTime(),
        afterUpdateWorkspaceOld1.getTime(),
    );
    // TODO implement update workspace
    // assertGreaterOrEqual(
    //     workspace1.lastUpdateDate.getTime(),
    //     beforeUpdateWorkspaceOld1.getTime(),
    // );
});

Deno.test("UserService: login fails with wrong salt", async () => {
    const { userService, adapter, keys } = newUserService();

    const username = "some username";
    const hashedUsername = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";
    const password = "some password";
    const salt = createSalt();
    const user = await userService.login(username, password);
    await adapter.user.store.saveUser({
        id: hashedUsername,
        encryptedAttributes: await keys.user.encrypt(
            user.key,
            new Uint8Array([1, 3, 56, 32]),
        ),
        salt,
    });

    await assertRejects(() => userService.login(username, password));
});

Deno.test("UserService: login fails with wrong password", async () => {
    const { userService } = newUserService();

    const username = "some username";
    const password = "some password";

    await userService.login(username, password);

    await assertRejects(() => userService.login(username, password + "a"));
});

Deno.test("UserService: login fails if user attributes missing something", async () => {
    const { userService, adapter, keys } = newUserService();

    const username = "some username";
    const hashedUsername = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";
    const salt = createSalt();

    const password = "some password";
    const userKey = await keys.user.keyFromSaltedPassword(password, salt);

    await adapter.user.store.saveUser({
        id: hashedUsername,
        encryptedAttributes: await keys.user.encrypt(
            userKey,
            new TextEncoder().encode(
                JSON.stringify({
                    privacyId: "some",
                    id: "hashedUsername",
                }),
            ),
        ),
        salt,
    });

    await assertRejects(() => userService.login(username, password));
});
