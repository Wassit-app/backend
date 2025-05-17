import jwt, { JwtPayload } from "jsonwebtoken";
import ENV from "../config/config";

class TokenService {
    private static JWT_SECRET = ENV.jwt_secret as string;

    static generateToken(payload: object, systemRole: string, expiresIn: string = "1d"): string {
        return jwt.sign({ ...payload, systemRole }, this.JWT_SECRET, {
            expiresIn,
        } as jwt.SignOptions);
    }

    static verifyToken(token: string): JwtPayload | null {
        try {
            const data = jwt.verify(token, this.JWT_SECRET) as JwtPayload;
            delete data.iat;
            delete data.exp;

            return data as JwtPayload;
        } catch (err) {
            return null;
        }
    }
}

export default TokenService;