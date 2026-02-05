"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const authenticateToken = (req, res, next) => {
    var _a;
    try {
        // Get token from cookie or Authorization header
        console.log("middleware reached authenticateToken");
        let token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
        if (!token) {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : null;
        }
        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.authenticateToken = authenticateToken;
// Optional auth - sets userId if token is present but doesn't require it
const optionalAuth = (req, res, next) => {
    var _a;
    try {
        // Get token from cookie or Authorization header
        console.log("optionalAuth reached");
        let token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
        if (!token) {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : null;
        }
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                req.userId = decoded.userId;
            }
            catch (error) {
                // Token is invalid, but we continue anyway
                console.log('Optional auth: Invalid token');
            }
        }
        next();
    }
    catch (error) {
        // Continue even if there's an error
        next();
    }
};
exports.optionalAuth = optionalAuth;
