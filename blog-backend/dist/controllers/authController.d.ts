import { Request, Response } from 'express';
interface SignupBody {
    email: string;
    name: string;
    password: string;
}
interface LoginBody {
    email: string;
    password: string;
}
export declare const signup: (req: Request<{}, {}, SignupBody>, res: Response) => Promise<void>;
export declare const login: (req: Request<{}, {}, LoginBody>, res: Response) => Promise<void>;
export declare const logout: (req: Request, res: Response) => void;
export declare const getCurrentUser: (req: Request, res: Response) => Promise<void>;
export {};
