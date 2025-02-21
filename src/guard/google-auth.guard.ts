import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleAuthGaurd extends AuthGuard('google') {
    async canActivate(context: ExecutionContext) {
        const active = await super.canActivate(context);
        return active as boolean;
    }
}