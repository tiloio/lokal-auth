import { UserAttributesFromByteEncodedJSON } from "../attributes.user.ts";
import type { EncryptedUserAttributes } from "../attributes.user.types.ts";
import { CURRENT_USER_VERSION } from "../../user.types.ts";
import { assertEquals } from "@std/assert/equals";
import { WorkspaceKeyCommand } from "../../../workspace/key/workspace-key.command.ts";
import { assertRejects } from "@std/assert/rejects";

Deno.test("UserAttributeFromByteEncodedJSON: extracts user attributes", async () => {
    const attributes: EncryptedUserAttributes = {
        id: "some id",
        privacyId: "some privacy id",
        username: "some username",
        creationDate: new Date().getTime(),
        lastUpdateDate: new Date().getTime(),
        workspaces: [],
        _version: CURRENT_USER_VERSION,
    };

    const userAttributes = await UserAttributesFromByteEncodedJSON(
        new WorkspaceKeyCommand(),
        new TextEncoder().encode(JSON.stringify(attributes)),
    );

    assertEquals(userAttributes._version, attributes._version);
    assertEquals(userAttributes.id, attributes.id);
    assertEquals(userAttributes.privacyId, attributes.privacyId);
    assertEquals(userAttributes.username, attributes.username);
    assertEquals(
        userAttributes.creationDate,
        new Date(attributes.creationDate),
    );
    assertEquals(
        userAttributes.lastUpdateDate,
        new Date(attributes.lastUpdateDate),
    );
});

const attributes: EncryptedUserAttributes = {
    id: "some id",
    privacyId: "some privacy id",
    username: "some username",
    creationDate: new Date().getTime(),
    lastUpdateDate: new Date().getTime(),
    workspaces: [],
    _version: CURRENT_USER_VERSION,
};

await Promise.all(
    (Object.keys(attributes) as Array<keyof EncryptedUserAttributes>).map(
        async (key) => {
            await Deno.test(
                "UserAttributeFromByteEncodedJSON: fails if user attributes missing " +
                    key,
                async () => {
                    const failAttributes = Object.assign({}, attributes);
                    delete failAttributes[key];
                    const attributesUintArray = new TextEncoder().encode(
                        JSON.stringify(failAttributes),
                    );

                    await assertRejects(() =>
                        UserAttributesFromByteEncodedJSON(
                            new WorkspaceKeyCommand(),
                            attributesUintArray,
                        )
                    );
                },
            );
        },
    ),
);
