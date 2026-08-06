import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProjectCategory, ProjectStatus } from './project-library.entity';
export class CreateLibraryProjectDto { @IsString() name:string; @IsEnum(ProjectCategory) category:ProjectCategory; @IsString() description:string; @IsOptional() @IsString() projectUrl?:string; @IsOptional() @IsUUID() picUserId?:string; @IsOptional() @IsString() technology?:string; @IsOptional() @IsEnum(ProjectStatus) status?:ProjectStatus; @IsOptional() @IsString() notes?:string; }
export class UpdateLibraryProjectDto extends CreateLibraryProjectDto {}
