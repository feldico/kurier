import JsonApiError from "./error";
declare const _default: {
    UnhandledError: (detail?: string) => JsonApiError;
    AccessDenied: (detail?: string) => JsonApiError;
    Unauthorized: (detail?: string) => JsonApiError;
    RecordNotExists: (detail?: string) => JsonApiError;
    ResourceNotFound: (detail?: string) => JsonApiError;
    InvalidToken: (detail?: string) => JsonApiError;
    InvalidData: (detail?: string) => JsonApiError;
    BadRequest: (detail?: string) => JsonApiError;
};
export default _default;
