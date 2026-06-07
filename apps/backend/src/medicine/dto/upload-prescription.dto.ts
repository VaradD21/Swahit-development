import { IsUrl, Matches } from 'class-validator';

export class UploadPrescriptionDto {
  @IsUrl({}, { message: 'fileUrl must be a valid URL' })
  @Matches(/^(https:\/\/)/, { message: 'fileUrl must use HTTPS secure protocol' })
  fileUrl: string;
}
