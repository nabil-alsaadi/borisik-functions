import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  
  @Put('me')
  updateMe(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateMe(req.user, updateUserDto);
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  getAllUsers(@Query() query: GetUsersDto) {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    console.log('getUser(@Param()',id)
    return this.usersService.findOne(id);
  }

  @Put(':id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  removeUser(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post('unblock-user')
  activeUser(@Body('id') id: string) {
    return this.usersService.activeUser(id);
  }

  @Post('block-user')
  banUser(@Body('id') id: string) {
    return this.usersService.banUser(id);
  }

  @Post('make-admin')
  makeAdmin(@Body('user_id') id: string) {
    console.log('id',id)
    return this.usersService.makeAdmin(id);
  }
}

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createProfile(@Body() createProfileDto: CreateProfileDto) {
    console.log(createProfileDto);
  }

  @Put(':id')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    console.log(updateProfileDto);
  }

  @Delete(':id')
  deleteProfile(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}

@Controller('admin/list')
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllAdmin(@Query() query: GetUsersDto) {
    return this.usersService.getAdmin(query);
  }
}

@Controller('vendors/list')
export class VendorController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllVendor(@Query() query: GetUsersDto) {
    return this.usersService.getVendors(query);
  }
}

@Controller('my-staffs')
export class MyStaffsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllMyStaffs(@Query() query: GetUsersDto) {
    return this.usersService.getMyStaffs(query);
  }
}
@Controller('all-staffs')
export class AllStaffsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllStaffs(@Query() query: GetUsersDto) {
    return this.usersService.getAllStaffs(query);
  }
}

@Controller('customers/list')
export class AllCustomerController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllCustomers(@Query() query: GetUsersDto) {
    return this.usersService.getAllCustomers(query);
  }
}
