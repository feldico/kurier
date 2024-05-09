import { ApplicationHooks, ApplicationInstanceInterface } from "../types";
export declare const runHookFunctions: (appInstance: ApplicationInstanceInterface, hookType: keyof ApplicationHooks, parameters?: Record<string, unknown>) => Promise<void>;
