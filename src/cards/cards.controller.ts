import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../guard';
import { cardDTO } from './dto/card.dto';

@Controller('api/v1/cards')
export class CardsController {
    constructor(private cardService: CardsService){}

    // @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() cardDTO:cardDTO, @Request() req){
        return this.cardService.createCard(cardDTO) //req.user.user.id//)
    }

}
