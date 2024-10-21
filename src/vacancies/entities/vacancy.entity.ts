import { CoreFirebaseEntity } from "../../common/entities/core.entity";

export class Vacancy extends CoreFirebaseEntity {
    id: string;
    title?: string;
    description?: string;
    requirements?: string[];
    location: string;
    translations?: {
      [languageCode: string]: {
          title: string;
          description?: string;
          requirements: string[];
      };
  };
  }