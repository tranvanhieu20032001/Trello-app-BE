import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class ColumnDTO {
        @IsString()
        @IsNotEmpty()
        title: string

        @IsString()
        @IsNotEmpty()
        boardId: string
}

export class MoveCardBetweenColumnsDTO {
        @IsString()
        @IsNotEmpty()
        activeCardId: string;

        @IsString()
        @IsNotEmpty()
        oldColumnId: string;

        @IsString()
        @IsNotEmpty()
        newColumnId: string;

        @IsArray()
        cardOrderIdsOldColumn: string[];

        @IsArray()
        cardOrderIdsNewColumn: string[];
}