import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service'; // Assuming you have a FirebaseService
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { GetPublicationDto } from './dto/get-publications.dto';
import { getSearchParam } from '../utils/utils';
import * as admin from 'firebase-admin';

@Injectable()
export class PublicationsService {
  private readonly collectionName = 'publications';

  constructor(private readonly firebaseService: FirebaseService) {}

//   async findAll({
//     limit,
//     page,
//   }): Promise<any[]> {
//     return this.firebaseService.getCollection(this.collectionName);
//   }

async findAll({
    limit,
    page,
    orderBy,
    sortedBy,
    search,
    language
  }: GetPublicationDto): Promise<any> {
    // Default page and limit values
    if (!page) page = 1;
    if (!limit || isNaN(limit)) {
      limit = 15; // Default limit
    } else {
      limit = +limit; // Ensure limit is a number
    }
    const name = getSearchParam(search,'name')
    console.log('name======',name)
    // Firestore reference to the publications collection
    const publicationCollection = this.firebaseService.firestore.collection(this.collectionName);
  
    let query: admin.firestore.Query = publicationCollection;
  
    // Handle filtering by name if provided
    // if (name) {
    //   // You can modify the field name based on how it's stored in Firestore
    //   query = query.where('name', '>=', name).where('name', '<=', name + '\uf8ff');
    // }
    // if (name && language) {
    //   const titleField = `translations.${language}.title`;
    //   query = query.where(titleField, '>=', name).where(titleField, '<=', name + '\uf8ff');
    // }


    // if (orderBy === 'title') {
    //   orderBy = `translations.${language}.title`
    // }
    // Handle sorting
    const fieldToOrderBy = orderBy || 'created_at'; // Default to created_at if orderBy is not provided
    const sortDirection = sortedBy === 'asc' ? 'asc' : 'desc'; // Default to descending order if not provided
  
    query = query.orderBy(fieldToOrderBy, sortDirection);
  
    // Limit the documents based on pagination
    const fetchLimit = limit * page;
    query = query.limit(fetchLimit);
  
    // Fetch the documents from Firestore
    const publicationSnapshot = await query.get();
    const allPublications = publicationSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  
    // Calculate the slice for the requested page
    const startIndex = (page - 1) * limit;
    const paginatedPublications = allPublications.slice(startIndex, startIndex + limit);
  
    // Get the total number of documents in the collection
    const totalPublications = await publicationCollection.get().then((snapshot) => snapshot.size);
  
    // Return the paginated result with metadata
    return {
      data: paginatedPublications,
      totalItems: totalPublications,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalPublications / limit),
    };
  }
  

  async findOne(id: string): Promise<any> {
    const publication = await this.firebaseService.getDocumentById(this.collectionName, id);
    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
    return publication;
  }

  async findOneBySlug(slug: string): Promise<any> {
    // Use the FirebaseService to query the collection by 'slug'
    const publications = await this.firebaseService.getCollection(this.collectionName, (ref) => {
      return ref.where('slug', '==', slug).limit(1);
    });
  
    // Check if any publication was found
    if (publications.length === 0) {
      throw new NotFoundException(`Publication with slug '${slug}' not found`);
    }
  
    // Return the first publication found (should be only one due to limit(1))
    return publications[0];
  }
  
  

  async create(createPublicationDto: CreatePublicationDto): Promise<string> {
    return this.firebaseService.addDocument(this.collectionName, createPublicationDto);
  }

  async update(id: string, updatePublicationDto: UpdatePublicationDto): Promise<void> {
    const publication = await this.findOne(id);
    console.log('publication==============',publication,id,updatePublicationDto)
    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
    console.log('publication',publication,updatePublicationDto)
    await this.firebaseService.setWithMerge(this.collectionName, id, updatePublicationDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const publication = await this.findOne(id);
    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
    await this.firebaseService.removeDocument(this.collectionName, id);
  }
}
