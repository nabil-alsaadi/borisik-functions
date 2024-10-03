import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import Fuse from 'fuse.js';
import { paginate } from '../common/pagination/paginate';
import { Wishlist } from './entities/wishlist.entity';
import { GetWishlistDto } from './dto/get-wishlists.dto';
import { CreateWishlistDto } from './dto/create-wishlists.dto';
import { UpdateWishlistDto } from './dto/update-wishlists.dto';
import wishlistsJSON from '../db/wishlists.json';
import { Product } from '../products/entities/product.entity';
import productsJson from '../db/products.json';
import { User } from '../users/entities/user.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { ProductsService } from '../products/products.service';

const products = plainToClass(Product, productsJson);
const wishlists = plainToClass(Wishlist, wishlistsJSON);

const options = {
  keys: ['answer'],
  threshold: 0.3,
};
const fuse = new Fuse(wishlists, options);

@Injectable()
export class MyWishlistService {
  private wishlist: Wishlist[] = wishlists;
  private products: any = products;
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly productService: ProductsService
  ) {}
  // findAMyWishlists({ limit, page, search }: GetWishlistDto, user: User) {
  //   const wishlist = user.wishlist // array of strings 
  //   if (!page) page = 1;
  //   if (!limit) limit = 30;
  //   const startIndex = (page - 1) * limit;
  //   const endIndex = page * limit;
  //   const data: Product[] = this.products.slice(1, 7);
  //   const results = data.slice(startIndex, endIndex);
  //   const url = `/my-wishlists?with=shop&orderBy=created_at&sortedBy=desc`;
  //   return {
  //     data: results,
  //     ...paginate(data.length, page, limit, results.length, url),
  //   };
  // }

  async findAMyWishlists(
    { limit, page, search,language }: GetWishlistDto, 
    user: User
  ): Promise<any> {
    const wishlist = user?.wishlist ?? []; // Array of product IDs (strings)
  
    if (!page) page = 1;
    if (!limit) limit = 30;
    
    if (!wishlist || wishlist.length === 0) {
      return {
        data: [],
        ...paginate(0, page, limit, 0, '/my-wishlists?with=shop&orderBy=created_at&sortedBy=desc'),
      };
    }
    // Fetch all products from Firebase
    const allProducts = await this.productService.getProducts({language: language ?? "en"})
    console.log('allProducts',allProducts)
    // Filter products based on the user's wishlist
    const wishlistProducts = allProducts.data.filter(product => wishlist.includes(product.id));
  
    // Apply pagination logic
    const startIndex = (page - 1) * limit;
    const paginatedProducts = wishlistProducts.slice(startIndex, startIndex + limit);
  
    const totalItems = wishlistProducts.length;
    const url = `/my-wishlists?with=shop&orderBy=created_at&sortedBy=desc`;
  
    // Return the results with pagination data
    return {
      data: paginatedProducts,
      ...paginate(totalItems, page, limit, paginatedProducts.length, url),
    };
  }

  findAMyWishlist(id: number) {
    return this.wishlist.find((p) => p.id === id);
  }

  create(createWishlistDto: CreateWishlistDto) {
    return this.wishlist[0];
  }

  update(id: number, updateWishlistDto: UpdateWishlistDto) {
    return this.wishlist[0];
  }

  async delete(id: string,user: User) {
    const wishlist = user?.wishlist ?? []
    const isExisit = wishlist.includes(id);
    if(isExisit) {
      const newWishlist = wishlist.filter(item => item !== id)
      const data = {
        wishlist: newWishlist
      }
      await this.firebaseService.setWithMerge('users',user.id,data)
      return id
    }
    else {
      return null
    }

  }
  async toggle({ product_id }: CreateWishlistDto,user: User) {
    const wishlist = user?.wishlist ?? []
    const isExisit = wishlist.includes(product_id);
    const newWishlist = isExisit ? wishlist.filter(item => item !== product_id) : [...wishlist,product_id]
    // const product = this.products.find((p) => p.id === Number(product_id));
    const data = {
      wishlist: newWishlist
    }
    await this.firebaseService.setWithMerge('users',user.id,data)
    // product.in_wishlist = !product?.in_wishlist;

    return !isExisit;
  }
  isInWishlist(product_id: string,user:User) {
    const wishlist = user?.wishlist ?? []
    const isExisit = wishlist.includes(product_id);
    return isExisit;
  }
}
