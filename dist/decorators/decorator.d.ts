import OperationProcessor from "../processors/operation-processor";
import { OperationDecorator } from "../types";
export declare function getArgument<T>(argsList: any[], match: (arg: any) => boolean): T;
export default function decorateWith(decorator: OperationDecorator, ...decoratorArgs: any[]): (target: OperationProcessor<any> | Function, propertyKey?: string, descriptor?: TypedPropertyDescriptor<any>) => any;
