import { Operation, HasId } from "../types";
import User from "../resources/user";
import KnexProcessor from "./knex-processor";
export default class UserProcessor<T extends User> extends KnexProcessor<T> {
    static resourceClass: typeof User;
    identify(op: Operation): Promise<HasId[] | HasId>;
    protected generateId(): Promise<any>;
    protected encryptPassword(op: Operation): Promise<any>;
    add(op: Operation): Promise<HasId>;
    get(op: Operation): Promise<HasId[] | HasId>;
}
