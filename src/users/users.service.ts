import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto, UserPaginator } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import Fuse from 'fuse.js';
import { User, Permission as UserPermission } from './entities/user.entity';
import usersJson from '../db/users.json';
import { paginate } from '../common/pagination/paginate';
import { FirebaseService } from '../firebase/firebase.service';
import { Address } from '../addresses/entities/address.entity';
import { getSearchParam } from '../utils/utils';

const users = plainToClass(User, usersJson);

const options = {
  keys: ['name', 'type.slug', 'categories.slug', 'status'],
  threshold: 0.3,
};
const fuse = new Fuse(users, options);

@Injectable()
export class UsersService {
  constructor(
    private readonly firebaseService: FirebaseService
  ) {}
  private users: User[] = users;

  async updateMe(user: User, updateUserDto: UpdateUserDto): Promise<User | null> {
    const userId = user.id; // Assuming this is the Firebase document ID
    let updatedAddressArray = user.address || [];
  
    if (updateUserDto.address && updateUserDto.address.length > 0) {
      const incomingAddress = updateUserDto.address[0]; // Assuming just one address is passed
  
      if (incomingAddress.id !== undefined && incomingAddress.id !== null) {
        // If the address has an `id`, update the existing one
        const addressIndex = updatedAddressArray.findIndex((addr) => addr.id === incomingAddress.id);
        
        if (addressIndex !== -1) {
          // Update the existing address at the given index
          updatedAddressArray[addressIndex] = {
            ...updatedAddressArray[addressIndex],
            ...incomingAddress, // Merge the incoming fields (can include updates)
            updated_at: new Date(), // Update the `updated_at` field
          };
        }
      } else {
        // If no `id`, treat it as a new address and generate a unique id
        const newAddress: Address = {
          ...incomingAddress,
          id: updatedAddressArray.length > 0 ? Math.max(...updatedAddressArray.map(a => a.id)) + 1 : 1, // Generate new unique id
          created_at: new Date(),
          updated_at: new Date(),
        };
  
        // Append the new address to the existing array
        updatedAddressArray = [...updatedAddressArray, newAddress];
      }
    }
  
    // Add the updated_at field with the current timestamp
    const updateWithTimestamp = {
      ...updateUserDto,
      address: updatedAddressArray,
      // updated_at: new Date(), // or use Date.now() if you prefer a timestamp
    } as unknown as Partial<User>;
  
    // Update user data with partial fields (using setWithMerge to avoid overwriting)
    await this.firebaseService.setWithMerge<User>('users', userId, updateWithTimestamp);
  
    // Fetch and return the updated user (without password)
    const updatedUser = await this.getUserById(userId);
  
    return updatedUser; // Updated user without sensitive fields like password
  }
  
  
  // async updateMe(user: User, updateUserDto: UpdateUserDto): Promise<User | null> {
  //   console.log('updateMe============',user)
  //   const userId = user.id; // Assuming this is the Firebase document ID
  //   let updatedAddressArray = user.address || [];

  //   if (updateUserDto.address && updateUserDto.address.length > 0) {
  //     // Assume it's just one address and append it to the array with the index
  //     const newAddress: Address = {
  //       ...updateUserDto.address[0], // Assuming you're passing just one address
  //       id: updatedAddressArray.length, // Use array index as ID
  //       created_at: new Date(),
  //       updated_at: new Date(),
  //     };

  //     // Append the new address to the existing array
  //     updatedAddressArray = [...updatedAddressArray, newAddress];
  //   }
  //   // Add the updated_at field with the current timestamp
  //   const updateWithTimestamp = {
  //     ...updateUserDto,
  //     address: updatedAddressArray,
  //     updated_at: new Date().toISOString(), // or use Date.now() if you prefer a timestamp
  //   } as unknown as Partial<User>;
  
  //   // Update user data with partial fields (using setWithMerge to avoid overwriting)
  //   await this.firebaseService.setWithMerge<User>('users', userId, updateWithTimestamp);
  
  //   // Fetch and return the updated user (without password)
  //   const updatedUser = await this.getUserById(userId);
  
  //   return updatedUser; // Updated user without sensitive fields like password
  // }
  
  async getUserById(userId: string): Promise<User> {
    const userDoc = await this.firebaseService.getDocumentById<User>('users', userId); // Use getDocumentById instead
    
    if (!userDoc) {
      throw new UnauthorizedException('User not found');
    }
  
    const { password, ...userWithoutPassword } = userDoc;

  return userWithoutPassword as User;
  }
  
  create(createUserDto: CreateUserDto) {
    return this.users[0];
  }

  async getUsers({
    text,
    limit,
    page,
    search,
  }: GetUsersDto): Promise<UserPaginator> {
    const searchName = getSearchParam(search, 'name');
    if (!page) page = 1;
    if (!limit) limit = 30;
    const startIndex = (page - 1) * limit;
  
    // Query all users from Firestore
    let users = await this.firebaseService.getCollection<User>('users');
  
    // Manually filter users who have 'customer' in their permissions

    const options = {
      keys: ['name', 'email'],
      threshold: 0.3,
    };
    const fuse = new Fuse(users, options);
  
    // Apply text-based search with Fuse.js if search text is provided
    console.log('search',search,search?.replace(/%/g, ''))
    if (searchName?.replace(/%/g, '')) {
      users = fuse.search(searchName)?.map(({ item }) => item);
    }
  
    // Slice the filtered data for pagination
    const results = users.slice(startIndex, startIndex + limit);
    const url = `/customers/list?limit=${limit}`;
  
    return {
      data: results,
      ...paginate(users.length, page, limit, results.length, url),
    };
    // if (!page) page = 1;
    // if (!limit) limit = 30;
    // const startIndex = (page - 1) * limit;
    // const endIndex = page * limit;
    // let data: User[] = this.users;
    // if (text?.replace(/%/g, '')) {
    //   data = fuse.search(text)?.map(({ item }) => item);
    // }

    // if (search) {
    //   const parseSearchParams = search.split(';');
    //   const searchText: any = [];
    //   for (const searchParam of parseSearchParams) {
    //     const [key, value] = searchParam.split(':');
    //     // TODO: Temp Solution
    //     if (key !== 'slug') {
    //       searchText.push({
    //         [key]: value,
    //       });
    //     }
    //   }

    //   data = fuse
    //     .search({
    //       $and: searchText,
    //     })
    //     ?.map(({ item }) => item);
    // }

    // const results = data.slice(startIndex, endIndex);
    // const url = `/users?limit=${limit}`;

    // return {
    //   data: results,
    //   ...paginate(data.length, page, limit, results.length, url),
    // };
  }

  getUsersNotify({ limit }: GetUsersDto): User[] {
    const data: any = this.users;
    return data?.slice(0, limit);
  }

  async findOne(id: string): Promise<User | null> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new BadRequestException('Invalid user ID');
    }
    
    try {
      // Fetch the user from Firestore
      const user = await this.firebaseService.getDocumentById<User>('users', id);

      // If user is not found, throw a NotFoundException
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user; // Return the found user
    } catch (error) {
      // Handle unexpected errors from FirebaseService or network issues
      console.error('Error fetching user:', error);
      throw new BadRequestException('An error occurred while fetching the user');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user: User = await this.findOne(id);
    await this.updateMe(user,updateUserDto);
    return await this.findOne(id);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  // makeAdmin(user_id: string) {
  //   return this.users.find((u) => u.id === (user_id));
  // }

  async makeAdmin(user_id: string): Promise<User> {
    // Fetch the user from Firestore
    const user = await this.firebaseService.getDocumentById<User>('users', user_id);

    if (!user) {
      throw new Error('User not found');
    }

    const superAdminPermission: UserPermission = {
      id: 1,
      name: 'super_admin',
      guard_name: 'api',
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Check if the user already has the 'super_admin' permission
    const hasAdminPermission = user.permissions.some((permission) => permission.name === 'super_admin');

    if (hasAdminPermission) {
      // Remove 'super_admin' permission
      user.permissions = user.permissions.filter((permission) => permission.name !== 'super_admin');
    } else {
      // Add 'super_admin' permission
      user.permissions.push(superAdminPermission);
    }

    // Update the user's permissions in Firestore
    await this.firebaseService.updateDocument('users', user_id, {
      permissions: user.permissions,
      updated_at: new Date().toISOString(),
    });

    return user; // Return the updated user object
  }

  private async toggleUserActiveStatus(id: string): Promise<User> {
    const userDoc = await this.firebaseService.getDocumentById<User>('users', (id));

    if (!userDoc) {
      throw new Error('User not found');
    }

    const newStatus = !userDoc.is_active;

    // Update the user's active status in Firestore
    await this.firebaseService.updateDocument<User>('users', (id), {
      is_active: newStatus,
    });

    // Return the updated user object
    return {
      ...userDoc,
      is_active: newStatus,
    };
  }

  // Function to ban user (which toggles active status)
  async banUser(id: string): Promise<User> {
    return this.toggleUserActiveStatus(id);
  }

  // Function to activate user (which also toggles active status)
  async activeUser(id: string): Promise<User> {
    return this.toggleUserActiveStatus(id);
  }

  // banUser(id: number) {
  //   const user = this.users.find((u) => u.id === String(id));

  //   user.is_active = !user.is_active;

  //   return user;
  // }

  // activeUser(id: number) {
  //   const user = this.users.find((u) => u.id === String(id));

  //   user.is_active = !user.is_active;

  //   return user;
  // }

  // async getAdmin({
  //   text,
  //   limit,
  //   page,
  //   search,
  // }: GetUsersDto): Promise<UserPaginator> {
  //   if (!page) page = 1;
  //   if (!limit) limit = 30;
  //   const startIndex = (page - 1) * limit;
  //   const endIndex = page * limit;
  //   let data: User[] = this.users.filter(function (element) {
  //     return element.permissions.some(function (subElement) {
  //       return subElement.name === 'super_admin';
  //     });
  //   });

  //   if (text?.replace(/%/g, '')) {
  //     data = fuse.search(text)?.map(({ item }) => item);
  //   }
  //   const results = data.slice(startIndex, endIndex);
  //   const url = `/admin/list?limit=${limit}`;

  //   return {
  //     data: results,
  //     ...paginate(data.length, page, limit, results.length, url),
  //   };
  // }

async getAdmin({
  text,
  limit,
  page,
  search,
}: GetUsersDto): Promise<UserPaginator> {
  if (!page) page = 1;
  if (!limit) limit = 30;
  const startIndex = (page - 1) * limit;

  // Query all users from Firestore
  const users = await this.firebaseService.getCollection<User>('users');

  // Manually filter users who have 'super_admin' in their permissions
  let filteredData = users.filter(user =>
    user.permissions.some(permission => permission.name === 'super_admin')
  );

  // Log the filtered data before searching
  console.log('Filtered Admins:', filteredData);

  // Initialize Fuse.js with appropriate options
  const fuseOptions = {
    keys: ['name', 'email'], // Specify fields to search in
    threshold: 0.3, // Adjust threshold as needed
  };
  const fuse = new Fuse(filteredData, fuseOptions);

  // Apply text-based search with Fuse.js if search text is provided
  console.log('Search Term:', search);
  if (search?.replace(/%/g, '')) {
    filteredData = fuse.search(search)?.map(({ item }) => item);
  }

  // Log the search results
  console.log('Search Results:', filteredData);

  // Slice the filtered data for pagination
  const results = filteredData.slice(startIndex, startIndex + limit);
  const url = `/admin/list?limit=${limit}`;

  return {
    data: results,
    ...paginate(filteredData.length, page, limit, results.length, url),
  };
}


  

  async getVendors({
    text,
    limit,
    page,
    search,
  }: GetUsersDto): Promise<UserPaginator> {
    if (!page) page = 1;
    if (!limit) limit = 30;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    let data: User[] = this.users.filter(function (element) {
      return element.permissions.some(function (subElement) {
        return subElement.name === 'store_owner';
      });
    });

    if (text?.replace(/%/g, '')) {
      data = fuse.search(text)?.map(({ item }) => item);
    }
    const results = data.slice(startIndex, endIndex);
    const url = `/vendors/list?limit=${limit}`;

    return {
      data: results,
      ...paginate(data.length, page, limit, results.length, url),
    };
  }

  // async getAllCustomers({
  //   text,
  //   limit,
  //   page,
  //   search,
  // }: GetUsersDto): Promise<UserPaginator> {
  //   if (!page) page = 1;
  //   if (!limit) limit = 30;
  //   const startIndex = (page - 1) * limit;
  //   const endIndex = page * limit;
  //   let data: User[] = this.users.filter(function (element) {
  //     return element.permissions.some(function (subElement) {
  //       return subElement.name === 'customer';
  //     });
  //   });

  //   if (text?.replace(/%/g, '')) {
  //     data = fuse.search(text)?.map(({ item }) => item);
  //   }
  //   const results = data.slice(startIndex, endIndex);
  //   const url = `/customers/list?limit=${limit}`;

  //   return {
  //     data: results,
  //     ...paginate(data.length, page, limit, results.length, url),
  //   };
  // }
  async getAllCustomers({
    text,
    limit,
    page,
    search
  }: GetUsersDto): Promise<UserPaginator> {
    if (!page) page = 1;
    if (!limit) limit = 30;
    const startIndex = (page - 1) * limit;
  
    // Query all users from Firestore
    const users = await this.firebaseService.getCollection<User>('users');
  
    // Manually filter users who have 'customer' in their permissions
    let filteredData = users.filter(user =>
      user.permissions.some(permission => permission.name === 'customer')
    );

    const options = {
      keys: ['name', 'email'],
      threshold: 0.3,
    };
    const fuse = new Fuse(filteredData, options);
  
    // Apply text-based search with Fuse.js if search text is provided
    console.log('search',search,search?.replace(/%/g, ''))
    if (search?.replace(/%/g, '')) {
      filteredData = fuse.search(search)?.map(({ item }) => item);
    }
  
    // Slice the filtered data for pagination
    const results = filteredData.slice(startIndex, startIndex + limit);
    const url = `/customers/list?limit=${limit}`;
  
    return {
      data: results,
      ...paginate(filteredData.length, page, limit, results.length, url),
    };
  }
  
  

  async getMyStaffs({
    text,
    limit,
    page,
    search,
  }: GetUsersDto): Promise<UserPaginator> {
    if (!page) page = 1;
    if (!limit) limit = 30;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    let data: User[] = [];

    if (text?.replace(/%/g, '')) {
      data = fuse.search(text)?.map(({ item }) => item);
    }
    const results = data.slice(startIndex, endIndex);
    const url = `/my-staffs/list?limit=${limit}`;

    return {
      data: results,
      ...paginate(data.length, page, limit, results.length, url),
    };
  }

  async getAllStaffs({
    text,
    limit,
    page,
    search,
  }: GetUsersDto): Promise<UserPaginator> {
    if (!page) page = 1;
    if (!limit) limit = 30;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    let data: User[] = [];

    if (text?.replace(/%/g, '')) {
      data = fuse.search(text)?.map(({ item }) => item);
    }
    const results = data.slice(startIndex, endIndex);
    const url = `/all-staffs/list?limit=${limit}`;

    return {
      data: results,
      ...paginate(data.length, page, limit, results.length, url),
    };
  }
}
