declare const pick: <R extends object = Record<string, unknown>, T = Record<string, unknown>>(object: R, list?: string[]) => T;
export default pick;
