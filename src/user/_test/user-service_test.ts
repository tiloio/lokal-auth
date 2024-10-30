import { assertEquals } from "@std/assert/equals";
import { UserService } from "../user-service.ts";
import { createSalt } from "../../key/key-utils.ts";
import { UserKey } from "../user-key.ts";
import { assertRejects } from "@std/assert/rejects";
import { LocalStorageAdapter } from "../store/adapters/local-storage-adapter.ts";

Deno.test("UserService: login new user with user username and password", async () => {
  localStorage.clear();
  const adapter = new LocalStorageAdapter();
  const userService = new UserService(adapter);

  const username = "some username";
  const epxectedId = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";

  const user = await userService.login(username, "some password");

  assertEquals(user.attributes.id, epxectedId);
  assertEquals(user.key.options.type, "user");
});

Deno.test("UserService: login old user with user username and password", async () => {
  localStorage.clear();
  const adapter = new LocalStorageAdapter();
  const userService = new UserService(adapter);

  const username = "some username";
  const hashedUsername = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";
  const salt = createSalt();

  const password = "some password";
  const someData = "some data";
  const userKey = await UserKey.fromSaltedPassword(password, salt);

  await adapter.saveUser({
    id: hashedUsername,
    encryptedAttributes: await userKey.encrypt(
      new TextEncoder().encode(
        JSON.stringify({ username, id: hashedUsername }),
      ),
    ),
    salt,
    workspaces: [],
  });

  const user = await userService.login(username, password);

  const encryptedData = await userKey.encrypt(
    new TextEncoder().encode(someData),
  );
  assertEquals(
    await user.key.decrypt(encryptedData),
    new TextEncoder().encode(someData),
  );
});

Deno.test("UserService: login fails with wrong salt", async () => {
  localStorage.clear();
  const adapter = new LocalStorageAdapter();
  const userService = new UserService(adapter);

  const username = "some username";
  const hashedUsername = "ULoTKhd1B1/5xCBUWyaF+9BoU9dfPCYMFdK2VTUAtGE=";
  const password = "some password";
  const salt = createSalt();
  const user = await userService.login(username, password);
  await adapter.saveUser({
    id: hashedUsername,
    encryptedAttributes: await user.key.encrypt(
      new Uint8Array([1, 3, 56, 32]),
    ),
    salt,
    workspaces: [],
  });

  await assertRejects(() => userService.login(username, password));
});

Deno.test("UserService: login fails with wrong password", async () => {
  localStorage.clear();
  const adapter = new LocalStorageAdapter();
  const userService = new UserService(adapter);

  const username = "some username";
  const password = "some password";

  await userService.login(username, password);

  await assertRejects(() => userService.login(username, password + "a"));
});
