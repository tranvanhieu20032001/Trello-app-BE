import { Body, Controller, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../guard';
import { cardDTO } from './dto/card.dto';

@Controller('api/v1/cards')
export class CardsController {
    constructor(private cardService: CardsService) { }

    // @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() cardDTO: cardDTO, @Request() req) {
        return this.cardService.createCard(cardDTO) //req.user.user.id//)
    }

    @Put('move')
    async move(@Body() body: { cardId: string; columnId: string }) {
        const { cardId, columnId } = body;
        return this.cardService.moveCard(cardId, columnId);
    }

    @Put(':id/cover')
    async uploadCover(@Param('id') cardId: string, @Body() body:{filename: string}) {
        console.log("fileName", body.filename);
        
        return this.cardService.uploadCoverCard(cardId, body.filename)
    }

}
