import { Controller, Get, Post, Body, Req, UseGuards, UnauthorizedException, Query, BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ContactDto,
  ForgetPasswordDto,
  LoginDto,
  OtpDto,
  OtpLoginDto,
  RegisterDto,
  ResetPasswordDto,
  SocialLoginDto,
  VerifyForgetPasswordDto,
  VerifyOtpDto,
} from './dto/create-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/entities/user.entity';
import { EmailService } from './email.services';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService,private readonly emailService: EmailService,) {}

  @Post('register')
  createAccount(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Token is missing');
    }

    const result = await this.authService.verifyEmail(token);
    return { message: result };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('verification-notification')
  async resendEmail(@Req() req): Promise<{ message: string }> {
    const user = req.user
    return await this.authService.resendEmail(user)
  }
  
  @Post('token')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  @Post('social-login-token')
  socialLogin(@Body() socialLoginDto: SocialLoginDto) {
    return this.authService.socialLogin(socialLoginDto);
  }
  @Post('otp-login')
  otpLogin(@Body() otpLoginDto: OtpLoginDto) {
    return this.authService.otpLogin(otpLoginDto);
  }
  @Post('send-otp-code')
  sendOtpCode(@Body() otpDto: OtpDto) {
    return this.authService.sendOtpCode(otpDto);
  }
  @Post('verify-otp-code')
  verifyOtpCode(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtpCode(verifyOtpDto);
  }
  @Post('forget-password')
  forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto);
  }
  
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  changePassword(@Body() changePasswordDto: ChangePasswordDto,@Req() req) {
    return this.authService.changePassword(changePasswordDto,req);
  }
  @Post('logout')
  async logout(): Promise<boolean> {
    return true;
  }
  @Post('verify-forget-password-token')
  verifyForgetPassword(
    @Body() verifyForgetPasswordDto: VerifyForgetPasswordDto,
  ) {
    return this.authService.verifyForgetPasswordToken(verifyForgetPasswordDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req) {
    const user: User = req.user
    console.log('user===============',user,user.is_verified)
    if (!user.is_verified) {
      throw new ConflictException('Please verify your email before logging in.');
    }
    // console.log('me ===============',req)
    // throw new UnauthorizedException();
    return req.user; // User data is populated by JwtStrategy
  }
  
  @Post('add-points')
  addWalletPoints(@Body() addPointsDto: any) {
    return null //this.authService.me();
  }
  @Post('contact-us')
  async contactUs(@Body() contactDto: ContactDto) {
    await this.emailService.sendContactUsEmail(contactDto);
    
    return {
      success: true,
      message: 'Thank you for contacting us. We will get back to you soon.',
    };
  }
}
