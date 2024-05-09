import { IAddon, AddonOptions, ApplicationInterface } from "./types";
export default class Addon implements IAddon {
    readonly app: ApplicationInterface;
    readonly options?: AddonOptions | undefined;
    constructor(app: ApplicationInterface, options?: AddonOptions | undefined);
    install(): Promise<void>;
}
