import type { UserEventName } from "../../user/event-bus/user-event-bus.types.ts";
import type { UserMessage } from "../types.ts";

export interface MessageBusAdapter {
    subscribe(eventName: EventName, callback: EventCallback): void;
    unsubscribe(eventName: EventName, callback: EventCallback): void;
    publish(eventName: EventName, data: unknown): void;
}

export interface LokalAuthMessageBus {
    onUserCreated(callback: (userMessage: UserMessage) => Promise<void>): void;
    onUserUpdated(callback: (userMessage: UserMessage) => Promise<void>): void;
    onUserDeleted(callback: (userMessage: UserMessage) => Promise<void>): void;
    // onWorkspaceCreated(
    //     callback: (workspaceMessage: WorkspaceMessage) => Promise<void>,
    // ): void;
}

export type EventName = UserEventName;

export type EventCallback = (data: unknown) => Promise<void>;
