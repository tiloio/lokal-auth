import type { Encrypted } from "../key/types.ts";
import type { UserKey } from "./user-key.ts";

export class UserAttributes {
  constructor(
    public readonly id: string,
    public readonly username: string,
  ) {}

  static async fromEncryptedJSON(
    userKey: UserKey,
    encrypted: Encrypted,
  ): Promise<UserAttributes> {
    const attributesUintArray = await userKey.decrypt(encrypted);
    const attributes = JSON.parse(
      new TextDecoder().decode(attributesUintArray),
    );

    return new UserAttributes(
      attributes.id,
      attributes.username,
    );
  }

  toEncryptedJson(userKey: UserKey): Promise<Encrypted> {
    const attributes = {
      id: this.id,
      username: this.username,
    };

    return userKey.encrypt(
      new TextEncoder().encode(JSON.stringify(attributes)),
    );
  }
}
