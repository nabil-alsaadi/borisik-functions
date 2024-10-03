import { Module } from '@nestjs/common';
import { MyWishlistsController } from './my-wishlists.controller';
import { MyWishlistService } from './my-wishlists.service';
import { WishlistsController } from './wishlists.controller';
import { WishlistsService } from './wishlists.service';
import { ProductsService } from '../products/products.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [WishlistsController, MyWishlistsController],
  providers: [WishlistsService, MyWishlistService,ProductsService,FirebaseService],
})
export class WishlistsModule {}
