import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PublicGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // Try to authenticate the user using the default AuthGuard (jwt)
      await super.canActivate(context);
    } catch (err) {
      // If authentication fails (user is not authenticated), we catch the error and allow public access
    }

    // Allow access regardless of authentication status
    return true;
  }
}
