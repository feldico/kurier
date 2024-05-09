import { HttpStatusCode, IJsonApiError } from "../types";
export default class JsonApiError extends Error implements IJsonApiError {
    id?: string;
    status: HttpStatusCode;
    code: string;
    title?: string;
    detail?: string;
    source?: {
        pointer?: string;
        parameter?: string;
    };
    links?: {
        about?: string;
    };
    constructor(status: HttpStatusCode, code: string, detail?: string);
}
