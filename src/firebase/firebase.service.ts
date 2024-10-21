import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  firestore: admin.firestore.Firestore;

  constructor(@Inject('FIREBASE_ADMIN') private readonly firebaseApp: admin.app.App) {
    this.firestore = this.firebaseApp.firestore();
  }
  async getCollection<T>(collectionName: string, queryFn?: (ref: admin.firestore.CollectionReference) => admin.firestore.Query): Promise<T[]> {
    let collectionRef = this.firestore.collection(collectionName);

    // If a query function is provided, apply it to the collection reference
    let query = queryFn ? queryFn(collectionRef) : collectionRef;

    const snapshot = await query.get();
  
    // Ensure that the returned data includes all required fields
    return snapshot.docs.map(
        doc => 
            ({
                ...doc.data(),
                id: doc.id,
                // Spread the Firestore document data into the object
            } as unknown as T)
    );
  }

  // Function to add a document to Firestore
  async addDocument(collectionName: string, data: any) {
    const timestamp = new Date();
    const docRef = await this.firestore.collection(collectionName).add({
      ...data,
      created_at: timestamp.toISOString(),
      updated_at: timestamp.toISOString()
    });
    return docRef.id;
  }
  
  async getDocumentById<T>(collectionName: string, docId: string): Promise<T | null> {
    const docRef = this.firestore.collection(collectionName).doc(docId);
    const docSnapshot = await docRef.get();
  
    if (!docSnapshot.exists) {
      return null; // Document not found
    }
  
    // Cast the document data to `unknown` first, and then to `T`
    return { ...docSnapshot.data(), id: docId } as unknown as T;
  }

  async updateDocument<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    const docRef = this.firestore.collection(collectionName).doc(docId);
  
    // Update the document with the new data
    await docRef.update(data);
  }

  async setWithMerge<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    const timestamp = new Date().toISOString();
    const docRef = this.firestore.collection(collectionName).doc(docId);
    await docRef.set({...data, updated_at: timestamp}, { merge: true }); // Use merge to update only the fields provided
  }

  async uploadFile(file: Express.Multer.File,fileDir: string = 'attachments'): Promise<string> {
    const bucket = admin.storage().bucket();
    const fileName = `${fileDir}/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    await fileUpload.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    return publicUrl;
  }

  async removeDocument(collectionName: string, docId: string): Promise<void> {
    const docRef = this.firestore.collection(collectionName).doc(docId);
    await docRef.delete();
  }
  
}
