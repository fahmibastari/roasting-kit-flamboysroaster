
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'RAHASIA_NEGARA', // Fallback kalo env belum ada
        });
    }

    async validate(payload: any) {
        // Payload ini adalah data yang kita masukkan saat login (sub, username, role)
        // Di sini kita return object user yang akan nempel di request (req.user)
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}
