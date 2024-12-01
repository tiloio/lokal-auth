import { FakeTime } from "jsr:@std/testing/time";
import { WorkspaceCreateCommand } from "../../../../workspace/command/create/workspace-create.command.ts";
import { WorkspaceKeyCommand } from "../../../../workspace/key/workspace-key.command.ts";
import { UserCreateCommand } from "../../create/user-create.command.ts";
import { UserKeyCommand } from "../../../key/user-key.command.ts";
import { InMemoryUserStoreAdapter } from "../../../store/adapters/in-memory-user-store-adapter.ts";
import { UserUpsertWorkspaceCommand } from "../user-upsert-workspace.command.ts";
import { QueryUser } from "../../../query/user.ts";
import { assertExists } from "@std/assert/exists";
import { assertEquals } from "@std/assert/equals";
import { assertLessOrEqual } from "@std/assert/less-or-equal";
import { assertGreaterOrEqual } from "@std/assert/greater-or-equal";

function newUserUpsertWorkspaceCommand() {
    const adapter = new InMemoryUserStoreAdapter();
    const key = {
        user: new UserKeyCommand(),
        workspace: new WorkspaceKeyCommand(),
    };
    const commands = {
        userCreate: new UserCreateCommand(adapter, key.user, key.workspace),
        workspaceCreate: new WorkspaceCreateCommand(key.workspace),
    };

    const queries = {
        user: new QueryUser(adapter, key.user, key.workspace),
    };
    const command = new UserUpsertWorkspaceCommand(
        adapter,
        key.user,
        key.workspace,
    );

    return { command, adapter, key, commands, queries };
}

Deno.test({
    name:
        "UserUpsertWorkspaceCommand: userUpsertWorkspaceCommand.upsertWorkspace() creates a workspace which is saved encrypted in the user and updates user dates",
    async fn() {
        using time = new FakeTime();
        const { command, commands, queries } = newUserUpsertWorkspaceCommand();

        const beforeWorkspace = new Date();
        time.tick(10);
        const workspace = await commands.workspaceCreate.createWorkspace({
            name: "some workspace",
            userPrivacyId: "privacyid",
        });
        time.tick(10);

        const password = "some password";

        const workspaceUser = await commands.userCreate.createUser({
            hashedId: "some id",
            password,
            username: "some username",
        });
        time.tick(10);

        const before = new Date();
        time.tick(10);
        await command.upsertWorkspace(workspaceUser, workspace);
        time.tick(10);

        const user = await queries.user.getUserByPassword(
            workspaceUser.id,
            password,
        );

        assertExists(user);

        const userWorkspace = user.workspaces[0];
        assertExists(userWorkspace);

        assertLessOrEqual(
            user.creationDate.getTime(),
            before.getTime(),
        );
        assertLessOrEqual(
            user.lastUpdateDate.getTime(),
            new Date().getTime(),
        );
        assertGreaterOrEqual(
            user.lastUpdateDate.getTime(),
            before.getTime(),
        );

        assertEquals(userWorkspace.id.length, 36);
        assertEquals(userWorkspace.name, workspace.name);
        assertEquals(userWorkspace.userPrivacyId, workspace.userPrivacyId);
        assertLessOrEqual(
            userWorkspace.creationDate.getTime(),
            new Date().getTime(),
        );
        assertGreaterOrEqual(
            userWorkspace.creationDate.getTime(),
            beforeWorkspace.getTime(),
        );

        assertLessOrEqual(
            userWorkspace.lastUpdateDate.getTime(),
            new Date().getTime(),
        );
        assertGreaterOrEqual(
            userWorkspace.lastUpdateDate.getTime(),
            beforeWorkspace.getTime(),
        );
    },
});
