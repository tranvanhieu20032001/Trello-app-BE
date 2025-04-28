import { Body, Controller, Delete, Param, Patch, Post, Put, Request, UseGuards, } from '@nestjs/common';
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
    async uploadCover(@Param('id') cardId: string, @Body() body: { filename: string }) {
        return this.cardService.uploadCoverCard(cardId, body.filename)
    }

    @Post(':id/checklist')
    async createCheckList(@Param('id') cardId: string, @Body() body: { title: string }) {
        return this.cardService.createCheckList(cardId, body.title)
    }

    @Post("checklist/add")
    async addChecklistItem(@Body() body: { checkListId, text }) {
        return this.cardService.addItemToCheckList(body.checkListId, body.text)
    }

    @Put("checklist/toggle")
    async toggleItem(@Body() body: { itemId }) {
        return this.cardService.toggleChecklistItem(body.itemId)
    }

    @Delete('/checklist/:id')
    async removeCheckList(@Param('id') cardId: string) {
        return this.cardService.removeCheckList(cardId)
    }

    @Delete('/checklist/item/:id')
    async removeCheckListItem(@Param('id') itemId: string) {
        return this.cardService.removeCheckListItem(itemId)
    }

    @Put(":id/dates")
    async editDates(@Param("id") cardId: string, @Body() body: { start, due }) {
        return this.cardService.editDates(cardId, body.start, body.due)
    }
    @Post(":id/complete")
    async complete(@Param("id") cardId: string, @Body() body: { iscomplete }) {
        return this.cardService.completeCard(cardId, body.iscomplete)
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/join')
    async join(@Param('id') cardId: string, @Request() req) {
        const userId = req.user.user.id
        return this.cardService.joinCard(cardId, userId)
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/leave')
    async leave(@Param('id') cardId: string, @Request() req) {
        const userId = req.user.user.id
        return this.cardService.leaveCard(cardId, userId)
    }
    @Post(':id/member')
    async add(@Param('id') cardId: string, @Body() body: { userId }) {
        return this.cardService.addMemberToCard(cardId, body.userId)
    }

    @Patch(':id/member')
    async remove(@Param('id') cardId: string, @Body() body: { userId }) {
        console.log("userId", body.userId);
        
        return this.cardService.removeMemberFromCard(cardId, body.userId)
    }
}
