import { EventPath } from "../workspace/events/event-path.ts";
import type { Event, EventData } from "../workspace/events/types.ts";

export function separateEventsByPath<T extends EventData>(
    events: Event<T>[],
): PathSaparatedEvents<T> {
    const sortedEvents = events.sort((a, b) =>
        a.date.getTime() - b.date.getTime()
    );

    const layeredEvents = splitEventsByLayers(sortedEvents);

    return workThroughEvents(layeredEvents);
}

function splitEventsByLayers<T extends EventData>(
    events: Event<T>[],
) {
    const eventPathMap = new Map<string, Event<T>[]>();
    events.forEach((event) => {
        const path = EventPath.normalize(event.path);

        const currentEvents = eventPathMap.get(path) ?? [];
        currentEvents.push(event);
        eventPathMap.set(path, currentEvents);
    });

    return eventPathMap;
}

function workThroughEvents<T extends EventData>(
    layeredEvents: Map<string, Event<T>[]>,
) {
    const result: PathSaparatedEvents<T> = [];

    layeredEvents.forEach((events, path) => {
        const data = events.reduce((acc, event) => {
            return { ...acc, ...event.data };
        }, {} as T);

        result.push({ path, data, events });
    });

    return result;
}

export type PathSaparatedEvents<T extends EventData> = {
    path: string;
    data: T;
    events: Event<T>[];
}[];
