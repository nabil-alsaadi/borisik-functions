import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { JWT_SECRET } from '../utils/config.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from Authorization header
      secretOrKey: JWT_SECRET,
    });
  }
  isAdmin(user: User) {
    return user.permissions.filter((item) => item.name === "super_admin").length > 0 
  }
  async validate(payload: any) {
    // console.log('payload ======', payload)
    const user = await this.authService.getUserById(payload.uid);
    user.isAdmin = this.isAdmin(user) 
    if (!user) {
      throw new UnauthorizedException();
    }
    return user; // Attach user to request
  }
}
