import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Param,
    Post,
    Request,
    UploadedFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadService } from './upload.service';
import { sanitize } from '../utils/formatters/formatters';
import * as fs from 'fs';
import { JwtAuthGuard } from '../guard';

function ensureDir(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
}

@Controller('api/v1/upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('cover')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const folder = './uploads/cover';
                    ensureDir(folder);
                    cb(null, folder);
                },
                filename: (req, file, cb) => {
                    const filename = `${Date.now()}_${sanitize(file.originalname)}`;
                    cb(null, filename);
                },
            }),
        }),
    )
    uploadCover(@UploadedFile() file: Express.Multer.File) {
        return this.uploadService.handleFileUpload(file);
    }

    @Post('attachment')
    @UseInterceptors(
        FilesInterceptor('files', 10, { // Changed to FilesInterceptor, 'files' is the field name, 10 is max count
            storage: diskStorage({
                destination: (req, file, cb) => {
                    let folder = "./uploads/attachment/images"
                    if (['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'].includes(file.mimetype)) {
                        folder = './uploads/attachment/docs';
                    }
                    ensureDir(folder);
                    cb(null, folder);
                },
                filename: (req, file, cb) => {
                    const filename = `${Date.now()}_${sanitize(file.originalname)}`;
                    cb(null, filename);
                },
            }),
        }),
    )
    uploadAttachment(@UploadedFiles() files: Array<Express.Multer.File>) {
        return this.uploadService.handleMultipleFileUpload(files);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('attachment/:id')
    deleteAttachment(@Param("id") id: string, @Body() body: { filePath: string }, @Request() req) {
        const userId = req.user.user.id
        const deleted = this.uploadService.deleteAttachment(body.filePath, id, userId);
        if (!deleted) throw new BadRequestException('File not found');
        return { message: 'File deleted successfully' };
    }



}