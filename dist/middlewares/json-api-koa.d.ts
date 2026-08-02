import { Middleware } from "koa";
import { ApplicationInterface, TransportLayerOptions } from "../types";
export default function jsonApiKoa(app: ApplicationInterface, transportLayerOptions?: TransportLayerOptions, ...middlewares: Middleware[]): any;
