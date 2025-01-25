export type EventData = Record<string | number | symbol, unknown>;

export type Event<T extends EventData> = {
    path: string; // data paths are inspired by firebase, so if we want to store a car inside a house we would do something like that: "house/{houseId}/car/{carId}" - "house/4/car/5"
    id: string; // uuid v4
    version: number;
    user: string; // user id - but we do not have an id for the user, so we need a mapping which is saved in the client.
    date: Date;
    device: string; // the user agent which was used to create the event
    data: T;
    workspace: string; // the workspace id
};

export type CreateEvent<T extends EventData> = Omit<
    Event<T>,
    "id" | "version" | "user" | "date" | "device" | "workspace"
>;

export type EncryptedEvent = {
    version: number;
    workspace: string; // the workspace id. You can see this as the first path parameter.
    hashedPath: Uint8Array[]; // hashed for privacy reasons - so we can identify events to one object, but we do not know what object is stored. Each part of the path is hashed individually.
    id: string; // uuid v4. You can see this as the last path parameter.
    event: Uint8Array;
    iv: Uint8Array;
};

export type DecryptedEventData<T extends EventData> = {
    path: string; // data paths are inspired by firebase, so if we want to store a car inside a house we would do something like that: "house/{houseId}/car/{carId}" - "house/4/car/5"
    user: string; // user id - but we do not have an id for the user, so we need a mapping which is saved in the client.
    date: number;
    device: string; // the user agent which was used to create the event
    data: T;
};
