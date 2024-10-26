import { newWorkspace } from "./test_utils.ts";
import { assertEquals } from "jsr:@std/assert/equals";

Deno.bench({
  name: "Workspace: read event",
  fn: async (b) => {
    const { workspace } = await newWorkspace();

    const newEvent = {
      path: "test/test",
      data: {
        hello: "world",
        num: 1,
        text:
          "some bigger and longer text you need to test the encoding and the speed of the encryption lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
        bigNumber: 239324234234,
        bigArray: [
          "lorem",
          "ipsum",
          "dolor",
          "sit",
          "amet",
          "lorem",
          "ipsum2",
          "dolor2",
          "sit2",
          "amet2",
          "lorem3",
          "ipsum4",
          "tagglist",
          "home",
          "garage",
          "ponyhof",
        ],
        bool: false,
        array: [1, 2, 3],
        object: {
          a: 1,
          b: 2,
          c: 3,
        },
      },
    };

    const event = await workspace.saveEvent(newEvent);

    b.start();

    const event2 = await workspace.loadEvent(event.id);

    b.end();

    assertEquals(event2.id, event.id);
  },
});

Deno.bench({
  name: "Workspace: save event",
  fn: async (b) => {
    const { workspace } = await newWorkspace();

    const newEvent = {
      path: "test/test",
      data: {
        hello: "world",
        num: 1,
        text:
          "some bigger and longer text you need to test the encoding and the speed of the encryption lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
        bigNumber: 239324234234,
        bigArray: [
          "lorem",
          "ipsum",
          "dolor",
          "sit",
          "amet",
          "lorem",
          "ipsum2",
          "dolor2",
          "sit2",
          "amet2",
          "lorem3",
          "ipsum4",
          "tagglist",
          "home",
          "garage",
          "ponyhof",
        ],
        bool: false,
        array: [1, 2, 3],
        object: {
          a: 1,
          b: 2,
          c: 3,
        },
      },
    };

    b.start();
    await workspace.saveEvent(newEvent);
    b.end();
  },
});

Deno.bench({
  name: "Workspace: save biggest event",
  fn: async (b) => {
    const { workspace } = await newWorkspace();

    const newEvent = {
      path: "test/test",
      data: {
        hello: "world",
        num: 1,
        text:
          "some bigger and longer text you need to test the encoding and the speed of the encryption lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum some bigger and longer text you need to test the encoding and the speed of the encryption lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborumsome bigger and longer text you need to test the encoding and the speed of the encryption lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborumsome bigger and longer text you need to test the encoding and the speed of the encryption lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborumsome bigger and longer text you need to test the encoding and the speed of the encryption lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
        bigNumber: 239324234234,
        nestedObject: {
          a: 132333,
          b: 233333,
          c: 23333333,
          debugger: true,
          debugger2: true,
          debugger3: true,
          text:
            "some bigger and longer text you need to test the encoding and the speed of the encryption lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
          objected: {
            array: [1, 2, 3],
            object: {
              a: 1,
              b: 2,
              c: 3,
              array: [
                "some bigger and longer text you need to test the encoding and the speed of the encryption lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
                "some bigger and longer text you need to test the encoding and the speed of the encryption lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
                "lkjdsflksdjf lksdjf lewsikjflijsf lisjefl kejs lfkdjflkdjslfkjsdlkfjsdlkewjflshvlekfhleskfjelsdkfjeslkdnfj jkkjfk slk sj4rthgofaiwhesrbl srjf asgilubag4z38waouhr 9foaz47902oih3waenbgrlisi3hpt89ga4ueilkys",
              ],
            },
          },
        },
        bigArray: [
          "lorem",
          "ipsum",
          "dolor",
          "sit",
          "amet",
          "lorem",
          "ipsum2",
          "dolor2",
          "sit2",
          "amet2",
          "lorem3",
          "ipsum4",
          "tagglist",
          "home",
          "garage",
          "ponyhof",
        ],
        bool: false,
        array: [1, 2, 3],
        object: {
          a: 1,
          b: 2,
          c: 3,
        },
      },
    };

    b.start();
    await workspace.saveEvent(newEvent);
    b.end();
  },
});

Deno.bench({
  name: "Workspace: create a new one",
  fn: async () => {
    await newWorkspace();
  },
});
