declare const promiseHashMap: (hash: Record<string, unknown>, callback: (key: string | number) => Promise<unknown>) => Promise<{}>;
export default promiseHashMap;
