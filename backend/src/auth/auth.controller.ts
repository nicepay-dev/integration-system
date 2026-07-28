import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto { @IsEmail() email:string; @IsString() @MinLength(6) password:string; }
class ChangePasswordDto { @IsString() @MinLength(6) currentPassword:string; @IsString() @MinLength(8) newPassword:string; }

@Controller('auth')
export class AuthController {
  constructor(private auth:AuthService) {}
  @Post('login') login(@Body() dto:LoginDto){return this.auth.login(dto.email,dto.password);}
  @UseGuards(AuthGuard('jwt')) @Get('me') me(@Req() request:any){return request.user;}
  @UseGuards(AuthGuard('jwt')) @Patch('password') changePassword(@Req() request:any,@Body() dto:ChangePasswordDto){return this.auth.changePassword(request.user.id,dto.currentPassword,dto.newPassword);}
}
