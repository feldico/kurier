import Resource from "../resource";
import User from "./user";
export default class Session extends Resource {
    static get type(): string;
    static schema: {
        attributes: {
            token: StringConstructor;
            username: StringConstructor;
            password: import("..").ApplicationAttributeTypeFactory;
        };
        relationships: {
            user: {
                type: () => typeof User;
                belongsTo: boolean;
            };
        };
    };
}
