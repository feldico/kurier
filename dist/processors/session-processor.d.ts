import Session from "../resources/session";
import KnexProcessor from "./knex-processor";
import { Operation, HasId, ResourceAttributes } from "../types";
export default class SessionProcessor<T extends Session> extends KnexProcessor<T> {
    static resourceClass: typeof Session;
    protected login(op: Operation, userDataSource: ResourceAttributes): Promise<boolean>;
    add(op: Operation): Promise<HasId>;
}
