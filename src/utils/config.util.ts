import * as dotenv from 'dotenv';
import { defineSecret } from 'firebase-functions/params';
dotenv.config();

// Define Firebase Secrets
// export const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY');

// export const FIREBASE_PROJECT_ID = defineSecret('MY_FIREBASE_PROJECT_ID');
// export const FIREBASE_STORAGE_BUCKET = defineSecret('MY_FIREBASE_STORAGE_BUCKET');
// export const FIREBASE_STORAGE_BUCKET="borisik-products.appspot.com"
// export const JWT_SECRET = defineSecret('JWT_SECRET');
// export const DEFUALT_CURRENCY = "AED"

export const FIREBASE_PROJECT_ID = "borisik-products"
export const STRIPE_API_KEY = "sk_test_51Pux7c2NkYjLD9z2kPbGpwrB6QqYn7j2Dy3ixL2SJoLWT99EEdwfTXcmd0NqyfQDyxZtx4P62iGPkzwGlutxVHhy001g5zGgCd";
export const FIREBASE_STORAGE_BUCKET="borisik-products.appspot.com"
export const JWT_SECRET = "your_jwt_secret_value"
export const DEFUALT_CURRENCY = "AED"
// const isEmulator = process.env.FUNCTIONS_EMULATOR;

// export const getConfig = () => {
//   if (isEmulator) {
//     // Local development: Use process.env from .env file
//     return {
//       defaultCurrency: 'AED',
//       stripeApiKey: process.env.STRIPE_API_KEY || '',
//       firebaseProjectId: process.env.MY_FIREBASE_PROJECT_ID || '',
//       firebaseStorageBucket: process.env.MY_FIREBASE_STORAGE_BUCKET || '',
//       jwtSecret: process.env.JWT_SECRET || '',
//     };
//   } else {
//     // Production: Use Firebase Secrets
//     return {
//       defaultCurrency: 'AED', // Set default if needed
//       stripeApiKey: stripeApiKey.value(), // Get secret value
//       firebaseProjectId: firebaseProjectId.value(),
//       firebaseStorageBucket: firebaseStorageBucket.value(),
//       jwtSecret: jwtSecret.value(),
//     };
//   }
// };
