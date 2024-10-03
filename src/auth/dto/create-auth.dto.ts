import { PartialType, PickType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { CoreMutationOutput } from '../../common/dto/core-mutation-output.dto';
import { User } from '../../users/entities/user.entity';

export enum Permission {
  SUPER_ADMIN = 'Super admin',
  STORE_OWNER = 'Store owner',
  STAFF = 'Staff',
  CUSTOMER = 'Customer',
}
export class RegisterDto extends PickType(User, ['name', 'email', 'password']) {
  permission: Permission = Permission.CUSTOMER;
}

// export class LoginDto extends PartialType(
//   PickType(User, ['email', 'password']),
// ) {}
export class LoginDto extends PartialType(
  PickType(User, ['email', 'password']),
) {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class SocialLoginDto {
  provider: string;
  access_token: string;
}
export class ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}
export class ForgetPasswordDto {
  email: string;
}
export class VerifyForgetPasswordDto {
  email: string;
  token: string;
}
export class ResetPasswordDto {
  email: string;
  token: string;
  password: string;
}

export class AuthResponse {
  token: string;
  permissions: string[];
  role?: string;
}
export class CoreResponse extends CoreMutationOutput {}

export class VerifyOtpDto {
  otp_id: string;
  code: string;
  @IsString()
  @Matches(/^9715[0-9]{8}$/, {
    message: 'Invalid phone number',
  })
  phone_number: string;
}

export class OtpResponse {
  id: string;
  message: string;
  success: boolean;
  phone_number: string;
  provider: string;
  is_contact_exist: boolean;
}
export class OtpDto {
  phone_number: string;
}
export class OtpLoginDto {
  otp_id: string;
  code: string;
  phone_number: string;
  name?: string;
  email?: string;
}
