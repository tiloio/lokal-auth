import { UserKey } from "../../mod.ts";

export class User {
  constructor(
    public readonly attributes: UserAttributes,
    public readonly key: UserKey,
  ) {}

  static async login(id: string, password: string): Promise<User> {
    // where to get the salt?
    const salt = new Uint8Array(32);

    return new User({ id }, await UserKey.fromSaltedPassword(password, salt));
  }
}

export type UserAttributes = {
  id: string;
  name?: string;
  email?: string;
};

function hashId(id: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(id));
}
