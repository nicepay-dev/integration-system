import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID, Matches, ValidateNested } from 'class-validator';
import { StandbyHolidayType } from './standby-holiday.entity';

class GroupMemberDto {
  @IsUUID() userId:string;
  @IsOptional() @IsIn(['GROUP_1','GROUP_2']) groupName?:string|null;
}
export class UpdateStandbyGroupsDto { @IsArray() @ValidateNested({each:true}) @Type(()=>GroupMemberDto) assignments:GroupMemberDto[]; }
export class GenerateStandbyDto { @IsString() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) month:string; }
export class SaveStandbyHolidayDto { @IsDateString() holidayDate:string; @IsString() name:string; @IsEnum(StandbyHolidayType) holidayType:StandbyHolidayType; }
