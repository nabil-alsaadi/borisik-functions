import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtService } from './jwt.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { EmailService } from './email.services';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    FirebaseModule
  ],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy,JwtService,EmailService],
  exports: [AuthService,JwtService],
})
export class AuthModule {}
