import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class AuthDTO{
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/, {
        message: 'Mật khẩu phải có chữ hoa, chữ thường và số',
      })
    password: string
}