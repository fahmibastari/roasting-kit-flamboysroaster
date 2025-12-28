
import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        forwardRef(() => UsersModule),
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'RAHASIA_NEGARA',
            signOptions: { expiresIn: '1d' }, // Token expired 1 hari
        }),
    ],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule { }
