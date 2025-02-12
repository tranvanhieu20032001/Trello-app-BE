import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class BoardDTO{
    @IsString()
    @IsNotEmpty()
    title:string

    @IsString()
    description?:string;

    @IsString()
    type?:string;
}