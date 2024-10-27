import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import {
  AuthResponse,
  ChangePasswordDto,
  ForgetPasswordDto,
  LoginDto,
  CoreResponse,
  RegisterDto,
  ResetPasswordDto,
  VerifyForgetPasswordDto,
  SocialLoginDto,
  OtpLoginDto,
  OtpResponse,
  VerifyOtpDto,
  OtpDto,
  Permission,
} from './dto/create-auth.dto';

import { v4 as uuidv4 } from 'uuid';
import { plainToClass } from 'class-transformer';
import { User, Permission as UserPermission, UserPermissionType } from '../users/entities/user.entity';
import usersJson from '../db/users.json';
import { FirebaseService } from '../firebase/firebase.service';
import * as bcrypt from 'bcrypt'; // For password hashing
import * as jwt from 'jsonwebtoken'; // For generating JWT
import { JwtService } from './jwt.service';
import { EMAIL_VERIFICATION_LINK, JWT_SECRET } from '../utils/config.util';
import { EmailService } from './email.services';

const users = plainToClass(User, usersJson);

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private users: User[] = users;
  
  async register(createUserInput: RegisterDto): Promise<AuthResponse> {
    const { email, password, name, permission } = createUserInput;

    // Step 1: Check if the email already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Step 2: Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    
    var userPermission = UserPermissionType.CUSTOMER
    switch(permission) {
      case Permission.SUPER_ADMIN:
        userPermission = UserPermissionType.SUPER_ADMIN
        break
      case Permission.STAFF:
        userPermission = UserPermissionType.STAFF
        break
      case Permission.CUSTOMER:
        userPermission = UserPermissionType.CUSTOMER
        break
      case Permission.STORE_OWNER:
        userPermission = UserPermissionType.STORE_OWNER
        break
    }
    const permissionObj: UserPermission[] = [{name: userPermission ,guard_name: "api",id:1,created_at: new Date(),updated_at: new Date() }]
    // Step 3: Prepare user data (without the ID since Firebase will generate it)
    const userData: Omit<User, 'id'> = {
      email,
      name,
      password: hashedPassword, // Store the hashed password
      permissions: permissionObj,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      is_verified: false
    };

    // Step 4: Store user data in Firestore using Firebase's auto-generated ID
    const userId = await this.firebaseService.addDocument('users', userData);

    const verificationToken = this.jwtService.generateToken({
      uid: userId,
      email: email
    }, '1h');

    await this.emailService.sendVerificationEmail(email, verificationToken);

    await this.firebaseService.updateDocument('users',userId,{verification_link: `${EMAIL_VERIFICATION_LINK}${verificationToken}`})

    const token = this.jwtService.generateToken({
      uid: userId,
      email: email,
      permissions: userData.permissions,
    });

    // Step 6: Return token and permissions as AuthResponse
    return {
      token: token, // JWT token
      permissions: [userData.permissions[0].toString()], // Return the user's permission
    };
  }
  async resendEmail(user: User){
    await this.emailService.sendVerificationEmail(user.email, user.verification_link);
    return {message: 'sucesfully send email'}
  }
  
  async verifyEmail(token: string): Promise<string> {
    try {
      const decoded = this.jwtService.verifyToken(token);
  
      // Retrieve the user by ID
      const user = await this.getUserById(decoded.uid);
      if (!user) {
        throw new BadRequestException('User not found');
      }
  
      // Check if the user is already verified
      if (user.is_verified) {
        return 'User already verified';
      }
  
      // Mark user as verified in Firestore
      await this.firebaseService.updateDocument('users', user.id, { is_verified: true });
  
      return 'Email verified successfully';
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }
  
  isAdmin(user: User) {
    return user.permissions.filter((item) => item.name === "super_admin").length > 0 
  }
  async login(loginInput: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginInput;

    // Step 1: Find user by email
    const user = await this.getUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    // if (!user.is_verified) {
    //   throw new ConflictException('Please verify your email before logging in.');
    // }
    if(!user.is_active) {
      throw new UnauthorizedException('User is not active');
    }

    // Step 2: Check if the password matches
    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Step 3: Generate JWT token
    const jwtSecret = await JWT_SECRET;
    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET is not defined in environment variables');
    }

    const token = this.jwtService.generateToken({
      uid: user.id,
      email: user.email,
      permissions: user.permissions,
    });

    // Step 4: Return token and permissions
    return {
      token,
      permissions: user.permissions.map(p => p.name), // Convert permissions to string if needed
      role: this.isAdmin(user) ? 'super_admin' : 'customer', // Example role logic
    };
  }
  private async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.firebaseService.getCollection<User>('users', ref => ref.where('email', '==', email).limit(1));
    return users.length > 0 ? users[0] : null;
  }
  async getUserById(userId: string): Promise<User> {
    const userDoc = await this.firebaseService.getDocumentById<User>('users', userId); // Use getDocumentById instead
    
    if (!userDoc) {
      throw new UnauthorizedException('User not found');
    }
    console.log('userDoc ===========',userDoc,userDoc.is_verified)
    const { password, ...userWithoutPassword } = userDoc;

  return userWithoutPassword as User;
  }
  
  async changePassword(changePasswordInput: ChangePasswordDto, req: any): Promise<CoreResponse> {
    const { oldPassword, newPassword } = changePasswordInput;

    // Step 1: Retrieve the authenticated user from the request object
    const user = req.user; // Assuming AuthGuard populates req.user
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Step 2: Fetch the user data from Firestore
    const storedUser = await this.firebaseService.getDocumentById<User>('users', user.id);
    if (!storedUser) {
      throw new BadRequestException('User not found');
    }
    // console.log('bcrypt.compare(oldPassword, storedUser.password);',oldPassword,storedUser.password,user)
    // Step 3: Check if the old password matches the hashed password in Firestore
    const passwordMatch = await bcrypt.compare(oldPassword, storedUser.password);
    if (!passwordMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Step 4: Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10); // Salt rounds set to 10

    // Step 5: Update the user's password in Firestore
    await this.firebaseService.updateDocument('users', user.id, { password: hashedNewPassword });

    // Step 6: Return success message
    return {
      success: true,
      message: 'Password change successful',
    };
  }
  async verifyOtpCode(verifyOtpInput: VerifyOtpDto): Promise<CoreResponse> {
    console.log(verifyOtpInput);
    return {
      message: 'success',
      success: true,
    };
  }
  // async changePassword(
  //   changePasswordInput: ChangePasswordDto,
  // ): Promise<CoreResponse> {
  //   console.log(changePasswordInput);

  //   return {
  //     success: true,
  //     message: 'Password change successful',
  //   };
  // }

  // async forgetPassword(
  //   forgetPasswordInput: ForgetPasswordDto,
  // ): Promise<CoreResponse> {
  //   console.log(forgetPasswordInput);

  //   return {
  //     success: true,
  //     message: 'Password change successful',
  //   };
  // }
  
  // async verifyForgetPasswordToken(
  //   verifyForgetPasswordTokenInput: VerifyForgetPasswordDto,
  // ): Promise<CoreResponse> {
  //   console.log(verifyForgetPasswordTokenInput);

  //   return {
  //     success: true,
  //     message: 'Password change successful',
  //   };
  // }
  // async resetPassword(
  //   resetPasswordInput: ResetPasswordDto,
  // ): Promise<CoreResponse> {
  //   console.log(resetPasswordInput);

  //   return {
  //     success: true,
  //     message: 'Password change successful',
  //   };
  // }
  async forgetPassword(forgetPasswordInput: ForgetPasswordDto): Promise<CoreResponse> {
    const { email } = forgetPasswordInput;
  
    // Step 1: Check if user exists
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new BadRequestException('Email does not exist');
    }
  
    // Step 2: Generate a JWT reset token with an expiration time
    const resetToken = this.jwtService.generateToken(
      { uid: user.id, email: user.email },
      '1h' // Token expires in 1 hour
    );
  
    // Step 3: Send the token to the user's email
    await this.firebaseService.updateDocument('users',user.id,{forget_pass_token: resetToken})
    await this.emailService.sendResetPasswordEmail(email, resetToken);
  
    return {
      success: true,
      message: 'Password reset link sent to your email',
    };
  }
  
  async resetPassword(resetPasswordInput: ResetPasswordDto): Promise<CoreResponse> {
    const { token, password } = resetPasswordInput;
  
    try {
      // Step 1: Verify the token
      const decoded = this.jwtService.verifyToken(token);
      const userId = decoded.uid;
  
      // Step 2: Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Step 3: Update the user's password
      await this.firebaseService.updateDocument('users', userId, {
        password: hashedPassword,
      });
  
      return {
        success: true,
        message: 'Password has been reset successfully',
      };
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async verifyForgetPasswordToken(
    verifyForgetPasswordTokenInput: VerifyForgetPasswordDto,
  ): Promise<CoreResponse> {
    const { email, token } = verifyForgetPasswordTokenInput;
  
    try {
      // Decode and verify the token using your JWT service
      const decoded = this.jwtService.verifyToken(token);
      
      // Check if the token's email matches the provided email
      if (decoded.email !== email) {
        throw new BadRequestException('Invalid token for the provided email');
      }
  
      // Token is valid
      return {
        success: true,
        message: 'Token verified successfully. You may proceed with resetting your password.',
      };
    } catch (error) {
      // Handle expired or invalid tokens
      throw new BadRequestException('Invalid or expired reset token');
    }
  }
  
  
  async socialLogin(socialLoginDto: SocialLoginDto): Promise<AuthResponse> {
    console.log(socialLoginDto);
    return {
      token: 'jwt token',
      permissions: ['super_admin', 'customer'],
      role: 'customer',
    };
  }
  async otpLogin(otpLoginDto: OtpLoginDto): Promise<AuthResponse> {
    console.log(otpLoginDto);
    return {
      token: 'jwt token',
      permissions: ['super_admin', 'customer'],
      role: 'customer',
    };
  }
  
  async sendOtpCode(otpInput: OtpDto): Promise<OtpResponse> {
    console.log(otpInput);
    return {
      message: 'success',
      success: true,
      id: '1',
      provider: 'google',
      phone_number: otpInput.phone_number,
      is_contact_exist: true,
    };
  }
  // me(): User {
  //   return this.users[0];
  // }

  // async getUsers({ text, first, page }: GetUsersArgs): Promise<UserPaginator> {
  //   const startIndex = (page - 1) * first;
  //   const endIndex = page * first;
  //   let data: User[] = this.users;
  //   if (text?.replace(/%/g, '')) {
  //     data = fuse.search(text)?.map(({ item }) => item);
  //   }
  //   const results = data.slice(startIndex, endIndex);
  //   return {
  //     data: results,
  //     paginatorInfo: paginate(data.length, page, first, results.length),
  //   };
  // }
  // public getUser(getUserArgs: GetUserArgs): User {
  //   return this.users.find((user) => user.id === getUserArgs.id);
  // }
  

  // updateUser(id: number, updateUserInput: UpdateUserInput) {
  //   return `This action updates a #${id} user`;
  // }
}
