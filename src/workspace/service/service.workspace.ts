import type { UserUpsertWorkspaceCommand } from "../../user/command/upsert-workspace/user-upsert-workspace.command.ts";
import type { User } from "../../user/user.types.ts";
import type { EventCreateCommand } from "../command/create-event/event-create.command.ts";
import type { WorkspaceCreateCommand } from "../command/create/workspace-create.command.ts";
import type { CreateEvent, Event } from "../events/types.ts";
import { ReadEventQuery } from "../query/read-event/read-event.query.ts";
import type { Workspace } from "../workspace.type.ts";

export class WorkspaceService {
    constructor(
        private readonly userUpsertWorkspaceCommand: UserUpsertWorkspaceCommand,
        private readonly createWorkspace: WorkspaceCreateCommand,
        private readonly eventCreateCommand: EventCreateCommand,
        private readonly readEventQuery: ReadEventQuery,    
    ) {}

    async newWorkspace(user: User, name: string): Promise<Workspace> {
        const workspace = await this.createWorkspace.createWorkspace({
            name,
            userPrivacyId: user.privacyId,
        });
        await this.userUpsertWorkspaceCommand.upsertWorkspace(
            user,
            workspace,
        );

        return workspace;
    }

    async createEvent<T>(
        workspace: Workspace,
        newEvent: CreateEvent<T>,
    ): Promise<Event<T>> {
        return await this.eventCreateCommand.createEvent(workspace, newEvent);
    }
    
    async listByPath<T>(workspace: Workspace, path: string): Promise<Event<T>[]> {
        return await this.readEventQuery.loadPathEvents(workspace, path);
    }   
}
