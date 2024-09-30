import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/config.util';

@Injectable()
export class JwtService {
  // private readonly jwtSecret: string;

  constructor() {
    // this.jwtSecret = JWT_SECRET.value();
    // if (!this.jwtSecret) {
    //   throw new InternalServerErrorException('JWT_SECRET is not defined in environment variables');
    // }
  }

  // Method to generate a JWT token
  generateToken(payload: any, expiresIn: string = '1d'): string {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn });
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate JWT token');
    }
  }

  // Method to verify a JWT token
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new InternalServerErrorException('Invalid or expired token');
    }
  }
}
