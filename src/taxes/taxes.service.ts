import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Tax } from './entities/tax.entity';

@Injectable()
export class TaxesService {
  private collectionName = 'taxes';

  constructor(private readonly firebaseService: FirebaseService) {}

  // Create a new tax in Firestore
  async create(createTaxDto: CreateTaxDto): Promise<Tax> {
    const id = await this.firebaseService.addDocument(this.collectionName, createTaxDto);
    return this.firebaseService.getDocumentById<Tax>(this.collectionName, id);
  }

  // Get all taxes from Firestore
  async findAll(): Promise<Tax[]> {
    return this.firebaseService.getCollection<Tax>(this.collectionName);
  }

  // Get a single tax by ID from Firestore
  async findOne(id: number): Promise<Tax | null> {
    return this.firebaseService.getDocumentById<Tax>(this.collectionName, id.toString());
  }

  // Update a tax by ID in Firestore
  async update(id: number, updateTaxDto: UpdateTaxDto): Promise<Tax> {
    await this.firebaseService.updateDocument(this.collectionName, id.toString(), updateTaxDto);
    return this.firebaseService.getDocumentById<Tax>(this.collectionName, id.toString());
  }

  // Delete a tax by ID in Firestore
  async remove(id: number): Promise<void> {
    return this.firebaseService.removeDocument(this.collectionName, id.toString());
  }
}
