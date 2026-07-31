import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, Min, ValidateIf, ValidateNested } from 'class-validator';
import { MerchantStatus } from './merchant.entity';

export class MerchantMidDto {
  @IsString() mid:string;
  @IsOptional() @IsEnum(MerchantStatus) status?:MerchantStatus;
  @IsArray() @IsString({each:true}) paymentMethods:string[];
  @IsOptional() @IsObject() paymentMethodStatuses?:Record<string,string>;
}

export class CreateMerchantDto {
  @IsString() name:string;
  @IsOptional() @IsString() code?:string;
  @IsOptional() @ValidateIf((_,value)=>value!==''&&value!==null) @IsUUID() picUserId?:string|null;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>MerchantMidDto) mids?:MerchantMidDto[];
  @IsOptional() @IsArray() @IsString({each:true}) paymentMethods?:string[];
  @IsArray() @IsString({each:true}) techStacks:string[];
  @IsArray() @IsString({each:true}) integrationTypes:string[];
  @IsOptional() @IsString() targetLiveDate?:string;
  @IsOptional() @IsString() notes?:string;
}

export class UpdateMerchantDto {
  @IsOptional() @IsString() name?:string;
  @IsOptional() @IsString() code?:string;
  @IsOptional() @ValidateIf((_,value)=>value!==''&&value!==null) @IsUUID() picUserId?:string|null;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>MerchantMidDto) mids?:MerchantMidDto[];
  @IsOptional() @IsArray() @IsString({each:true}) paymentMethods?:string[];
  @IsOptional() @IsArray() @IsString({each:true}) techStacks?:string[];
  @IsOptional() @IsArray() @IsString({each:true}) integrationTypes?:string[];
  @IsOptional() @IsString() targetLiveDate?:string;
  @IsOptional() @IsString() notes?:string;
}
export class UpdateProgressDto { @IsEnum(MerchantStatus) status: MerchantStatus; @IsInt() @Min(0) @Max(100) progress: number; @IsOptional() @IsString() note?: string; @IsOptional() @ValidateIf((_,value)=>value!==''&&value!==null) @IsUUID() picUserId?:string|null; @IsOptional() @IsArray() @IsString({each:true}) paymentMethods?: string[]; @IsOptional() @IsObject() paymentMethodStatuses?: Record<string,string>; @IsOptional() @IsObject() midStatuses?:Record<string,MerchantStatus>; @IsOptional() @IsObject() midPaymentMethodStatuses?:Record<string,Record<string,string>>; }
