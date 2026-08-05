import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { GenerateStandbyDto, SaveStandbyHolidayDto, UpdateStandbyGroupsDto } from './standby.dto';
import { StandbyHoliday, StandbyHolidayType } from './standby-holiday.entity';
import { StandbySchedule } from './standby.entity';

@Injectable()
export class StandbyService {
  constructor(@InjectRepository(StandbySchedule) private schedules:Repository<StandbySchedule>,@InjectRepository(StandbyHoliday) private holidays:Repository<StandbyHoliday>,@InjectRepository(User) private users:Repository<User>){}
  list(month:string){const safe=/^\d{4}-(0[1-9]|1[0-2])$/.test(month||'')?month:this.today().slice(0,7);return this.schedules.find({where:{scheduleDate:Between(`${safe}-01`,`${safe}-31`)},order:{scheduleDate:'ASC',groupName:'ASC'}})}
  todaySchedule(){return this.schedules.find({where:{scheduleDate:this.today()},order:{groupName:'ASC'}})}
  listHolidays(month:string){const safe=/^\d{4}-(0[1-9]|1[0-2])$/.test(month||'')?month:this.today().slice(0,7);return this.holidays.find({where:{holidayDate:Between(`${safe}-01`,`${safe}-31`)},order:{holidayDate:'ASC'}})}
  async saveHoliday(dto:SaveStandbyHolidayDto){const date=dto.holidayDate.slice(0,10);let holiday=await this.holidays.findOneBy({holidayDate:date});holiday=holiday||this.holidays.create({holidayDate:date});holiday.name=dto.name.trim();holiday.holidayType=dto.holidayType;const saved=await this.holidays.save(holiday);if(dto.holidayType===StandbyHolidayType.PUBLIC_HOLIDAY)await this.schedules.delete({scheduleDate:date});return saved}
  async removeHoliday(id:string){const holiday=await this.holidays.findOneBy({id});if(!holiday)throw new NotFoundException('Holiday not found');await this.holidays.remove(holiday);return{ok:true}}
  async updateGroups(dto:UpdateStandbyGroupsDto){
    for(const assignment of dto.assignments){const user=await this.users.findOneBy({id:assignment.userId});if(!user)throw new NotFoundException('User not found');if(!/\bstaff\b/i.test(user.role||''))throw new BadRequestException(`${user.name} is not eligible because the position is not Staff`);user.standbyGroup=assignment.groupName||null;await this.users.save(user)}
    return this.users.find({order:{name:'ASC'}});
  }
  async generate(dto:GenerateStandbyDto){
    const members=(await this.users.find({order:{name:'ASC'}})).filter(user=>/\bstaff\b/i.test(user.role||''));
    const groups:Record<string,User[]>={GROUP_1:this.shuffle(members.filter(user=>user.standbyGroup==='GROUP_1')),GROUP_2:this.shuffle(members.filter(user=>user.standbyGroup==='GROUP_2'))};
    if(!groups.GROUP_1.length||!groups.GROUP_2.length)throw new BadRequestException('Assign at least one member to both Group 1 and Group 2');
    const [year,month]=dto.month.split('-').map(Number);const lastDay=new Date(Date.UTC(year,month,0)).getUTCDate();
    const holidays=await this.listHolidays(dto.month);const excluded=new Set(holidays.filter(item=>item.holidayType===StandbyHolidayType.PUBLIC_HOLIDAY).map(item=>item.holidayDate));
    await this.schedules.delete({scheduleDate:Between(`${dto.month}-01`,`${dto.month}-31`)});
    const rows:StandbySchedule[]=[];let weekdayIndex=0;
    for(let day=1;day<=lastDay;day++){const date=new Date(Date.UTC(year,month-1,day));const weekDay=date.getUTCDay();const scheduleDate=`${dto.month}-${String(day).padStart(2,'0')}`;if(weekDay===0||weekDay===6||excluded.has(scheduleDate))continue;for(const groupName of ['GROUP_1','GROUP_2'])rows.push(this.schedules.create({scheduleDate,groupName,member:groups[groupName][weekdayIndex%groups[groupName].length]}));weekdayIndex++}
    await this.schedules.save(rows);return this.list(dto.month);
  }
  private shuffle<T>(items:T[]){const result=[...items];for(let index=result.length-1;index>0;index--){const target=Math.floor(Math.random()*(index+1));[result[index],result[target]]=[result[target],result[index]]}return result}
  private today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
}
