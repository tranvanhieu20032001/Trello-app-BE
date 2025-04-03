import { IsNotEmpty, IsString } from "class-validator";

export class BoardDTO{
    @IsString()
    @IsNotEmpty()
    title:string

    @IsNotEmpty()
    @IsString()
    background?:string;

    @IsNotEmpty()
    @IsString()
    workspaceId?:string;

    @IsString()
    type?:string;
}