import * as escapeStringRegexp from "escape-string-regexp";
import { Request as ExpressRequest } from "express";
import { Request as KoaRequest } from "koa";

import JsonApiErrors from "../errors/json-api-errors";
import { JsonApiDocument, JsonApiErrorsDocument, Operation, OperationResponse } from "../types";
import { parse } from "../utils/json-api-params";
import { camelize, singularize } from "../utils/string";
import ApplicationInstance from "../application-instance";
import User from "../resources/user";
import JsonApiError from "../errors/error";

const STATUS_MAPPING = {
  GET: 200,
  POST: 201,
  PATCH: 200,
  PUT: 200,
  DELETE: 204
};

async function authenticate(appInstance: ApplicationInstance, request: ExpressRequest | KoaRequest) {
  const authHeader = request.headers.authorization;
  let currentUser: User;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const [, token] = authHeader.split(" ");
    currentUser = await appInstance.getUserFromToken(token);
  }

  appInstance.user = currentUser;
}

function urlData(appInstance: ApplicationInstance, path: string) {
  const urlRegexp = new RegExp(
    `^(\/+)?((?<namespace>${escapeStringRegexp(
      appInstance.app.namespace
    )})(\/+|$))?(?<resource>[^\\s\/?]+)?(\/+)?((?<id>[^\\s\/?]+)?(\/+)?\(?<relationships>relationships)?(\/+)?)?` +
    "(?<relationship>[^\\s/?]+)?(/+)?$"
  );

  const { resource, id, relationships, relationship } = (path.match(urlRegexp) || {})["groups"] || ({} as any);

  return {
    id,
    resource,
    relationship,
    isRelationships: !!relationships
  };
}

async function handleBulkEndpoint(
  appInstance: ApplicationInstance,
  operations: Operation[]
): Promise<{ operations: OperationResponse[] }> {
  return { operations: await appInstance.app.executeOperations(operations || []) };
}

async function handleJsonApiEndpoint(
  appInstance: ApplicationInstance,
  request: ExpressRequest | KoaRequest
): Promise<{ body: JsonApiDocument | JsonApiErrorsDocument; status: number }> {
  const op: Operation = convertHttpRequestToOperation(request);
  if (["update", "remove"].includes(op.op) && !op.ref.id) return;

  try {
    const [result]: OperationResponse[] = await appInstance.app.executeOperations([op], appInstance);
    return {
      body: convertOperationResponseToHttpResponse(request, result),
      status: STATUS_MAPPING[request.method]
    };
  } catch (error) {
    return {
      body: convertErrorToHttpResponse(error),
      status: error.status || 500
    };
  }
}

function convertHttpRequestToOperation(req: ExpressRequest | KoaRequest): Operation {
  const { id, resource, relationship } = req["urlData"];
  const type = camelize(singularize(resource));

  const opMap = {
    GET: "get",
    POST: "add",
    PATCH: "update",
    PUT: "update",
    DELETE: "remove"
  };

  return {
    op: opMap[req.method],
    params: parse(req["href"]),
    ref: { id, type, relationship },
    data: (req.body || {}).data
  } as Operation;
}

function convertOperationResponseToHttpResponse(
  req: ExpressRequest | KoaRequest,
  operation: OperationResponse
): JsonApiDocument {
  const responseMethods = ["GET", "POST", "PATCH", "PUT"];

  if (responseMethods.includes(req.method)) {
    return { data: operation.data, included: operation.included };
  }
}

function convertErrorToHttpResponse(error: JsonApiError): JsonApiErrorsDocument {
  const isJsonApiError = error && error.status;
  if (!isJsonApiError) console.error("JSONAPI-TS: ", error);

  const jsonApiError = isJsonApiError ? error : JsonApiErrors.UnhandledError();
  if ((!process.env.NODE_ENV || process.env.NODE_ENV !== "production") && error.stack && !isJsonApiError) {
    let firstLineErrorStack = error.stack.split("\n")[0];
    if (firstLineErrorStack.indexOf("Error:") === 0) {
      firstLineErrorStack = firstLineErrorStack.slice(7);
    }
    jsonApiError.detail = firstLineErrorStack;
  }
  return { errors: [jsonApiError] };
}

export {
  STATUS_MAPPING,
  authenticate,
  urlData,
  handleBulkEndpoint,
  handleJsonApiEndpoint,
  convertHttpRequestToOperation,
  convertOperationResponseToHttpResponse,
  convertErrorToHttpResponse
};