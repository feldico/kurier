import Addon from "../addon";
import { AddonOptions, ApplicationInstanceInterface, ApplicationInterface, Operation, ResourceAttributes } from "../types";
import User from "../resources/user";
import JsonApiUserProcessor from "../processors/user-processor";
import JsonApiSessionProcessor from "../processors/session-processor";
export type UserManagementAddonOptions = AddonOptions & {
    userResource: typeof User;
    userProcessor?: typeof JsonApiUserProcessor;
    sessionProcessor?: typeof JsonApiSessionProcessor;
    userEncryptPasswordCallback?: (op: Operation) => Promise<ResourceAttributes>;
    userLoginCallback?: (op: Operation, userDataSource: ResourceAttributes) => Promise<boolean>;
    userGenerateIdCallback?: () => Promise<string>;
    userRolesProvider?: (this: ApplicationInstanceInterface, user: User) => Promise<string[]>;
    userPermissionsProvider?: (this: ApplicationInstanceInterface, user: User) => Promise<string[]>;
    usernameRequestParameter?: string;
    passwordRequestParameter?: string;
    jwtClaimForUserID?: string;
    includeTokenInIdentifyOpDataPayload?: boolean;
};
export default class UserManagementAddon extends Addon {
    readonly app: ApplicationInterface;
    readonly options: UserManagementAddonOptions;
    constructor(app: ApplicationInterface, options?: UserManagementAddonOptions);
    install(): Promise<void>;
    private createUserProcessor;
    private createSessionProcessor;
    private createSessionResource;
}
