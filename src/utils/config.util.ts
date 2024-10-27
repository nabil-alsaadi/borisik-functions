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

export const FIREBASE_STORAGE_BUCKET="borisik-products.appspot.com"
export const JWT_SECRET = "your_jwt_secret_value"
export const DEFUALT_CURRENCY = "AED"
export const MY_FIREBASE_PROJECT_ID = "borisik-products"


export const EMAIL_VERIFICATION_LINK = "https://redcaviar.ae/email-verification?token="

export const GMAIL_USER = ""
export const GMAIL_PASS = ""
export const SUPPORT_EMAIL = ""
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
