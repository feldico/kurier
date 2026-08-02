"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArgument = getArgument;
exports.default = decorateWith;
// TODO: should this filter be decorator-based to prevent name constraints?
function isOperation(name) {
    return ["get", "add", "update", "remove"].includes(name);
}
function getArgument(argsList, match) {
    return argsList.find((arg) => arg && match(arg));
}
function decorateWith(decorator, ...decoratorArgs) {
    return (target, propertyKey, descriptor) => {
        if (propertyKey && descriptor) {
            // Behave as a method decorator. Only apply where requested.
            const originalFunction = descriptor.value;
            descriptor.value = decorator(originalFunction, ...decoratorArgs);
        }
        else {
            // Behave as a class decorator. Apply to all.
            const controller = target;
            const controllerMethods = Object.getOwnPropertyNames(controller.prototype)
                .filter(isOperation)
                .map((member) => ({
                methodName: member,
                descriptor: Object.getOwnPropertyDescriptor(controller.prototype, member),
            }));
            controllerMethods.forEach((controllerMethod) => {
                const originalFunction = controllerMethod.descriptor.value;
                Object.defineProperty(controller.prototype, controllerMethod.methodName, {
                    ...controllerMethod.descriptor,
                    value: decorator(originalFunction, ...decoratorArgs),
                });
            });
        }
    };
}
//# sourceMappingURL=decorator.js.map