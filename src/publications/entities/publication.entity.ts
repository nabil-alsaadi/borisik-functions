import { Attachment } from "../../common/entities/attachment.entity";
import { CoreFirebaseEntity } from "../../common/entities/core.entity";

export class Publication extends CoreFirebaseEntity {
    title: string;
    description: string;
    image?: Attachment;
    translations?: {
        [languageCode: string]: {
            title: string;
            description: string;
        };
    };
}