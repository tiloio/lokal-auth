import { assertEquals } from "@std/assert/equals";
import { encodeBase64 } from "jsr:@std/encoding/base64";
import { LocalStorageSaltAdapter } from "../local-storage-salt-adapter.ts";

Deno.test("LocalStorageSaltAdapter: loadSalt: loads salt from local storage", async () => {
    const adapter = new LocalStorageSaltAdapter();
    const id = "some id";

    const salt = new Uint8Array(54);
    sessionStorage.setItem(`lokal-auth-salt-${id}`, encodeBase64(salt));

    const loadedSalt = await adapter.loadSalt(id);

    assertEquals(loadedSalt, salt);
});

Deno.test("LocalStorageSaltAdapter: saveSalt: saves salt to local storage", async () => {
    const adapter = new LocalStorageSaltAdapter();
    const id = "some id";

    const salt = new Uint8Array(234);
    await adapter.saveSalt(id, salt);

    const savedSalt = sessionStorage.getItem(`lokal-auth-salt-${id}`);

    assertEquals(savedSalt, encodeBase64(salt));
});