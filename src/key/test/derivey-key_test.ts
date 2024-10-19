import { DerivedKey } from "../dervied-key.ts";
import { assertEquals } from "@std/assert/equals";
import { assertRejects } from "@std/assert";
import { createIV } from "../key-utils.ts";

Deno.test({
  name: "DerivedKey: new key with random salt can not decrypt",
  async fn() {
    const password = "password";

    const key = await DerivedKey.new(password);
    const keyWithAnotherSalt = await DerivedKey.new(password);

    const toEncrypt = "some data";

    const encryptedData = await key.encrypt(
      new TextEncoder().encode(toEncrypt)
    );

    assertRejects(() => keyWithAnotherSalt.decrypt(encryptedData));
  },
});

Deno.test({
  name: "DerivedKey: same key with other iv can not decrypt",
  async fn() {
    const password = "password";

    const key = await DerivedKey.new(password);

    const toEncrypt = "some data";

    const { encryptedData } = await key.encrypt(
      new TextEncoder().encode(toEncrypt)
    );

    assertRejects(() => key.decrypt({ iv: createIV(), encryptedData }));
  },
});

Deno.test({
  name: "DerivedKey: new key with other password can not decrypt",
  async fn() {
    const password = "password";
    const passwordOther = "passwor";

    const key = await DerivedKey.new(password);
    const keyWithAnotherSalt = await DerivedKey.fromSaltedPassword(
      passwordOther,
      key.salt
    );

    const toEncrypt = "some data";

    const encryptedData = await key.encrypt(
      new TextEncoder().encode(toEncrypt)
    );

    assertRejects(() => keyWithAnotherSalt.decrypt(encryptedData));
  },
});

Deno.test({
  name: "DerivedKey: encrypts and decrypts with same password and salt",
  async fn() {
    const password = "password";

    const key = await DerivedKey.new(password);
    const keyWithAnotherSalt = await DerivedKey.fromSaltedPassword(
      password,
      key.salt
    );

    const toEncrypt = "some data";

    const encryptedData = await key.encrypt(
      new TextEncoder().encode(toEncrypt)
    );
    const decryptedData = await keyWithAnotherSalt.decrypt(encryptedData);

    assertEquals(toEncrypt, new TextDecoder().decode(decryptedData));
  },
});

Deno.test({
  name: "DerivedKey: encrypts and decrypts with jwk export and import",
  async fn() {
    const password = "password";

    const key = await DerivedKey.new(password);
    const keyWithAnotherSalt = await DerivedKey.fromJWK(await key.toJWK());

    const toEncrypt = "some data";

    const encryptedData = await key.encrypt(
      new TextEncoder().encode(toEncrypt)
    );
    const decryptedData = await keyWithAnotherSalt.decrypt(encryptedData);

    assertEquals(toEncrypt, new TextDecoder().decode(decryptedData));
  },
});
