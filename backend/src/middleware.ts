import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend the Request interface to include a user property
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

export function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authorization token missing or invalid" });
        return; 
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, "secret", (err, user) => {
        if (err || typeof user !== "object" || !user) {
            res.status(403).json({ message: "Invalid or expired token" });
            return;
        }

        req.user = user

        next();
    });
}
