import type { Event, EventData } from "../../workspace/events/types.ts";
import { itemPipe } from "../item-pipe.ts";
import { assertEquals } from "@std/assert/equals";

type TestData = {
    someString: string;
    someNumber: number;
    someBoolean: boolean;
    someStringArray: string[];
    someDate: Date;
    someUint8Array: Uint8Array;
};

Deno.test(`itemPipe - returns an event with only the newest string data property of all events`, () => {
    const events: Event<TestData>[] = [
        createEvent("/path", { someString: "someString1" }, new Date(1)),
        createEvent("/path", { someString: "someString3" }, new Date(3)),
        createEvent("/path", { someString: "someString2" }, new Date(2)),
    ];

    const pipedEvent = itemPipe(events);

    assertEquals(pipedEvent[0].data.someString, "someString3");
});

Deno.test(`itemPipe - returns an event which is merged with the newest data properties of all events`, () => {
    const expectedData = {
        someString: "someString2",
        someNumber: 111,
    };

    const events: Event<Partial<TestData>>[] = [
        createDataEvent("/path", { someString: "someString1" }, new Date(1)),
        createDataEvent("/path", { someString: "someString2" }, new Date(3)),
        createDataEvent("/path", { someNumber: 111 }, new Date(2)),
    ];

    const pipedEvent = itemPipe(events);

    assertEquals(pipedEvent[0].data, expectedData);
});

Deno.test(`itemPipe - returns an event with only the newest data properties of all events`, () => {
    const expectedData = {
        someString: "3",
        someNumber: Math.random(),
        someBoolean: false,
        someStringArray: [
            "3someString1",
            "3someString2",
            "3someString3",
        ],
        someDate: new Date(333),
        someUint8Array: new Uint8Array(30),
    };

    const events: Event<TestData>[] = [
        createEvent("path", {
            someString: "1",
            someNumber: Math.random(),
            someBoolean: true,
            someStringArray: [
                "1someString1",
                "1someString2",
                "1someString3",
            ],
            someDate: new Date(1),
            someUint8Array: new Uint8Array(10),
        }, new Date(1)),
        createEvent("path", {
            someString: "2",
            someNumber: Math.random(),
            someBoolean: true,
            someStringArray: [
                "2someString1",
                "2someString2",
                "2someString3",
            ],
            someDate: new Date(2),
            someUint8Array: new Uint8Array(20),
        }, new Date(2)),
        createEvent("path", expectedData, new Date(3)),
    ].sort((a, b) => a.data.someNumber - b.data.someNumber);

    const pipedEvent = itemPipe(events);

    assertEquals(pipedEvent[0].data, expectedData);
});

Deno.test(`itemPipe - combines children elements like "/item" & "/item/1" & "/item/2"`, () => {
    const expectedResult = [
        {
            path: "item",
            data: { someString: "someString2"},
        },
        {
            path: "item/1",
            data: { someString: "someString2Item1" },
        },
        {
            path: "item/2",
            data: { someString: "someString1Item2" },
        },
    ];

    const events: Event<Partial<TestData>>[] = [
        createDataEvent(
            "/item",
            { someString: "someString1" },
            new Date(1),
        ),
        createDataEvent(
            "/item/2",
            { someString: "someString1Item2" },
            new Date(3),
        ),
        createDataEvent(
            "/item",
            { someString: "someString2" },
            new Date(3),
        ),
        createDataEvent(
            "/item/1",
            { someString: "someString2Item1" },
            new Date(3),
        ),
        createDataEvent(
            "/item/1",
            { someString: "someString1Item1" },
            new Date(2),
        ),
    ];

    const pipedEvent = itemPipe(events);

    assertEquals(pipedEvent, expectedResult);
});

function createEvent(
    path: string,
    data: Partial<TestData>,
    date = new Date(),
): Event<TestData> {
    return {
        data: {
            someString: "someString" + Math.random(),
            someNumber: Math.random(),
            someBoolean: false,
            someStringArray: [
                "someString1 " + Math.random(),
                "someString2 " + Math.random(),
                "someString3 " + Math.random(),
            ],
            someDate: new Date(),
            someUint8Array: new Uint8Array(10),
            ...data,
        },
        id: "some-id",
        version: 1,
        workspace: "some-workspace",
        path: path,
        user: "some-user",
        device: "some-device",
        date: date,
    };
}

function createDataEvent<T extends EventData>(
    path: string,
    data: T,
    date = new Date(),
): Event<T> {
    return {
        data: data,
        id: "some-id",
        version: 1,
        workspace: "some-workspace",
        path: path,
        user: "some-user",
        device: "some-device",
        date: date,
    };
}
