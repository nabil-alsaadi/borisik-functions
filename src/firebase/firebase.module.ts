// import { Module, Global } from '@nestjs/common';
// import * as admin from 'firebase-admin';
// import { FirebaseService } from './firebase.service';

// @Global()
// @Module({
//   providers: [
//     {
//       provide: 'FIREBASE_ADMIN',
//       useFactory: () => {
//         return admin.initializeApp({
//           credential: admin.credential.cert({
//             projectId: process.env.MY_FIREBASE_PROJECT_ID,
//             clientEmail: process.env.MY_FIREBASE_CLIENT_EMAIL,
//             privateKey: process.env.MY_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//           }),
//           databaseURL: `https://${process.env.MY_FIREBASE_PROJECT_ID}.firebaseio.com`,
//           storageBucket: process.env.MY_FIREBASE_STORAGE_BUCKET,
//         });
//       },
//     },
//     FirebaseService,
//   ],
//   exports: ['FIREBASE_ADMIN', FirebaseService],
// })
// export class FirebaseModule {}
import * as dotenv from 'dotenv';
dotenv.config();
import { Module, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from './firebase.service';
import { FIREBASE_STORAGE_BUCKET } from '../utils/config.util';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: async () => {
        
        if (process.env.FUNCTIONS_EMULATOR) {
          // Running in the Firebase Emulator, use service-account.json for local credentials
          console.log('Running in Firebase Emulator');
          return admin.initializeApp({
            credential: admin.credential.cert(require('../../service-account.json')),
            databaseURL: `https://${process.env.MY_FIREBASE_PROJECT_ID}.firebaseio.com`,
            storageBucket: process.env.MY_FIREBASE_STORAGE_BUCKET,
          });
        } else {
          // Running in Firebase Cloud (production), use default credentials
          console.log('Running in Production');
          return admin.initializeApp({
            storageBucket: FIREBASE_STORAGE_BUCKET, // Optionally specify storageBucket
          });
        }
      },
    },
    FirebaseService,
  ],
  exports: ['FIREBASE_ADMIN', FirebaseService],
})
export class FirebaseModule {}
