import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { getSearchParam } from '../utils/utils';
import * as admin from 'firebase-admin';
import { paginate } from '../common/pagination/paginate';
import { VacancyApplication } from './entities/application.entity';
import { ApplyVacancyDto } from './dto/apply-vacancy.dto';
import { ApplicationPaginator, GetApplicationDto } from './dto/get-applications.dto';
@Injectable()
export class ApplicationsService {
  private collectionName = 'vacancies';  // Firestore collection name
  private applyCollectionName = 'applications';

  constructor(private readonly firebaseService: FirebaseService) {}

//   async apply(application: ApplyVacancyDto): Promise<VacancyApplication> {
    
//     const id = await this.firebaseService.addDocument(this.applyCollectionName,application);
//     return await this.firebaseService.getDocumentById(this.applyCollectionName,id);
//   }
async apply(application: ApplyVacancyDto): Promise<VacancyApplication> {
    // Convert name and email to lowercase for case-insensitive searching
    const processedApplication = {
      ...application,
      name_lowercase: application.name.toLowerCase()
    };

    // Store the document with the lowercase fields
    const id = await this.firebaseService.addDocument(this.applyCollectionName, processedApplication);

    // Retrieve the newly created document by ID
    return await this.firebaseService.getDocumentById(this.applyCollectionName, id);
}

  async getApplications({ limit,
    page,
    orderBy,
    sortedBy,
    search
    }: GetApplicationDto): Promise<ApplicationPaginator> {
    if (!page) page = 1;
    if (!limit || isNaN(limit)) {
      limit = 15; // Default limit value
    } else {
      limit = +limit // Ensure it's an integer
    }
    const name = getSearchParam(search,'name')
    const email = getSearchParam(search,'email')
    const vacancyId = getSearchParam(search,'vacancy')

    const applicationCollection = this.firebaseService.firestore.collection(this.applyCollectionName);
    let query: admin.firestore.Query = applicationCollection;
    console.log('name ===============',name)
    if (name && name !== "") {
        const lowerCaseName = name.toLowerCase();
        query = query
          .where('name_lowercase', '>=', lowerCaseName)
          .where('name_lowercase', '<=', lowerCaseName + '\uf8ff');
    }

    // // Handle filtering by email if provided
    // if (email && email !== "") {
    //     query = query.where('email', '>=', email).where('email', '<=', email + '\uf8ff');
    // }

    if(vacancyId && vacancyId !== "") {
        query = query.where('vacancy.id', '==', vacancyId)
    }

    const fieldToOrderBy = 'created_at';
    const sortDirection = sortedBy === 'asc' ? 'asc' : 'desc';

    query = query.orderBy(fieldToOrderBy, sortDirection);

    const fetchLimit = limit * page;
    query = query.limit(fetchLimit);

    const vacancySnapshot = await query.get();
    const applications = vacancySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
    } as unknown as VacancyApplication));
    console.log('applications =============',applications)
    const startIndex = (page - 1) * limit;
    const paginatedApplication = applications.slice(startIndex, startIndex + limit);
  
    // Get total number of orders
    const totalApplications = await applicationCollection.get().then(snapshot => snapshot.size);
  
    const url = `/applications?limit=${limit}`;

    return {
        data: paginatedApplication,
        ...paginate(totalApplications, page, limit, paginatedApplication.length, url),
      };
  }
  async getApplication(id: string): Promise<VacancyApplication> {
    return await this.firebaseService.getDocumentById(this.applyCollectionName,id);
  } 
}
