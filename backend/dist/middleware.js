"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authorization token missing or invalid" });
        return;
    }
    const token = authHeader.split(" ")[1];
    jsonwebtoken_1.default.verify(token, "secret", (err, user) => {
        if (err || typeof user !== "object" || !user) {
            res.status(403).json({ message: "Invalid or expired token" });
            return;
        }
        req.user = user;
        next();
    });
}
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=middleware.js.map