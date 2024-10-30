import { assertEquals } from "@std/assert/equals";
import { SessionStorageAdapter } from "../session-storage-adapter.ts";
import { assertThrows } from "@std/assert/throws";
import type {
    StoreUserAttributes,
    StoreUserWorkspaceAttribute,
} from "../../../user.types.ts";
import type { WorkspaceAttributes } from "../../../../workspace/workspace.ts";
import type { Encrypted } from "../../../../key/types.ts";
import { assertRejects } from "@std/assert/rejects";

Deno.test("SessionStorageAdapter saveUser: stores user data into the local storage stringified", async () => {
    const adapter = new SessionStorageAdapter();

    const expectedUser = {
        id: "some id",
        name: "some name",
        email: "some email",
        salt: new Uint8Array([1, 98, 3]),
        workspaces: [
            {
                attributes: {
                    id: "some id",
                    name: "some name",
                    userId: "some id",
                },
                encryptedKey: {
                    data: new Uint8Array([1, 120, 4]),
                    iv: new Uint8Array([1, 4, 5]),
                },
            },
        ],
    };
    await adapter.saveUser(expectedUser);

    const resultUser = sessionStorage.getItem(
        `lokal-auth-user-${expectedUser.id}`,
    );

    assertEquals(
        resultUser,
        '{"id":"some id","name":"some name","email":"some email","salt":"AWID","workspaces":[{"attributes":{"id":"some id","name":"some name","userId":"some id"},"encryptedKey":{"data":"AXgE","iv":"AQQF"}}]}',
    );
});

Deno.test("SessionStorageAdapte loadUser: reads user data from the local storage stringified", async () => {
    const adapter = new SessionStorageAdapter();

    const expectedUser = {
        id: "some id",
        name: "some name",
        email: "some email",
        salt: new Uint8Array([1, 98, 3]),
        workspaces: [
            {
                attributes: {
                    id: "some id",
                    name: "some name",
                    userId: "some id",
                },
                encryptedKey: {
                    data: new Uint8Array([1, 120, 4]),
                    iv: new Uint8Array([1, 4, 5]),
                },
            },
        ],
    };

    sessionStorage.setItem(
        `lokal-auth-user-${expectedUser.id}`,
        '{"id":"some id","name":"some name","email":"some email","salt":"AWID","workspaces":[{"attributes":{"id":"some id","name":"some name","userId":"some id"},"encryptedKey":{"data":"AXgE","iv":"AQQF"}}]}',
    );
    const resultUser = await adapter.loadUser(expectedUser.id);

    assertEquals(resultUser, expectedUser);
});

Deno.test("SessionStorageAdapter loadUser: fails if user or workspace object is missing any property", async () => {
    const adapter = new SessionStorageAdapter();

    const userId = "some id";
    const baseUser = {
        id: userId,
        name: "some name",
        email: "some email",
        salt: "some salt",
        workspaces: [
            {
                attributes: {
                    id: "some id",
                    name: "some name",
                    userId: "some id",
                },
                encryptedKey: {
                    data: "some data",
                    iv: "some iv",
                },
            },
        ],
    };

    // Test for missing top-level properties
    const topLevelProperties: (keyof StoreUserAttributes)[] = [
        "id",
        "name",
        "email",
        "salt",
        "workspaces",
    ];
    for (const prop of topLevelProperties) {
        const wrongUser = { ...baseUser };
        delete wrongUser[prop];

        sessionStorage.setItem(
            `lokal-auth-user-${userId}`,
            JSON.stringify(wrongUser),
        );

        assertRejects(() => adapter.loadUser(userId));
    }

    // Test for missing workspace sub-properties
    const workspaceProperties: (keyof StoreUserWorkspaceAttribute)[] = [
        "attributes",
        "encryptedKey",
    ];
    for (const prop of workspaceProperties) {
        const wrongUser = JSON.parse(JSON.stringify(baseUser));
        delete wrongUser.workspaces[0][prop];

        sessionStorage.setItem(
            `lokal-auth-user-${userId}`,
            JSON.stringify(wrongUser),
        );
        assertRejects(() => adapter.loadUser(userId));
    }

    // Test for missing attributes sub-properties
    const attributeProperties: (keyof WorkspaceAttributes)[] = [
        "id",
        "name",
        "userId",
    ];
    for (const prop of attributeProperties) {
        const wrongUser = JSON.parse(JSON.stringify(baseUser));
        delete wrongUser.workspaces[0].attributes[prop];

        sessionStorage.setItem(
            `lokal-auth-user-${userId}`,
            JSON.stringify(wrongUser),
        );

        assertRejects(() => adapter.loadUser(userId));
    }

    // Test for missing encryptedKey sub-properties
    const encryptedKeyProperties: (keyof Encrypted)[] = ["data", "iv"];
    for (const prop of encryptedKeyProperties) {
        const wrongUser = JSON.parse(JSON.stringify(baseUser));
        delete wrongUser.workspaces[0].encryptedKey[prop];

        sessionStorage.setItem(
            `lokal-auth-user-${userId}`,
            JSON.stringify(wrongUser),
        );

        assertRejects(() => adapter.loadUser(userId));
    }
});
