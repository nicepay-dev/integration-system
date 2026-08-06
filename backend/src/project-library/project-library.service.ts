import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateLibraryProjectDto, UpdateLibraryProjectDto } from './project-library.dto';
import { LibraryProject, ProjectCategory, ProjectStatus } from './project-library.entity';
import { ProjectLibraryHistory } from './project-library-history.entity';
@Injectable()
export class ProjectLibraryService {
 constructor(@InjectRepository(LibraryProject) private projects:Repository<LibraryProject>,@InjectRepository(ProjectLibraryHistory) private history:Repository<ProjectLibraryHistory>,@InjectRepository(User) private users:Repository<User>){}
 list(search?:string,status?:string,category?:string,picUserId?:string){const q=this.projects.createQueryBuilder('project').leftJoinAndSelect('project.pic','pic').orderBy('project.updatedAt','DESC');if(search)q.andWhere('(project.name ILIKE :search OR project.description ILIKE :search OR project.technology ILIKE :search OR project.notes ILIKE :search)',{search:`%${search}%`});if(status&&Object.values(ProjectStatus).includes(status as ProjectStatus))q.andWhere('project.status = :status',{status});if(category&&Object.values(ProjectCategory).includes(category as ProjectCategory))q.andWhere('project.category = :category',{category});if(picUserId)q.andWhere('pic.id = :picUserId',{picUserId});return q.getMany();}
 async create(dto:CreateLibraryProjectDto,createdBy:string){const project=await this.projects.save(this.projects.create(await this.values(dto,createdBy)));await this.history.save(this.history.create({project,action:'CREATED',changedBy:createdBy,changes:{project:{from:null,to:project.name}}}));return project;}
 async update(id:string,dto:UpdateLibraryProjectDto,changedBy:string){const project=await this.projects.findOneBy({id});if(!project)throw new NotFoundException('Project not found');const next=await this.values(dto,project.createdBy);const fields=['name','category','description','projectUrl','technology','status','notes'] as const;const changes:Record<string,{from:unknown;to:unknown}>={};for(const field of fields)if(project[field]!==next[field])changes[field]={from:project[field],to:next[field]};const oldPic=project.pic?.name||null,newPic=next.pic?.name||null;if(oldPic!==newPic)changes.pic={from:oldPic,to:newPic};Object.assign(project,next);const saved=await this.projects.save(project);if(Object.keys(changes).length)await this.history.save(this.history.create({project:saved,action:'UPDATED',changedBy,changes}));return saved;}
 historyFor(id:string){return this.history.find({where:{project:{id}},order:{createdAt:'DESC'}});}
 async remove(id:string){const project=await this.projects.findOneBy({id});if(!project)throw new NotFoundException('Project not found');await this.projects.remove(project);return{ok:true};}
 private async values(dto:CreateLibraryProjectDto,createdBy:string){const pic=dto.picUserId?await this.users.findOneBy({id:dto.picUserId}):null;if(dto.picUserId&&!pic)throw new NotFoundException('PIC not found');return{name:dto.name.trim(),category:dto.category,description:dto.description.trim(),projectUrl:dto.projectUrl?.trim()||null,pic,technology:dto.technology?.trim()||null,status:dto.status||ProjectStatus.IDEA,notes:dto.notes?.trim()||null,createdBy};}
}
