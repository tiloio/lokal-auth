import { UserKey } from "../user-key.ts";
import { assertEquals } from "@std/assert/equals";
import { assertRejects } from "@std/assert";
import { createIV } from "../../key/key-utils.ts";

Deno.test({
  name: "UserKey: new key with random salt can not decrypt",
  async fn() {
    const password = "password";

    const key = await UserKey.new(password);
    const keyWithAnotherSalt = await UserKey.new(password);

    const toEncrypt = "some data";

    const encryptedData = await key.encrypt(
      new TextEncoder().encode(toEncrypt),
    );

    assertRejects(() => keyWithAnotherSalt.decrypt(encryptedData));
  },
});

Deno.test({
  name: "UserKey: same key with other iv can not decrypt",
  async fn() {
    const password = "password";

    const key = await UserKey.new(password);

    const toEncrypt = "some data";

    const encrypted = await key.encrypt(new TextEncoder().encode(toEncrypt));

    assertRejects(() => key.decrypt({ iv: createIV(), data: encrypted.data }));
  },
});

Deno.test({
  name: "UserKey: new key with other password can not decrypt",
  async fn() {
    const password = "password";
    const passwordOther = "passwor";

    const key = await UserKey.new(password);
    const keyWithAnotherSalt = await UserKey.fromSaltedPassword(
      passwordOther,
      key.salt,
    );

    const toEncrypt = "some data";

    const encryptedData = await key.encrypt(
      new TextEncoder().encode(toEncrypt),
    );

    assertRejects(() => keyWithAnotherSalt.decrypt(encryptedData));
  },
});

Deno.test({
  name: "UserKey: encrypts and decrypts with same password and salt",
  async fn() {
    const password = "password";

    const key = await UserKey.new(password);
    const keyWithAnotherSalt = await UserKey.fromSaltedPassword(
      password,
      key.salt,
    );

    const toEncrypt = "some data";

    const encryptedData = await key.encrypt(
      new TextEncoder().encode(toEncrypt),
    );
    const decryptedData = await keyWithAnotherSalt.decrypt(encryptedData);

    assertEquals(toEncrypt, new TextDecoder().decode(decryptedData));
  },
});

Deno.test({
  name: "UserKey: encrypts and decrypts with JSON export and import",
  async fn() {
    const password = "password";

    const key = await UserKey.new(password);
    const keyWithAnotherSalt = await UserKey.fromJSON(await key.toJSON());

    const toEncrypt = "some data";

    const encryptedData = await key.encrypt(
      new TextEncoder().encode(toEncrypt),
    );
    const decryptedData = await keyWithAnotherSalt.decrypt(encryptedData);

    assertEquals(toEncrypt, new TextDecoder().decode(decryptedData));
  },
});
