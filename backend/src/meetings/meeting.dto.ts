import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';
import { MeetingType } from './meeting.entity';

export class CreateMeetingDto {
  @IsOptional() @IsUUID() merchantId?:string|null;
  @IsOptional() @IsString() merchantName?:string;
  @IsISO8601() meetingDate:string;
  @IsUUID() picUserId:string;
  @IsEnum(MeetingType) meetingType:MeetingType;
  @IsOptional() @IsString() attendees?:string;
  @IsOptional() @IsString() location?:string;
  @IsOptional() @IsString() agenda?:string;
  @IsOptional() @IsString() mom?:string;
  @IsOptional() @IsString() actionItems?:string;
  @IsOptional() @IsString() nextFollowUpDate?:string;
}

export class UpdateMeetingDto {
  @IsOptional() @IsUUID() merchantId?:string|null;
  @IsOptional() @IsString() merchantName?:string;
  @IsOptional() @IsISO8601() meetingDate?:string;
  @IsOptional() @IsUUID() picUserId?:string;
  @IsOptional() @IsEnum(MeetingType) meetingType?:MeetingType;
  @IsOptional() @IsString() attendees?:string;
  @IsOptional() @IsString() location?:string;
  @IsOptional() @IsString() agenda?:string;
  @IsOptional() @IsString() mom?:string;
  @IsOptional() @IsString() actionItems?:string;
  @IsOptional() @IsString() nextFollowUpDate?:string;
}
