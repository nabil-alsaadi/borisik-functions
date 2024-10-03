import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsDto, ProductPaginator } from './dto/get-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductStatus } from './entities/product.entity';
import productsJson from '../db/products.json';
import popularProductsJson from '../db/popular-products.json';
import bestSellingProductsJson from '../db/best-selling-products.json';
import Fuse from 'fuse.js';
import { GetPopularProductsDto } from './dto/get-popular-products.dto';
import { GetBestSellingProductsDto } from './dto/get-best-selling-products.dto';
import { Category } from '../categories/entities/category.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { applyCategoryTranslations, applyTranslations, getSearchParam, getType } from '../utils/utils';

// const products = plainToClass(Product, productsJson);
const popularProducts = plainToClass(Product, popularProductsJson);
const bestSellingProducts = plainToClass(Product, bestSellingProductsJson);

const options = {
  keys: [
    'name',
    'type.slug',
    'categories.slug',
    'status',
    'shop_id',
    'author.slug',
    'tags',
    'manufacturer.slug',
  ],
  threshold: 0.3,
};
// const fuse = new Fuse(products, options);

@Injectable()
export class ProductsService {
  // private products: any = products;
  private popularProducts: any = popularProducts;
  private bestSellingProducts: any = bestSellingProducts;
  constructor(private readonly firebaseService: FirebaseService) {}

  async create(createProductDto: CreateProductDto) {
    try {
      // Prepare the data for Firebase
      const dataForFirebase = await this.prepareDataForFirebaseCreate(createProductDto);
  
      // Use Firebase service to set the data with merge
      console.log('prepareDataForFirebaseCreate',createProductDto,dataForFirebase)
      var id = await this.firebaseService.addDocument('products',dataForFirebase)

      return this.firebaseService.getDocumentById('products',id)
    } catch (error) {
      console.error(`Failed to create product with ID ${id}:`, error);
      throw new Error(`Unable to update product with ID ${id}`);
    }
  }

  // async getProducts({ search }: GetProductsDto): Promise<any> {
  //   const searchCategory = this.getSearchParam(search, 'categories.slug');
  //   const searchName = this.getSearchParam(search, 'name');
  //   console.log('searchName---------------------', searchName,searchCategory);

  //   const products_: Product[] = await this.firebaseService.getCollection<Product>('products', (ref) =>
  //     searchCategory ? ref.where('categories_ids', 'array-contains', searchCategory) : ref
  //   );
  //   const categories: Category[] = await this.firebaseService.getCollection('categories');
  //   const categoryMap = new Map<string, Category>();

  //   // Populate the map with categories, including their document IDs
  //   categories.forEach(category => {
  //     categoryMap.set(category.id, category); // Store each category by its ID
  //   });

  //   // Now map products to their respective categories using categories_ids
  //   const mappedProducts = products_.map(product => {
  //     if (product.categories_ids) {
  //       // Fetch each category by ID from the categoryMap and assign it to the product's categories array
  //       product.categories = product.categories_ids.map(catId => categoryMap.get(catId)).filter(Boolean);
  //     } else {
  //       product.categories = []; // Ensure it has an empty categories array if there are no categories
  //     }

  //     return product;
  //   });

  //   return {
  //     data: mappedProducts,
  //   };
  // }

  async getProducts({ search, language }: GetProductsDto): Promise<any> {
    const searchCategory = getSearchParam(search, 'categories.slug');
    const searchName = getSearchParam(search, 'name');
    const searchStatus = getSearchParam(search, 'status');
    
    // Load all products and categories
    const products_: Product[] = await this.firebaseService.getCollection<Product>('products');
    const categories: Category[] = await this.firebaseService.getCollection('categories');
    
    // Create a category map for easier access
    const categoryMap = new Map<string, Category>();
    categories.forEach(category => { 
      category = applyCategoryTranslations(category,language);
      categoryMap.set(category.id, category)
    });
  
    // Map products to their respective categories
    const mappedProducts = products_.map(product => {
      product = applyTranslations(product, language);

      if (product.categories_ids) {
        product.categories = product.categories_ids.map(catId => categoryMap.get(catId)).filter(Boolean);
      } else {
        product.categories = [];
      }
      return product;
    });

    // console.log('mappedProducts===========',mappedProducts)
  
    // If there's no search, return all products
    if (!searchName && !searchCategory && !searchStatus) {
      return {
        data: mappedProducts,
      };
    }
  
    let filteredProducts = mappedProducts;
  
    // Apply category filtering manually
    // if (searchCategory) {
    //   filteredProducts = filteredProducts.filter(product =>
    //     product.categories_ids.includes(searchCategory)
    //   );
    // }
    if (searchCategory) {
      filteredProducts = filteredProducts.filter(product =>
        product.categories.some(cat => cat?.slug === searchCategory)
      );
    }
    console.log('search ======================status',searchStatus)
    if (searchStatus) {
      filteredProducts = filteredProducts.filter(product =>
        product.status === searchStatus
      );
    }
  
    // Set up Fuse.js options for fuzzy searching on product name only
    const fuseOptions = {
      keys: ['name'], // We only need to search by name here
      threshold: 0.4, // Adjust based on how fuzzy you want the search to be
    };
  
    const fuse = new Fuse(filteredProducts, fuseOptions);
  
    // Apply Fuse.js fuzzy search by name
    if (searchName) {
      const fuseResults = fuse.search(searchName);
      filteredProducts = fuseResults.map(result => result.item);
    }
  
    return {
      data: filteredProducts,
    };
  }
  

  async getProductBySlug(slug: string, lang: string = "en"): Promise<Product> {
    const products = await this.firebaseService.getCollection('products', ref => ref.where('slug', '==', slug).limit(1));
    const categories: Category[] = await this.firebaseService.getCollection('categories');
    if (products.length === 0) {
      throw new Error('Product not found');
    }
    let product_ = products[0] as Product
    product_.categories = categories.filter((category) => product_.categories_ids.includes(category.id)) // complete this 
    product_.categories.map((category) => applyCategoryTranslations(category,lang) )
    product_ = applyTranslations(product_, lang);
    const related: Product[] = product_.categories_ids && product_.categories_ids.length < 1 ? [] :  await this.firebaseService.getCollection('products', ref =>
      ref
        .where('categories_ids', 'array-contains-any', product_.categories_ids) // Match any common category IDs
        .limit(5)
    );

    const related_products = related.filter(p => p.slug !== product_.slug);

    return {
      ...product_,
      related_products,
    };
  }

  async getPopularProducts({ limit, type_slug }: GetPopularProductsDto,language = 'en'): Promise<Product[]> {
    let products = await this.getProducts({language});
    return products.data.slice(0, limit);
  }
  async getBestSellingProducts({ limit, type_slug }: GetBestSellingProductsDto,language = 'en'): Promise<Product[]> {
    let products = await this.getProducts({language});
    return products.data.slice(0, limit);
  }

  async getProductsStock({ limit, page, search }: GetProductsDto): Promise<any> {
    // if (!page) page = 1;
    // if (!limit) limit = 30;
    // const startIndex = (page - 1) * limit;
    // const endIndex = page * limit;
    // let data: Product[] = this.products.filter((item) => item.quantity <= 9);

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
    // const url = `/products-stock?search=${search}&limit=${limit}`;
    // return {
    //   data: results,
    //   ...paginate(data.length, page, limit, results.length, url),
    // };

    const {data}: any = await this.getProducts({search})
    console.log('data -----------',data)
    const drafts = data.filter((p: Product) => p.quantity <= 9)
    console.log('drafts',drafts)
    return {
      data: drafts,
    };
  }

  async getDraftProducts({ limit, page, search }: GetProductsDto): Promise<any> {
    // if (!page) page = 1;
    // if (!limit) limit = 30;
    // const startIndex = (page - 1) * limit;
    // const endIndex = page * limit;
    // let data: Product[] = this.products.filter(
    //   (item) => item.status === 'draft',
    // );

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
    // const url = `/draft-products?search=${search}&limit=${limit}`;
    // return {
    //   data: results,
    //   ...paginate(data.length, page, limit, results.length, url),
    // };

    // const {data}: any = await this.getProducts({search})
    // console.log('data -----------',data)
    // const drafts = data.filter((p: Product) => p.status === ProductStatus.DRAFT)
    // console.log('drafts',drafts)
    // return {
    //   data: drafts,
    // };
    return await this.getProducts({search})
  }

  // update(id: number, updateProductDto: UpdateProductDto) {
  //  this.firebaseService.setWithMerge()
  // }
  async update(id: string, updateProductDto: UpdateProductDto): Promise<void> {
    try {
      // Prepare the data for Firebase
      const dataForFirebase = await this.prepareDataForFirebaseCreate(updateProductDto);
  
      // Use Firebase service to set the data with merge
      await this.firebaseService.setWithMerge('products', id, dataForFirebase);
      console.log(`Product with ID ${id} updated successfully.`);

      return this.firebaseService.getDocumentById('products',id)
    } catch (error) {
      console.error(`Failed to update product with ID ${id}:`, error);
      throw new Error(`Unable to update product with ID ${id}`);
    }
  }
  


  async slugExists(slug: string): Promise<boolean> {
    // Query your Firebase collection to check if a product with the same slug exists
    const products: Product[] = await this.firebaseService.getCollection('products');
    return products.some(product => product.slug === slug);
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove invalid characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
      .trim();
  }
  async generateUniqueSlug(name: string): Promise<string> {
    let slug = this.generateSlug(name); // Generate the initial slug
    let isUnique = await this.slugExists(slug);
    let counter = 1;
  
    // Loop to generate a unique slug if necessary
    while (isUnique) {
      const newSlug = `${slug}-${counter}`;
      isUnique = await this.slugExists(newSlug); // Check again with the modified slug
      counter++;
      slug = newSlug; // Update slug with the new slug
    }
  
    return slug;
  }

  async prepareDataForFirebaseCreate(updateProductDto: UpdateProductDto): Promise<any> {
    const slug = updateProductDto.slug
    ? updateProductDto.slug
    : await this.generateUniqueSlug(updateProductDto.name);

    const translations = updateProductDto.translations ?? {
      en: {
        name: updateProductDto.name ?? "",
        description: updateProductDto.description ?? ""
      }
    };
    const type = getType()
    var dataForFirebase = {
      name: updateProductDto.name ?? "", // From DTO
      description: updateProductDto.description ?? "", // From DTO
      price: updateProductDto.price ?? 0, // From DTO
      sale_price: updateProductDto.sale_price ?? null, // From DTO
      quantity: updateProductDto.quantity ?? 0, // From DTO
      sku: updateProductDto.sku ?? 1, // From DTO
      status: updateProductDto.status ?? ProductStatus.PUBLISH, // From DTO
      slug: slug, // From DTO
      unit: updateProductDto.unit ?? "", // From DTO
      product_type: updateProductDto.product_type ?? "simple", // From DTO
      // is_digital: updateProductDto.is_digital ? 1 : 0, // Convert to 0/1 for Firebase
      categories_ids: updateProductDto.categories ?? [], // Mapped category IDs
      image: updateProductDto.image ?? null, // Assuming the image structure is the same
      gallery: updateProductDto.gallery || [], // Use empty array if no gallery is provided
      shop_id: updateProductDto.shop_id ?? 6, // From DTO
      type_id: type.id, // From DTO
      type: type,
      language: updateProductDto.language ?? "en", // From DTO
      translated_languages: ['en'], // Fallback to 'en'
      in_wishlist: updateProductDto.in_wishlist || false, // Default to false if not provided
      translations: translations,
    };
  
    return dataForFirebase;
  }
  // async prepareDataForFirebase(updateProductDto: UpdateProductDto): Promise<any> {
  //   var dataForFirebase = {
  //     name: updateProductDto.name, // From DTO
  //     description: updateProductDto.description, // From DTO
  //     price: updateProductDto.price, // From DTO
  //     sale_price: updateProductDto.sale_price, // From DTO
  //     quantity: updateProductDto.quantity, // From DTO
  //     sku: updateProductDto.sku, // From DTO
  //     status: updateProductDto.status, // From DTO
  //     slug: updateProductDto.slug, // From DTO
  //     unit: updateProductDto.unit, // From DTO
  //     product_type: updateProductDto.product_type, // From DTO
  //     // is_digital: updateProductDto.is_digital ? 1 : 0, // Convert to 0/1 for Firebase
  //     categories_ids: updateProductDto.categories, // Mapped category IDs
  //     image: updateProductDto.image, // Assuming the image structure is the same
  //     gallery: updateProductDto.gallery || [], // Use empty array if no gallery is provided
  //     shop_id: updateProductDto.shop_id, // From DTO
  //     // type_id: updateProductDto.type_id, // From DTO
  //     language: updateProductDto.language, // From DTO
  //     // translated_languages: updateProductDto.translated_languages || ['en'], // Fallback to 'en'
  //     in_wishlist: updateProductDto.in_wishlist || false, // Default to false if not provided
  //   };
  
  //   return dataForFirebase;
  // }
  

  async remove(id: string) {
    // Assuming you have a collection name (for example, 'products')
    const collectionName = 'products';
    
    // Call the removeDocument method from FirebaseService to delete the document
    await this.firebaseService.removeDocument(collectionName, id);
    
    return `This action removed the product with id #${id}`;
  }
}
