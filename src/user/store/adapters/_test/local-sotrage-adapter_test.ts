import { assertEquals } from "@std/assert/equals";
import { LocalStorageAdapter } from "../local-storage-adapter.ts";
import type { Encrypted } from "../../../../key/types.ts";
import { assertRejects } from "@std/assert/rejects";
import type { NewStoredUser } from "../user-store-adapter.types.ts";

Deno.test("localStorageAdapter saveUser: stores user data into the local storage stringified", async () => {
    localStorage.clear();
    const adapter = new LocalStorageAdapter();

    const expectedUser = {
        id: "some id",
        encryptedAttributes: {
            data: new Uint8Array([13, 120, 4]),
            iv: new Uint8Array([15, 4, 5]),
        },
        salt: new Uint8Array([1, 98, 3]),
        workspaces: [
            {
                id: "some id",
                key: {
                    key: "some key",
                    iv: "some iv",
                    options: {
                        type: "workspace",
                        version: "001",
                        key: {
                            algorithm: "AES-GCM",
                            length: 256,
                        } as const,
                    } as const,
                },
                encryptedAttributes: {
                    data: new Uint8Array([1, 120, 4]),
                    iv: new Uint8Array([1, 4, 5]),
                },
            },
        ],
    };
    await adapter.saveUser(expectedUser);

    const resultUser = localStorage.getItem(
        `lokal-auth-user-${expectedUser.id}`,
    );

    assertEquals(
        resultUser,
        '{"id":"some id","encryptedAttributes":{"data":"DXgE","iv":"DwQF"},"salt":"AWID"}',
    );
});

Deno.test("localStorageAdapte loadUser: reads user data from the local storage stringified", async () => {
    localStorage.clear();
    const adapter = new LocalStorageAdapter();

    const expectedUser = {
        id: "some id",
        encryptedAttributes: {
            data: new Uint8Array([13, 120, 4]),
            iv: new Uint8Array([15, 4, 5]),
        },
        salt: new Uint8Array([1, 98, 3]),
    };

    localStorage.setItem(
        `lokal-auth-user-${expectedUser.id}`,
        '{"id":"some id","encryptedAttributes":{"data":"DXgE","iv":"DwQF"},"salt":"AWID"}',
    );
    const resultUser = await adapter.loadUser(expectedUser.id);

    assertEquals(resultUser, expectedUser);
});

Deno.test("localStorageAdapter loadUser: fails if user object is missing any property", () => {
    localStorage.clear();
    const adapter = new LocalStorageAdapter();

    const userId = "some id";
    const baseUser = {
        id: userId,
        encryptedAttributes: {
            data: "some endata",
            iv: "some eniv",
        },
        salt: "some salt",
    };

    // Test for missing top-level properties
    const topLevelProperties: (keyof NewStoredUser)[] = [
        "id",
        "encryptedAttributes",
        "salt",
    ];
    for (const prop of topLevelProperties) {
        const wrongUser = { ...baseUser };
        delete wrongUser[prop];

        localStorage.setItem(
            `lokal-auth-user-${userId}`,
            JSON.stringify(wrongUser),
        );

        assertRejects(() => adapter.loadUser(userId));
    }

    // Test for missing encryptedKey sub-properties
    const encryptedKeyProperties: (keyof Encrypted)[] = ["data", "iv"];
    for (const prop of encryptedKeyProperties) {
        const wrongUser = JSON.parse(JSON.stringify(baseUser));
        delete wrongUser.encryptedAttributes[prop];

        localStorage.setItem(
            `lokal-auth-user-${userId}`,
            JSON.stringify(wrongUser),
        );

        assertRejects(() => adapter.loadUser(userId));
    }
});
