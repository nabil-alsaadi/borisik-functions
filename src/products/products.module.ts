import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  ProductsController,
  PopularProductsController,
  ProductsStockController,
  DraftProductsController,
  BestSellingProductsController,
} from './products.controller';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [
    ProductsController,
    PopularProductsController,
    BestSellingProductsController,
    ProductsStockController,
    DraftProductsController,
  ],
  providers: [ProductsService, FirebaseService],
})
export class ProductsModule {}
