import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LabelDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  boardId: string;
}
