import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
    handleFileUpload(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('no file uploaded');
        }

        const allowedMimeTypes = ['image/jpeg',
            'image/png',
            'application/pdf',
            'application/docx',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('invalid file type');
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new BadRequestException('file is too large!');
        }

        return { message: 'File uploaded successfully', filePath: file.path };
    }
}
