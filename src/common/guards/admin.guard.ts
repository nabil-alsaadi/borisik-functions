import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') implements CanActivate {
  
  isAdmin(user: User) {
    return user?.permissions?.some((item) => item.name === 'super_admin');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, run the JWT AuthGuard to verify the JWT token
    const canActivate = await super.canActivate(context);

    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    console.log('AdminGuard user:', user);

    // Now, check if the user has admin privileges
    if (this.isAdmin(user)) {
      return true;
    }

    // If the user is not an admin, throw a forbidden exception
    throw new ForbiddenException('You do not have permission to access this resource');
  }
}
