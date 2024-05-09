/// <reference types="qs" />
import * as express from "express";
import { ApplicationInterface, TransportLayerOptions } from "../types";
export default function jsonApiExpress(app: ApplicationInterface, transportLayerOptions?: TransportLayerOptions, ...middlewares: express.RequestHandler[]): import("compose-middleware").RequestHandler<import("express-serve-static-core").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, import("express-serve-static-core").Response<any, Record<string, any>, number>, void>;
