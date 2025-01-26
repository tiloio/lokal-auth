export const EVENT_SEPERATOR = "/" as const;

export class EventPath {
    static async hash(path: string) {
        const encoder = new TextEncoder();

        const splittedPath = path.split(EVENT_SEPERATOR);

        const arrayBuffers = await Promise.all(
            splittedPath.map((part) =>
                globalThis.crypto.subtle.digest("SHA-1", encoder.encode(part))
            ),
        );

        return arrayBuffers.map((part) => new Uint8Array(part));
    }
    static split(path: string) {
        const splittedPath = path.split(EVENT_SEPERATOR);
        if (path[0] === EVENT_SEPERATOR) {
            splittedPath.shift();
        }
        return splittedPath;
    }
    static parentPath(path: string) {
        const splittedPath = EventPath.split(path);
        splittedPath.pop();
        return splittedPath.join(EVENT_SEPERATOR);
    }
    static isPath(pathA: string, pathB: string) {
        return EventPath.normalize(pathA) === EventPath.normalize(pathB);
    }
    static normalize(path: string) {
        const pathSeparatorNormalized = normalizePathSeperator(path.trim());
        return pathSeparatorNormalized.toLowerCase();
    }
}

function normalizePathSeperator(path: string) {
    if (path[0] === EVENT_SEPERATOR) {
        return path.substring(1);
    }

    return path;
}
