import { EventPath } from "../workspace/events/event-path.ts";
import type { Event, EventData } from "../workspace/events/types.ts";
import type { PathSaparatedEvents } from "./separate-events-by-path.ts";

export function nestEventsByPath<T extends EventData>(
    pathSaparatedEvents: PathSaparatedEvents<T>,
): PathNestedEvents<T> {
    const layeredEvents = new Map<number, PathNestedEvents<T>>();
    let maxLayer = 0;

    const result: PathNestedEvents<T> = [];
    const resultPosition = new Map<string, number[]>();

    pathSaparatedEvents.forEach((event) => {
        const eventParts = EventPath.split(event.path);
        const layer = eventParts.length;
        if (maxLayer < layer) {
            maxLayer = layer;
        }

        if (layer === 1) {
            resultPosition.set(event.path, [result.length]);
            result.push({
                path: event.path,
                pathPart: eventParts[0],
                data: event.data,
                children: [],
                events: event.events,
            });
        } else {
            const currentEvents = layeredEvents.get(layer) ?? [];
            currentEvents.push({
                path: event.path,
                pathPart: eventParts[layer - 1],
                data: event.data,
                children: [],
                events: event.events,
            });
            layeredEvents.set(layer, currentEvents);
        }
    });

    for (let layer = 1; layer < maxLayer + 1; layer++) {
        const events = layeredEvents.get(layer);

        events?.forEach((event) => {
            const parenPath = EventPath.parentPath(event.path);
            const parentEventPosition = resultPosition.get(parenPath);
            if (parentEventPosition === undefined) {
                return;
            }

            const parent = arrayByPosition(result, parentEventPosition);
            if (!parent) {
                throw new Error(
                    "This should never happen - all layer 1 events should be known.",
                );
            }
            resultPosition.set(event.path, [
                ...parentEventPosition,
                parent.children.length,
            ]);
            parent.children.push(event);
        });
    }

    return result;
}

export type PathNestedEvent<T extends EventData> = {
    path: string;
    pathPart: string;
    data: T;
    children: PathNestedEvent<T>[];
    events: Event<T>[];
};

export type PathNestedEvents<T extends EventData> = PathNestedEvent<T>[];

function arrayByPosition<T extends EventData>(
    array: PathNestedEvents<T>,
    indices: number[],
): PathNestedEvent<T> | undefined {
    let current = array[indices[0]];

    for (let i = 1; i < indices.length; i++) {
        if (!current) return undefined;
        current = current.children[indices[i]];
    }

    return current;
}
