import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CreateCategoryDto } from './dto/create-category.dto';
import { GetCategoriesDto } from './dto/get-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import Fuse from 'fuse.js';
import categoriesJson from '../db/categories.json';
import { FirebaseService } from '../firebase/firebase.service';
import { applyCategoryTranslations, getSearchParam, getType } from '../utils/utils';

const categories = plainToClass(Category, categoriesJson);
const options = {
  keys: ['name', 'type.slug'],
  threshold: 0.3,
};
const fuse = new Fuse(categories, options);

@Injectable()
export class CategoriesService {
  constructor(private readonly firebaseService: FirebaseService) {}
  private categories: Category[] = categories;

  async create(createCategoryDto: CreateCategoryDto) {
    const category  = this.prepareCategoryDocument(createCategoryDto);
    const id = await this.firebaseService.addDocument("categories",category)
    // Step 3: If the category has a parent, update the parent's children_ids
    if (createCategoryDto.parent) {
      const parentId = createCategoryDto.parent;

      // Fetch the parent category by its ID
      const parentCategory: Category = await this.firebaseService.getDocumentById('categories', parentId);

      if (parentCategory) {
        // Update the parent's children_ids array, adding the new category's ID
        const updatedChildrenIds = parentCategory.children_ids 
          ? [...parentCategory.children_ids, id] 
          : [id]; // Ensure the array exists

        // Step 4: Update the parent document in Firebase
        await this.firebaseService.updateDocument('categories', parentId, { children_ids: updatedChildrenIds });
      }
    }
    return this.firebaseService.getDocumentById('categories',id)
  }
  prepareCategoryDocument(createCategoryDto: UpdateCategoryDto) {
    const slug = createCategoryDto.slug ? createCategoryDto.slug : this.generateSlug(createCategoryDto.name)
    const type = getType()
    const translations = createCategoryDto.translations ?? {
      en: {
        name: createCategoryDto.name ?? "",
        description: createCategoryDto.details ?? ""
      }
    };
    const category  = {
      icon: createCategoryDto.icon ?? "",
      language: createCategoryDto.language ?? "en",
      name: createCategoryDto.name ?? "",
      details: createCategoryDto.details ?? "",
      image: createCategoryDto.image ?? null,
      parent_id: createCategoryDto.parent ?? null,
      slug: slug,
      translated_languages: ["en"],
      type: type,
      type_id: type.id,
      translations: translations
    }
    return category
  }
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove invalid characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
      .trim();
  }

  async getCategories({ limit, page, search, parent, language }: GetCategoriesDto) {
    const searchName = getSearchParam(search, 'name');
    let cats: Category[] = await this.firebaseService.getCollection('categories');
    const categoryMap = new Map<string, Category>();

    cats.forEach(category => {  
      categoryMap.set(category.id, category);
    });
    
    const mappedCategories = cats.map(category => {
      category = applyCategoryTranslations(category,language);
      if (category.children_ids) {
       category.children = category.children_ids.map(childId => {
          const cat = categoryMap.get(childId)
          return cat;
        }).filter(Boolean);
      } else {
        category.children = [];
      }
      
      return category;
    });
    // console.log('categories =========after', JSON.stringify(mappedCategories, null, 2));
    var filtered = mappedCategories


    if (searchName && searchName !== "") {
      const fuseOptions = {
        keys: ['name'], // Search only by name
        threshold: 0.4, // Fuzziness threshold (lower is stricter)
      };
      const fuse = new Fuse(filtered, fuseOptions);
      const fuseResults = fuse.search(searchName);
      filtered = fuseResults.map(result => this.removeChildrenForSearch(result.item));
    }
    else {
      filtered = parent === undefined ? mappedCategories : mappedCategories.filter(category => {
        console.log('category.parent_id,parent',(category.parent_id),(parent))
        if (parent === 'null') {
          return category.parent_id === null;
        }
        return category.parent_id === parent
      })
    }
    

    return {
      data: filtered,
    };
  }
  removeChildrenForSearch(category: Category) {
    const cat = {...category}
    cat.children = []
    return cat
  }

  async getCategory(param: string, language: string = "en"): Promise<Category> {
    let cats: Category[] = await this.firebaseService.getCollection('categories');
    const categoryMap = new Map<string, Category>();

    cats.forEach(category => {  
      category = applyCategoryTranslations(category,language)
      categoryMap.set(category.id, category); // Store each category by its ID
    });
    // return this.categories.find(
    //   (p) => p.id === (param) || p.slug === param,
    // );
    const res: Category[] = await this.firebaseService.getCollection('categories', ref => ref.where('slug', '==', param).limit(1));
    if(res.length > 0) {
      let cat = res[0]
      cat.parent = { ...categoryMap.get(cat.parent_id), children: undefined };
      cat = applyCategoryTranslations(cat,language)
      return res[0]
    }
    throw new NotFoundException('category not found')
  }

  // async update(id: string, updateCategoryDto: UpdateCategoryDto) {
  //   const category  = {
  //     icon: updateCategoryDto.icon,
  //     language: updateCategoryDto.language,
  //     name: updateCategoryDto.name,
  //     parent_id: updateCategoryDto.parent.id ?? null,
  //     slug: this.generateSlug(updateCategoryDto.name),
  //     translated_languages: ["en"],
  //     type: {id:1, slug: "grocery"},
  //     type_id: 1
  //   }
  //   await this.firebaseService.setWithMerge('categories',id,category)
  //   return this.firebaseService.getDocumentById('categories',id)
  // }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Step 1: Fetch the existing category to check if it has an existing parent
    const existingCategory: Category = await this.firebaseService.getDocumentById('categories', id);
  
    if (!existingCategory) {
      throw new Error('Category not found');
    }
  
    const categoryUpdate = this.prepareCategoryDocument(updateCategoryDto);
    //  {
    //   icon: updateCategoryDto.icon,
    //   language: updateCategoryDto.language,
    //   name: updateCategoryDto.name,
    //   details: updateCategoryDto.details,
    //   image: updateCategoryDto.image,
    //   parent_id: updateCategoryDto.parent ?? null, // New parent_id or null
    //   slug: this.generateSlug(updateCategoryDto.name),
    //   translated_languages: ["en"],
    //   type: { id: 1, slug: "grocery" },
    //   type_id: 1
    // };
  
    // Step 2: Handle parent changes
    const oldParentId = existingCategory.parent_id; // The old parent (if it exists)
    const newParentId = updateCategoryDto.parent ?? null; // The new parent (if provided)
  
    // Step 3: If the parent has changed, update the old and new parents accordingly
    if (oldParentId !== newParentId) {
      // Remove the category from the old parent's children_ids if it had a parent
      if (oldParentId) {
        const oldParentCategory: Category = await this.firebaseService.getDocumentById('categories', oldParentId);
        if (oldParentCategory && oldParentCategory.children_ids) {
          const updatedOldChildrenIds = oldParentCategory.children_ids.filter((childId: string) => childId !== id);
          await this.firebaseService.updateDocument('categories', oldParentId, { children_ids: updatedOldChildrenIds });
        }
      }
  
      // Add the category to the new parent's children_ids if a new parent is provided
      if (newParentId) {
        const newParentCategory: Category = await this.firebaseService.getDocumentById('categories', newParentId);
        if (newParentCategory) {
          const updatedNewChildrenIds = newParentCategory.children_ids 
            ? [...newParentCategory.children_ids, id] 
            : [id]; // Initialize if empty
          await this.firebaseService.updateDocument('categories', newParentId, { children_ids: updatedNewChildrenIds });
        }
      }
    }
  
    // Step 4: Update the category in Firebase with the new data
    await this.firebaseService.setWithMerge('categories', id, categoryUpdate);
  
    // Step 5: Return the updated category
    return this.firebaseService.getDocumentById('categories', id);
  }
  

  // remove(id: string) {
  //   this.firebaseService.removeDocument('categories',id)
  //   return `This action removes a #${id} category`;
  // }
  async remove(id: string) {
    // Step 1: Fetch the category to be removed
    const category: Category = await this.firebaseService.getDocumentById('categories', id);
    
    if (!category) {
      throw new Error(`Category with id #${id} not found`);
    }
  
    // Step 2: If the category has a parent, remove its id from the parent's children_ids
    const parentId = category.parent_id;
    
    if (parentId) {
      const parentCategory: Category = await this.firebaseService.getDocumentById('categories', parentId);
      if (parentCategory && parentCategory.children_ids) {
        const updatedChildrenIds = parentCategory.children_ids.filter((childId: string) => childId !== id);
        await this.firebaseService.updateDocument('categories', parentId, { children_ids: updatedChildrenIds });
      }
    }
  
    // Step 3: If the category has children, handle them (you can either delete or update them)
    const childrenIds = category.children_ids || [];
    
    if (childrenIds.length > 0) {
      for (const childId of childrenIds) {
        // Update children to set their parent_id to null (or you can choose to delete them)
        await this.firebaseService.updateDocument('categories', childId, { parent_id: null });
      }
    }
  
    // Step 4: Remove the category from Firebase
    await this.firebaseService.removeDocument('categories', id);
  
    return `This action removes category #${id}`;
  }
  
}
