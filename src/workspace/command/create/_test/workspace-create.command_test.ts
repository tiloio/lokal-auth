import { assertLessOrEqual } from "@std/assert/less-or-equal";
import { assertGreaterOrEqual } from "@std/assert/greater-or-equal";
import { assertEquals } from "@std/assert/equals";
import { WorkspaceKeyCommand } from "../../../key/workspace-key.command.ts";
import { WorkspaceCreateCommand } from "../workspace-create.command.ts";

Deno.test({
    name:
        "WorkspaceService: workspaceService.createWorkspace() sets creation and last update date",
    async fn() {
        const keyService = new WorkspaceKeyCommand();
        const command = new WorkspaceCreateCommand(keyService);
        const options = {
            name: "workspace name",
            userPrivacyId: "user id",
        };

        const before = new Date();
        const workspace = await command.createWorkspace(options);

        const expectedData = "some data";
        const enrcryptedData = await keyService.encrypt(
            workspace.key,
            new TextEncoder().encode(expectedData),
        );

        assertEquals(workspace.key.options.type, "workspace");
        assertEquals(
            new TextDecoder().decode(
                await keyService.decrypt(
                    workspace.key,
                    enrcryptedData,
                ),
            ),
            expectedData,
        );

        assertEquals(workspace.id.length, 36);
        assertEquals(workspace.name, options.name);
        assertEquals(workspace.userPrivacyId, options.userPrivacyId);
        assertLessOrEqual(
            workspace.creationDate.getTime(),
            new Date().getTime(),
        );
        assertGreaterOrEqual(
            workspace.creationDate.getTime(),
            before.getTime(),
        );

        assertLessOrEqual(
            workspace.lastUpdateDate.getTime(),
            new Date().getTime(),
        );
        assertGreaterOrEqual(
            workspace.lastUpdateDate.getTime(),
            before.getTime(),
        );
    },
});
