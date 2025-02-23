import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
// import { EmailModule } from './email/email.module';
import { EmailModule } from './email/email.module';
import { BoardsModule } from './boards/boards.module';
import { ColumnsModule } from './columns/columns.module';
import { CardsModule } from './cards/cards.module';
import { WorkspaceModule } from './workspace/workspace.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, UserModule, PrismaModule, EmailModule, BoardsModule, ColumnsModule, CardsModule, WorkspaceModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
