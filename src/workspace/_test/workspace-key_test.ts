import { assertEquals } from "@std/assert/equals";
import { WorkspaceKey } from "../workspace-key.ts";
import { createIV } from "../../key/key-utils.ts";
import { assertRejects } from "@std/assert/rejects";
import { UserKey } from "../../user/user-key.ts";
import { encodeBase64 } from "jsr:@std/encoding/base64";

Deno.test({
    name: "WorkspaceKey: can create new key and encrypt and decrypt data",
    async fn() {
        const workspaceKey = await WorkspaceKey.new();

        const toEncrypt = new TextEncoder().encode("some data");

        const encryptedData = await workspaceKey.encrypt(toEncrypt);

        assertEquals(toEncrypt, await workspaceKey.decrypt(encryptedData));
    },
});

Deno.test({
    name: "WorkspaceKey: same key with other iv can not decrypt",
    async fn() {
        const key = await WorkspaceKey.new();

        const toEncrypt = "some data";

        const encrypted = await key.encrypt(
            new TextEncoder().encode(toEncrypt),
        );

        assertRejects(() =>
            key.decrypt({ iv: createIV(), data: encrypted.data })
        );
    },
});

Deno.test({
    name: "WorkspaceKey: other key with same iv can not decrypt",
    async fn() {
        const key = await WorkspaceKey.new();
        const otherKey = await WorkspaceKey.new();

        const toEncrypt = "some data";
        const encrypted = await key.encrypt(
            new TextEncoder().encode(toEncrypt),
        );

        assertRejects(() => otherKey.decrypt(encrypted));
    },
});

Deno.test({
    name:
        "WorkspaceKey: encrypts and decrypts with JSON export and import with according user key",
    async fn() {
        const userKey = await UserKey.new("password");
        const workspaceKey = await WorkspaceKey.new();

        const toEncrypt = new TextEncoder().encode("some data");

        const encryptedData = await workspaceKey.encrypt(toEncrypt);

        const exportedKey = await workspaceKey.toJSON(userKey);
        const importedKey = await WorkspaceKey.fromJSON(userKey, exportedKey);

        const decryptedData = await importedKey.decrypt(encryptedData);

        assertEquals(toEncrypt, decryptedData);
    },
});

Deno.test({
    name: "WorkspaceKey: can not import key with wrong UserKey",
    async fn() {
        const userKey = await UserKey.new("password");
        const otherUserKey = await UserKey.new("password");
        const workspaceKey = await WorkspaceKey.new();

        const exportedKey = await workspaceKey.toJSON(otherUserKey);

        assertRejects(() => WorkspaceKey.fromJSON(userKey, exportedKey));
    },
});

Deno.test({
    name: "WorkspaceKey: can not import key with wrong iv in UserKey",
    async fn() {
        const userKey = await UserKey.new("password");
        const workspaceKey = await WorkspaceKey.new();

        const exportedKey = await workspaceKey.toJSON(userKey);

        assertRejects(() =>
            WorkspaceKey.fromJSON(userKey, {
                ...exportedKey,
                iv: encodeBase64(createIV()),
            })
        );
    },
});
