import type { JwtPayload } from "../middleware/authMiddleware.js";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}

export {}