import { encodeBase64 } from "jsr:@std/encoding@1.0.5/base64";
import type { UserStoreAdapter } from "../store/adapters/user-store-adapter.types.ts";
import type { User } from "../user.types.ts";
import type { UserKeyCommand } from "../key/user-key.command.ts";
import { UserCreateCommand } from "../command/create/user-create.command.ts";
import type { WorkspaceKeyCommand } from "../../workspace/key/workspace-key.command.ts";
import { QueryUser } from "../query/user.ts";

export class UserService {
    private readonly queryUser: QueryUser;
    private readonly commandUser: UserCreateCommand;

    constructor(
        private readonly userStore: UserStoreAdapter,
        private readonly userKeyCommand: UserKeyCommand,
        private readonly workspaceKeyCommand: WorkspaceKeyCommand,
    ) {
        this.queryUser = new QueryUser(
            this.userStore,
            this.userKeyCommand,
            this.workspaceKeyCommand,
        );
        this.commandUser = new UserCreateCommand(
            this.userStore,
            this.userKeyCommand,
            this.workspaceKeyCommand,
        );
    }

    async login(
        username: string,
        password: string,
    ): Promise<User> {
        const hashedId = await createNonPrivateId(username);
        const loadedUser = await this.queryUser.getUserByPassword(
            hashedId,
            password,
        );

        if (loadedUser) {
            return loadedUser;
        }

        return await this.commandUser.createUser({
            username,
            password,
            hashedId,
        });
    }
}

async function createNonPrivateId(username: string): Promise<string> {
    const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(username),
    );
    return encodeBase64(hash);
}
