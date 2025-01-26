import type { Event, EventData } from "../../workspace/events/types.ts";
import { assertEquals } from "@std/assert/equals";
import { separateEventsByPath } from "../separate-events-by-path.ts";
import { nestEventsByPath } from "../nest-events-by-path.ts";

type TestData = {
    someString: string;
};

Deno.test(`nestEventsByPath - returns events sorted and nested by the path elements`, () => {
    const events: Event<TestData>[] = [
        createEvent("/path1", { someString: "1" }),
        createEvent("/path2", { someString: "2" }),
        createEvent("/path3", { someString: "3" }),
        createEvent("/path1/path1", { someString: "1/1" }),
        createEvent("/path1/path2", { someString: "1/2" }),
        createEvent("/path1/path3", { someString: "1/3" }),
        createEvent("/path1/path3/path1", { someString: "1/3/1" }),
        createEvent("/path2/path1", { someString: "2/1" }),
    ];

    const nestedEvents = nestEventsByPath(separateEventsByPath(events));

    assertEquals(nestedEvents, [
        {
            path: "path1",
            pathPart: "path1",
            data: events[0].data,
            events: [events[0]],
            children: [
                {
                    path: "path1/path1",
                    pathPart: "path1",
                    data: events[3].data,
                    events: [events[3]],
                    children: [],
                },
                {
                    path: "path1/path2",
                    pathPart: "path2",
                    data: events[4].data,
                    events: [events[4]],
                    children: [],
                },
                {
                    path: "path1/path3",
                    pathPart: "path3",
                    data: events[5].data,
                    events: [events[5]],
                    children: [{
                        path: "path1/path3/path1",
                        pathPart: "path1",
                        data: events[6].data,
                        events: [events[6]],
                        children: [],
                    }],
                },
            ],
        },
        {
            path: "path2",
            pathPart: "path2",
            data: events[1].data,
            events: [events[1]],
            children: [{
                path: "path2/path1",
                pathPart: "path1",
                data: events[7].data,
                events: [events[7]],
                children: [],
            }],
        },
        {
            path: "path3",
            pathPart: "path3",
            data: events[2].data,
            events: [events[2]],
            children: [],
        },
    ]);
});

function createEvent<T extends EventData>(
    path: string,
    data: T,
): Event<T> {
    return {
        data: data,
        id: Math.random() + "_id",
        version: 1,
        workspace: "some-workspace",
        path: path,
        user: "some-user",
        device: "some-device",
        date: new Date(0),
    };
}
