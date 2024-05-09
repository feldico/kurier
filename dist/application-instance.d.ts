import { Knex } from "knex";
import Resource from "./resource";
import OperationProcessor from "./processors/operation-processor";
import { NoOpTransaction, ApplicationInterface, VendorRequest } from "./types";
import User from "./resources/user";
export default class ApplicationInstance {
    app: ApplicationInterface;
    user: User | undefined;
    transaction: Knex.Transaction | NoOpTransaction;
    constructor(app: ApplicationInterface);
    processorFor(resourceType: string): Promise<OperationProcessor<Resource> | undefined>;
    getUserFromToken(token: string, request?: VendorRequest): Promise<User | undefined>;
}
