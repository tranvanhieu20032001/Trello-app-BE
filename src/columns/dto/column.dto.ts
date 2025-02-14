import { IsNotEmpty, IsString } from "class-validator";

export class ColumnDTO{
        @IsString()
        @IsNotEmpty()
        title:string

        @IsString()
        @IsNotEmpty()
        boardId:string
}