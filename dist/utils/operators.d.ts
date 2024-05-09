export type OperatorName = 'eq' | 'ne' | 'lt' | 'gt' | 'le' | 'ge' | 'like' | 'ilike' | 'nlike' | 'in' | 'nin';
export declare const KnexOperators: {
    eq: string;
    ne: string;
    lt: string;
    gt: string;
    le: string;
    ge: string;
    like: string;
    ilike: string;
    nlike: string;
    in: string;
    nin: string;
};
export declare const FunctionalOperators: {
    [T in OperatorName]: (actual: any, expected: any) => boolean;
};
