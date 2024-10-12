import { Attachment } from "src/common/entities/attachment.entity";
import { CoreFirebaseEntity } from "src/common/entities/core.entity";

export class Publication extends CoreFirebaseEntity {
    title: string;
    description: string;
    image?: Attachment;
    translations?: {
        [languageCode: string]: {
            name: string;
            description?: string;
        };
    };
}