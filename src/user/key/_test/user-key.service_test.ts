import { assertEquals } from "@std/assert/equals";
import { assertRejects } from "@std/assert";
import { createIV } from "../../../key/key-utils.ts";
import { UserKeyService } from "../user-key.service.ts";

Deno.test({
    name: "UserKey: new key with random salt can not decrypt",
    async fn() {
        const service = new UserKeyService();
        const password = "password";

        const key = await service.createKey(password);
        const keyWithAnotherSalt = await service.createKey(password);

        const toEncrypt = "some data";

        const encryptedData = await service.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );

        assertRejects(() => service.decrypt(keyWithAnotherSalt, encryptedData));
    },
});

Deno.test({
    name: "UserKey: same key with other iv can not decrypt",
    async fn() {
        const service = new UserKeyService();
        const password = "password";

        const key = await service.createKey(password);

        const toEncrypt = "some data";

        const encrypted = await service.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );

        assertRejects(() =>
            service.decrypt(key,{ iv: createIV(), data: encrypted.data })
        );
    },
});

Deno.test({
    name: "UserKey: new key with other password can not decrypt",
    async fn() {
        const service = new UserKeyService();
        const password = "password";
        const passwordOther = "passwor";

        const key = await service.createKey(password);
        const keyWithAnotherSalt = await service.keyFromSaltedPassword(
            passwordOther,
            key.salt,
        );

        const toEncrypt = "some data";

        const encryptedData = await service.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );

        assertRejects(() => service.decrypt(keyWithAnotherSalt, encryptedData));
    },
});

Deno.test({
    name: "UserKey: encrypts and decrypts with same password and salt",
    async fn() {
        const service = new UserKeyService();
        const password = "password";

        const key = await service.createKey(password);
        const keyWithAnotherSalt = await service.keyFromSaltedPassword(
            password,
            key.salt,
        );

        const toEncrypt = "some data";

        const encryptedData = await service.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );
        const decryptedData = await service.decrypt(keyWithAnotherSalt, encryptedData);

        assertEquals(toEncrypt, new TextDecoder().decode(decryptedData));
    },
});

Deno.test({
    name: "UserKey: encrypts and decrypts with JSON export and import",
    async fn() {
        const service = new UserKeyService();
        const password = "password";

        const key = await service.createKey(password);
        const keyWithAnotherSalt = await service.fromJSON(await service.toJSON(key));

        const toEncrypt = "some data";

        const encryptedData = await service.encrypt(
            key,
            new TextEncoder().encode(toEncrypt),
        );
        const decryptedData = await service.decrypt(keyWithAnotherSalt, encryptedData);

        assertEquals(toEncrypt, new TextDecoder().decode(decryptedData));
    },
});
