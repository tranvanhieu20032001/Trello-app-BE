import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadService } from './upload.service';
import { sanitize } from '../utils/formatters/formatters';
import * as fs from 'fs';

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
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    let folder = "./uploads/attachment/images"
                    if (['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.mimetype)) {
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
    uploadAttachment(@UploadedFile() file: Express.Multer.File) {
        return this.uploadService.handleFileUpload(file);
    }
}
