import { CoreFirebaseEntity } from "../../common/entities/core.entity";
import { Attachment } from "../../common/entities/attachment.entity";
import { Vacancy } from "../../vacancies/entities/vacancy.entity";


export class VacancyApplication extends CoreFirebaseEntity {
  name: string;
  email: string;
  phone: string;
  resume: Attachment;
  coverLetter: string;
  vacancy: Vacancy
}