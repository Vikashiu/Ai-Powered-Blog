import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
    userId: string;
}

// Extend Express Request type to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Get token from cookie or Authorization header
        console.log("middleware reached authenticateToken");
        let token = req.cookies?.token;

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
        const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
        req.userId = decoded.userId;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Optional auth - sets userId if token is present but doesn't require it
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Get token from cookie or Authorization header
        console.log("optionalAuth reached");
        let token = req.cookies?.token;

        if (!token) {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : null;
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
                req.userId = decoded.userId;
            } catch (error) {
                // Token is invalid, but we continue anyway
                console.log('Optional auth: Invalid token');
            }
        }

        next();
    } catch (error) {
        // Continue even if there's an error
        next();
    }
};
