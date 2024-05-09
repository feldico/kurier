import { Middleware } from "koa";
import * as compose from "koa-compose";
import { ApplicationInterface, TransportLayerOptions } from "../types";
export default function jsonApiKoa(app: ApplicationInterface, transportLayerOptions?: TransportLayerOptions, ...middlewares: Middleware[]): compose.ComposedMiddleware<import("koa").ParameterizedContext<import("koa").DefaultState, import("koa").DefaultContext, any>>;
