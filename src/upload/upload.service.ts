import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadService {
    constructor(private prisma: PrismaService) { }
    handleFileUpload(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('no file uploaded');
        }

        return this.validateAndProcessFile(file);
    }

    handleMultipleFileUpload(files: Array<Express.Multer.File>) {
        if (!files || files.length === 0) {
            throw new BadRequestException('no files uploaded');
        }

        return files.map(file => this.validateAndProcessFile(file));
    }

    private validateAndProcessFile(file: Express.Multer.File) {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('invalid file type');
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new BadRequestException('file is too large!');
        }

        return { message: 'File uploaded successfully', filePath: file.path };
    }

   
  async deleteAttachment(fileUrl: string, id: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });

    if (!attachment) throw new NotFoundException('Attachment not found');
    if (attachment.userId !== userId) throw new ForbiddenException('Not allowed');

    await this.prisma.attachment.delete({ where: { id } });

    const parsedFilename = path.basename(fileUrl); // lấy đúng tên file
    console.log('Parsed filename:', parsedFilename);

    const folders = [
      path.resolve(process.cwd(), 'uploads', 'attachment', 'images'),
      path.resolve(process.cwd(), 'uploads', 'attachment', 'docs'),
    ];

    for (const folder of folders) {
      const filePath = path.join(folder, parsedFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    }

    console.warn('File not found in any folder.');
    return false;
  }
}