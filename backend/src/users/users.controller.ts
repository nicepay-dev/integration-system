import { Body, ConflictException, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { IsEmail, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './user.entity';

class CreateUserDto {
  @IsString() @MinLength(2) name:string;
  @IsEmail() email:string;
  @IsString() @MinLength(2) role:string;
  @IsString() @MinLength(8) password:string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  @Get()
  async list() {
    const users = await this.users.find({ order: { name: 'ASC' } });
    return users.map(({ id, name, email, role }) => ({ id, name, email, role }));
  }

  @Post()
  async create(@Body() dto:CreateUserDto,@Req() request:any) {
    if (!String(request.user?.role || '').toLowerCase().includes('lead')) {
      throw new ForbiddenException('Only an integration lead can register users');
    }
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
}
