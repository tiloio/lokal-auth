import { assertEquals, assertNotEquals } from "@std/assert";
import { createIV, createSalt } from "../key-utils.ts";

Deno.test({
  name: "createIV has default length of 16",
  fn() {
    const iv = createIV();
    assertEquals(iv.length, 16);
  },
});

Deno.test({
  name: "createIV can have a custom length",
  fn() {
    const expectedLength = 12;
    const iv = createIV(expectedLength);
    assertEquals(iv.length, expectedLength);
  },
});

Deno.test({
  name: "createIV creates a random IV",
  fn() {
    assertNotEquals(createIV(), createIV());
  },
});

Deno.test({
  name: "createSalt has default length of 32",
  fn() {
    const salt = createSalt();
    assertEquals(salt.length, 32);
  },
});

Deno.test({
  name: "createSalt can have a custom length",
  fn() {
    const expectedLength = 50;
    const salt = createSalt(expectedLength);
    assertEquals(salt.length, expectedLength);
  },
});

Deno.test({
  name: "createSalt creates a random salt",
  fn() {
    assertNotEquals(createSalt(), createSalt());
  },
});
