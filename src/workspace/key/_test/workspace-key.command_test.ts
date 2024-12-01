import { assertEquals } from "@std/assert/equals";
import { assertRejects } from "@std/assert/rejects";
import { WorkspaceKeyCommand } from "../workspace-key.command.ts";
import { createIV } from "../../../key/key-utils.ts";

Deno.test({
    name:
        "WorkspaceKeyCommand: can create new key and encrypt and decrypt data",
    async fn() {
        const command = new WorkspaceKeyCommand();
        const workspaceKey = await command.createKey();

        const toEncrypt = new TextEncoder().encode("some data");

        const encryptedData = await command.encrypt(
            workspaceKey,
            toEncrypt,
        );

        assertEquals(
            toEncrypt,
            await command.decrypt(workspaceKey, encryptedData),
        );
    },
});

Deno.test({
    name: "WorkspaceKeyCommand: same key with other iv can not decrypt",
    async fn() {
        const command = new WorkspaceKeyCommand();
        const key = await command.createKey();

        const toEncrypt = "some data";

        const encrypted = await command.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );

        assertRejects(() =>
            command.decrypt(key, {
                iv: createIV(),
                data: encrypted.data,
            })
        );
    },
});

Deno.test({
    name: "WorkspaceKeyCommand: other key with same iv can not decrypt",
    async fn() {
        const command = new WorkspaceKeyCommand();
        const key = await command.createKey();
        const otherKey = await command.createKey();

        const toEncrypt = "some data";
        const encrypted = await command.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );

        assertRejects(() => command.decrypt(otherKey, encrypted));
    },
});

Deno.test({
    name:
        "WorkspaceKeyCommand: encrypts and decrypts with JSON export and import",
    async fn() {
        const service = new WorkspaceKeyCommand();

        const key = await service.createKey();
        const keyWithAnotherSalt = await service.fromJSON(
            await service.toJSON(key),
        );

        const toEncrypt = "some data";

        const encryptedData = await service.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );
        const decryptedData = await service.decrypt(
            keyWithAnotherSalt,
            encryptedData,
        );

        assertEquals(toEncrypt, new TextDecoder().decode(decryptedData));
    },
});
