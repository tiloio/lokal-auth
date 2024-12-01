import { assertEquals } from "@std/assert/equals";
import { assertRejects } from "@std/assert";
import { createIV } from "../../../key/key-utils.ts";
import { UserKeyCommand } from "../user-key.command.ts";

Deno.test({
    name: "UserKeyCommand: new key with random salt can not decrypt",
    async fn() {
        const command = new UserKeyCommand();
        const password = "password";

        const key = await command.createKey(password);
        const keyWithAnotherSalt = await command.createKey(password);

        const toEncrypt = "some data";

        const encryptedData = await command.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );

        assertRejects(() => command.decrypt(keyWithAnotherSalt, encryptedData));
    },
});

Deno.test({
    name: "UserKeyCommand: same key with other iv can not decrypt",
    async fn() {
        const command = new UserKeyCommand();
        const password = "password";

        const key = await command.createKey(password);

        const toEncrypt = "some data";

        const encrypted = await command.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );

        assertRejects(() =>
            command.decrypt(key, { iv: createIV(), data: encrypted.data })
        );
    },
});

Deno.test({
    name: "UserKeyCommand: new key with other password can not decrypt",
    async fn() {
        const command = new UserKeyCommand();
        const password = "password";
        const passwordOther = "passwor";

        const key = await command.createKey(password);
        const keyWithAnotherSalt = await command.keyFromSaltedPassword(
            passwordOther,
            key.salt,
        );

        const toEncrypt = "some data";

        const encryptedData = await command.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );

        assertRejects(() => command.decrypt(keyWithAnotherSalt, encryptedData));
    },
});

Deno.test({
    name: "UserKeyCommand: encrypts and decrypts with same password and salt",
    async fn() {
        const command = new UserKeyCommand();
        const password = "password";

        const key = await command.createKey(password);
        const keyWithAnotherSalt = await command.keyFromSaltedPassword(
            password,
            key.salt,
        );

        const toEncrypt = "some data";

        const encryptedData = await command.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );
        const decryptedData = await command.decrypt(
            keyWithAnotherSalt,
            encryptedData,
        );

        assertEquals(toEncrypt, new TextDecoder().decode(decryptedData));
    },
});

Deno.test({
    name: "UserKeyCommand: encrypts and decrypts with JSON export and import",
    async fn() {
        const command = new UserKeyCommand();
        const password = "password";

        const key = await command.createKey(password);
        const keyWithAnotherSalt = await command.fromJSON(
            await command.toJSON(key),
        );

        const toEncrypt = "some data";

        const encryptedData = await command.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );
        const decryptedData = await command.decrypt(
            keyWithAnotherSalt,
            encryptedData,
        );

        assertEquals(toEncrypt, new TextDecoder().decode(decryptedData));
    },
});
