import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelDTO } from './dto';

@Controller('api/v1/labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post("/")
  create(@Body() labelDTO: LabelDTO) {
    return this.labelsService.createLabel(labelDTO);
  }

  @Delete("/:id")
  remove(@Param("id") labelId:string){
    return this.labelsService.removeLabel(labelId);
  }
  @Put(':id')
  update(@Param('id') labelId: string, @Body() body: { name: string; color: string }) {
    return this.labelsService.updateLabel(labelId , body);
  }

  @Post("/toggle")
  toggle(@Body() body: { cardId: string; labelId: string }) {
    return this.labelsService.toggleLabel(body.cardId, body.labelId);
  }
  
}
