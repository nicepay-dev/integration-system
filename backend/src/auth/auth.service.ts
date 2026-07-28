import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private users:Repository<User>,private jwt:JwtService,private config:ConfigService){}
  async login(email:string,password:string){
    const user=await this.users.findOne({where:{email:email.toLowerCase()}});
    if(!user||!(await bcrypt.compare(password,user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    const accessToken=await this.jwt.signAsync({sub:user.id,email:user.email,name:user.name,role:user.role},{secret:this.config.getOrThrow('JWT_SECRET'),expiresIn:this.config.get('JWT_EXPIRES_IN','8h') as any});
    return{accessToken,user:{id:user.id,email:user.email,name:user.name,role:user.role}};
  }
  async changePassword(userId:string,currentPassword:string,newPassword:string){
    const user=await this.users.findOneBy({id:userId});
    if(!user||!(await bcrypt.compare(currentPassword,user.passwordHash))) throw new UnauthorizedException('Current password is incorrect');
    if(currentPassword===newPassword) throw new UnauthorizedException('New password must be different');
    user.passwordHash=await bcrypt.hash(newPassword,12);
    await this.users.save(user);
    return{ok:true,message:'Password updated successfully'};
  }
}
