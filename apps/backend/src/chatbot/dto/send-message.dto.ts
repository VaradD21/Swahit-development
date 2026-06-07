import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  sessionId: string | null;

  @IsNotEmpty({ message: 'Message content cannot be empty' })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  mode?: string;
}
