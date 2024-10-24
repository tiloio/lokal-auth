import type { UserKey } from "../mod.ts";

export class User {
  constructor(public readonly id: string, public readonly key: UserKey) {}
}
