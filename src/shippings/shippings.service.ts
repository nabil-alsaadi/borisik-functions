import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateShippingDto } from './dto/create-shipping.dto';
import { GetShippingsDto } from './dto/get-shippings.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { Shipping } from './entities/shipping.entity';

@Injectable()
export class ShippingsService {
  private collectionName = 'shippings';

  constructor(private readonly firebaseService: FirebaseService) {}

  // Create a new shipping record in Firestore
  async create(createShippingDto: CreateShippingDto): Promise<Shipping> {
    const id = await this.firebaseService.addDocument(this.collectionName, createShippingDto);
    return this.firebaseService.getDocumentById<Shipping>(this.collectionName, id);
  }

  // Get all shipping records from Firestore
  async getShippings(getShippingsDto: GetShippingsDto): Promise<Shipping[]> {
    return this.firebaseService.getCollection<Shipping>(this.collectionName);
  }

  // Get a single shipping record by ID from Firestore
  async findOne(id: number): Promise<Shipping | null> {
    return this.firebaseService.getDocumentById<Shipping>(this.collectionName, id.toString());
  }

  // Update a shipping record by ID in Firestore
  async update(id: number, updateShippingDto: UpdateShippingDto): Promise<Shipping> {
    await this.firebaseService.updateDocument(this.collectionName, id.toString(), updateShippingDto);
    return this.firebaseService.getDocumentById<Shipping>(this.collectionName, id.toString());
  }

  // Delete a shipping record by ID in Firestore
  async remove(id: number): Promise<void> {
    return this.firebaseService.removeDocument(this.collectionName, id.toString());
  }
}
