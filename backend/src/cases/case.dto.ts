import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CaseStatus, IssueCategory } from './case.entity';

export class CreateCaseDto {
  @IsUUID() merchantId:string;
  @IsString() issue:string;
  @IsEnum(IssueCategory) category:IssueCategory;
  @IsOptional() @IsString() paymentMethod?:string;
  @IsOptional() @IsString() paymentArea?:string;
  @IsOptional() @IsString() response?:string;
  @IsOptional() @IsString() action?:string;
  @IsOptional() @IsString() updateNote?:string;
  @IsOptional() @IsString() checkResult?:string;
  @IsOptional() @IsString() acrTicket?:string;
  @IsOptional() @IsEnum(CaseStatus) status?:CaseStatus;
}

export class UpdateCaseDto {
  @IsOptional() @IsString() response?:string;
  @IsOptional() @IsString() action?:string;
  @IsOptional() @IsString() updateNote?:string;
  @IsOptional() @IsString() checkResult?:string;
  @IsOptional() @IsUUID() picUserId?:string;
  @IsOptional() @IsString() acrTicket?:string;
  @IsOptional() @IsEnum(CaseStatus) status?:CaseStatus;
}
