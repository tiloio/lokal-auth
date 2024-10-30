import { assertEquals } from "@std/assert/equals";
import { LocalStorageAdapter } from "../local-storage-adapter.ts";
import type { StoredUser, StoredWorkspace } from "../../../user.types.ts";
import type { WorkspaceAttributes } from "../../../../workspace/workspace.ts";
import type { Encrypted } from "../../../../key/types.ts";
import { assertRejects } from "@std/assert/rejects";

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
    '{"id":"some id","encryptedAttributes":{"data":"DXgE","iv":"DwQF"},"salt":"AWID","workspaces":[{"id":"some id","encryptedAttributes":{"data":"AXgE","iv":"AQQF"}}]}',
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
    workspaces: [
      {
        id: "some id",
        encryptedAttributes: {
          data: new Uint8Array([1, 120, 4]),
          iv: new Uint8Array([1, 4, 5]),
        },
      },
    ],
  };

  localStorage.setItem(
    `lokal-auth-user-${expectedUser.id}`,
    '{"id":"some id","encryptedAttributes":{"data":"DXgE","iv":"DwQF"},"salt":"AWID","workspaces":[{"id":"some id","encryptedAttributes":{"data":"AXgE","iv":"AQQF"}}]}',
  );
  const resultUser = await adapter.loadUser(expectedUser.id);

  assertEquals(resultUser, expectedUser);
});

Deno.test("localStorageAdapter loadUser: fails if user or workspace object is missing any property", () => {
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
    workspaces: [
      {
        attributes: {
          id: "some id",
          name: "some name",
          userId: "some id",
        },
        encryptedKey: {
          data: "some data",
          iv: "some iv",
        },
      },
    ],
  };

  // Test for missing top-level properties
  const topLevelProperties: (keyof StoredUser)[] = [
    "id",
    "encryptedAttributes",
    "salt",
    "workspaces",
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

  // Test for missing workspace sub-properties
  const workspaceProperties: (keyof StoredWorkspace)[] = [
    "id",
    "encryptedAttributes",
  ];
  for (const prop of workspaceProperties) {
    const wrongUser = JSON.parse(JSON.stringify(baseUser));
    delete wrongUser.workspaces[0][prop];

    localStorage.setItem(
      `lokal-auth-user-${userId}`,
      JSON.stringify(wrongUser),
    );
    assertRejects(() => adapter.loadUser(userId));
  }

  // Test for missing attributes sub-properties
  const attributeProperties: (keyof WorkspaceAttributes)[] = [
    "id",
    "name",
    "userId",
  ];
  for (const prop of attributeProperties) {
    const wrongUser = JSON.parse(JSON.stringify(baseUser));
    delete wrongUser.workspaces[0].attributes[prop];

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
    delete wrongUser.workspaces[0].encryptedKey[prop];

    localStorage.setItem(
      `lokal-auth-user-${userId}`,
      JSON.stringify(wrongUser),
    );

    assertRejects(() => adapter.loadUser(userId));
  }
});
