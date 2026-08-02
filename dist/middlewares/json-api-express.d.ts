import * as express from "express";
import { ApplicationInterface, TransportLayerOptions } from "../types";
export default function jsonApiExpress(app: ApplicationInterface, transportLayerOptions?: TransportLayerOptions, ...middlewares: express.RequestHandler[]): express.RequestHandler;
