import { IsNotEmpty, IsString } from "class-validator";

 export class cardDTO{
    @IsString()
    @IsNotEmpty()
    title:string

    @IsString()
    @IsNotEmpty()
    columnId:string

    @IsString()
    @IsNotEmpty()
    boardId:string
 }