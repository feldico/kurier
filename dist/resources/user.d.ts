import Resource from "../resource";
export default class User extends Resource {
    static get type(): string;
    static schema: {
        attributes: {};
        relationships: {};
    };
}
