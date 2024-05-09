import { ApplicationInterface, VercelRequest, VercelResponse } from "../types";
import { TransportLayerOptions } from "../types";
export default function jsonApiVercel(app: ApplicationInterface, transportLayerOptions?: TransportLayerOptions): (req: VercelRequest, res: VercelResponse) => Promise<void>;
