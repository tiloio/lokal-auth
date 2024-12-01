import type { CreateWorkspace } from "../../../user/service/service.user.types.ts";
import type { WorkspaceKeyCommand } from "../../key/workspace-key.command.ts";
import {
    CURRENT_WORKSPACE_VERSION,
    type Workspace,
} from "../../workspace.type.ts";

export class WorkspaceCreateCommand {
    constructor(
        private readonly keyCommand: WorkspaceKeyCommand,
    ) {}

    async createWorkspace(options: CreateWorkspace): Promise<Workspace> {
        return {
            id: crypto.randomUUID(),
            name: options.name,
            userPrivacyId: options.userPrivacyId,
            creationDate: new Date(),
            lastUpdateDate: new Date(),
            key: await this.keyCommand.createKey(),
            _version: CURRENT_WORKSPACE_VERSION,
        };
    }
}
