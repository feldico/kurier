declare const unpick: <R extends {} = Record<string, unknown>, T = Record<string, unknown>>(object: R, list?: string[]) => T;
export default unpick;
