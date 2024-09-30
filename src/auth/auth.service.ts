import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
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
import { JWT_SECRET } from '../utils/config.util';

const users = plainToClass(User, usersJson);

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtService,
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
    };

    // Step 4: Store user data in Firestore using Firebase's auto-generated ID
    const userId = await this.firebaseService.addDocument('users', userData);

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
    // const user: User = {
    //   id: uuidv4(),
    //   ...users[0],
    //   ...createUserInput,
    //   created_at: new Date(),
    //   updated_at: new Date(),
    // };

    // this.users.push(user);
    // return {
    //   token: 'jwt token',
    //   permissions: ['super_admin', 'customer'],
    // };
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
    // console.log(loginInput);
    // if (loginInput.email === 'admin@demo.com') {
    //   return {
    //     token: 'jwt token',
    //     permissions: ['store_owner', 'super_admin'],
    //     role: 'super_admin',
    //   };
    // } else if (['store_owner@demo.com', 'vendor@demo.com'].includes(loginInput.email)) {
    //   return {
    //     token: 'jwt token',
    //     permissions: ['store_owner', 'customer'],
    //     role: 'store_owner',
    //   };
    // } else {
    //   return {
    //     token: 'jwt token',
    //     permissions: ['customer'],
    //     role: 'customer',
    //   };
    // }
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

  async forgetPassword(
    forgetPasswordInput: ForgetPasswordDto,
  ): Promise<CoreResponse> {
    console.log(forgetPasswordInput);

    return {
      success: true,
      message: 'Password change successful',
    };
  }
  async verifyForgetPasswordToken(
    verifyForgetPasswordTokenInput: VerifyForgetPasswordDto,
  ): Promise<CoreResponse> {
    console.log(verifyForgetPasswordTokenInput);

    return {
      success: true,
      message: 'Password change successful',
    };
  }
  async resetPassword(
    resetPasswordInput: ResetPasswordDto,
  ): Promise<CoreResponse> {
    console.log(resetPasswordInput);

    return {
      success: true,
      message: 'Password change successful',
    };
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
