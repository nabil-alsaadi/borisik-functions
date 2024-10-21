import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';
import { Vacancy } from './entities/vacancy.entity';

@Injectable()
export class VacanciesService {
  private collectionName = 'vacancies';  // Firestore collection name
  private applyCollectionName = 'applications';

  constructor(private readonly firebaseService: FirebaseService) {}

  // Get all vacancies
  async findAll(): Promise<Vacancy[]> {
    return this.firebaseService.getCollection<Vacancy>(this.collectionName);
  }

  // Get a single vacancy by ID
  async findOne(id: string): Promise<Vacancy> {
    const vacancy = await this.firebaseService.getDocumentById<Vacancy>(this.collectionName, id);
    if (!vacancy) {
      throw new NotFoundException(`Vacancy with ID ${id} not found`);
    }
    return vacancy;
  }

  // Create a new vacancy
  async create(createVacancyDto: CreateVacancyDto): Promise<Vacancy> {
    const id = await this.firebaseService.addDocument(this.collectionName, createVacancyDto);
    return this.findOne(id);  // Return the newly created vacancy
  }

  // Update an existing vacancy
  async update(id: string, updateVacancyDto: UpdateVacancyDto): Promise<Vacancy> {
    await this.firebaseService.setWithMerge(this.collectionName, id, updateVacancyDto);
    return this.findOne(id);  // Return the updated vacancy
  }

  // Delete a vacancy by ID
  async remove(id: string): Promise<void> {
    const vacancy = await this.findOne(id);  // Ensure the vacancy exists
    if (!vacancy) {
      throw new NotFoundException(`Vacancy with ID ${id} not found`);
    }
    return this.firebaseService.removeDocument(this.collectionName, id);
  }
}
