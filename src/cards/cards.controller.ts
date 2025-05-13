import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Request, UseGuards, } from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../guard';
import { cardDTO } from './dto/card.dto';


@Controller('api/v1/cards')
export class CardsController {
    constructor(private cardService: CardsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() cardDTO: cardDTO, @Request() req) {
        const userId = req.user.user.id
        return this.cardService.createCard(cardDTO, userId)
    }

    @Get(":id")
    async getCardById(@Param("id") cardId: string) {
        return this.cardService.getCardById(cardId)
    }


    @Put(":cardId/rename")
    async rename(@Param("cardId") cardId: string, @Body() body: { newTitle: string }) {
        return this.cardService.updateCardTitle(cardId, body.newTitle)
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

    @UseGuards(JwtAuthGuard)
    @Put(':id/attachment')
    async uploadAttachment(@Param('id') cardId: string, @Body() body: { filePaths: string[] }, @Request() req) {
        const userId = req.user.user.id
        return this.cardService.uploadAttachmentPath(cardId, body.filePaths, userId)

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

    @UseGuards(JwtAuthGuard)
    @Post(":id/complete")
    async complete(@Param("id") cardId: string, @Body() body: { iscomplete }, @Request() req) {
        const userId = req.user.user.id
        return this.cardService.completeCard(cardId, body.iscomplete, userId)
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

    @UseGuards(JwtAuthGuard)
    @Post(':id/member')
    async add(@Param('id') cardId: string, @Body() body: { userId }, @Request() req) {
        const ownerId = req.user.user.id
        return this.cardService.addMemberToCard(cardId, body.userId, ownerId)
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/member')
    async remove(@Param('id') cardId: string, @Body() body: { userId }, @Request() req) {
        const actorId = req.user.user.id
        return this.cardService.removeMemberFromCard(cardId, body.userId, actorId)
    }

    @Put("/:id/description")
    async uploadDescription(@Param("id") cardId: string, @Body() body: { content }) {
        return this.cardService.uploadDescripton(cardId, body.content)
    }

    @UseGuards(JwtAuthGuard)
    @Post(":id/comment")
    async addComment(
        @Param("id") cardId: string,
        @Body() body: { content: string },
        @Request() req
    ) {
        const userId = req.user.user.id;
        return this.cardService.addComments(cardId, body.content, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("comment/:commentId")
    async updateComment(
        @Param("commentId") commentId: string,
        @Body() body: { content: string },
        @Request() req
    ) {
        const userId = req.user.user.id;
        return this.cardService.editComment(commentId, body.content, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete("comment/:commentId")
    async deleteComment(
        @Param("commentId") commentId: string,
        @Request() req
    ) {
        const userId = req.user.user.id;
        return this.cardService.deleteComment(commentId, userId);
    }

}
