import type { UserKey } from "../../mod.ts";
import type { StoreAdapter } from "./store/adapters/store-adapter-types.ts";

export class User {
    constructor(
        public readonly attributes: UserAttributes,
        public readonly key: UserKey,
        public readonly store: StoreAdapter,
    ) {}
}

export type UserAttributes = {
    id: string;
    username: string;
    email?: string;
};
