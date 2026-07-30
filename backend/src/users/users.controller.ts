import { Body, ConflictException, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './user.entity';

const USER_POSITIONS=[
  'staff integrasi',
  'lead integrasi',
  'head section',
  'head of software engineer',
  'it innovation team leader',
  'head of it',
] as const;
const USER_MANAGERS=new Set([
  'lead integrasi',
  'head section',
  'head of software engineer',
  'it innovation team leader',
  'head of it',
]);

class CreateUserDto {
  @IsString() @MinLength(2) name:string;
  @IsEmail() email:string;
  @IsString() @IsIn(USER_POSITIONS) role:string;
  @IsString() @MinLength(8) password:string;
}
class UpdateUserPositionDto { @IsString() @IsIn(USER_POSITIONS) role:string; }
class ResetUserPasswordDto { @IsString() @MinLength(8) newPassword:string; }

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  private assertCanManageUsers(request:any) {
    const requesterRole=String(request.user?.role||'').trim().toLowerCase();
    if(!USER_MANAGERS.has(requesterRole)){
      throw new ForbiddenException('Only an authorized team leader can manage users');
    }
  }

  @Get()
  async list() {
    const users = await this.users.find({ order: { name: 'ASC' } });
    return users.map(({ id, name, email, role }) => ({ id, name, email, role }));
  }

  @Post()
  async create(@Body() dto:CreateUserDto,@Req() request:any) {
    this.assertCanManageUsers(request);
    const email=dto.email.trim().toLowerCase();
    if(await this.users.exists({where:{email}})) throw new ConflictException('Email is already registered');
    const user=await this.users.save(this.users.create({
      name:dto.name.trim(),
      email,
      role:dto.role.trim().toLowerCase(),
      passwordHash:await bcrypt.hash(dto.password,12),
    }));
    return{id:user.id,name:user.name,email:user.email,role:user.role};
  }

  @Patch(':id/position')
  async updatePosition(@Param('id') id:string,@Body() dto:UpdateUserPositionDto,@Req() request:any) {
    this.assertCanManageUsers(request);
    const user=await this.users.findOneBy({id});
    if(!user)throw new NotFoundException('User not found');
    user.role=dto.role;
    await this.users.save(user);
    return{id:user.id,name:user.name,email:user.email,role:user.role,message:`Position updated for ${user.name}`};
  }

  @Patch(':id/password')
  async resetPassword(@Param('id') id:string,@Body() dto:ResetUserPasswordDto,@Req() request:any) {
    this.assertCanManageUsers(request);
    const user=await this.users.findOneBy({id});
    if(!user)throw new NotFoundException('User not found');
    user.passwordHash=await bcrypt.hash(dto.newPassword,12);
    await this.users.save(user);
    return{ok:true,message:`Password reset successfully for ${user.name}`};
  }
}
