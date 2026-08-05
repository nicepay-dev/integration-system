import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GenerateStandbyDto, SaveStandbyHolidayDto, UpdateStandbyGroupsDto } from './standby.dto';
import { StandbyService } from './standby.service';

@UseGuards(AuthGuard('jwt')) @Controller('standby')
export class StandbyController {
  constructor(private service:StandbyService){}
  @Get() list(@Query('month') month:string){return this.service.list(month)}
  @Get('today') today(){return this.service.todaySchedule()}
  @Get('holidays') holidays(@Query('month') month:string){return this.service.listHolidays(month)}
  @Post('holidays') saveHoliday(@Body() dto:SaveStandbyHolidayDto,@Req() request:any){this.manager(request);return this.service.saveHoliday(dto)}
  @Delete('holidays/:id') removeHoliday(@Param('id') id:string,@Req() request:any){this.manager(request);return this.service.removeHoliday(id)}
  @Patch('groups') groups(@Body() dto:UpdateStandbyGroupsDto,@Req() request:any){this.manager(request);return this.service.updateGroups(dto)}
  @Post('generate') generate(@Body() dto:GenerateStandbyDto,@Req() request:any){this.manager(request);return this.service.generate(dto)}
  private manager(request:any){if(!/\blead\b/i.test(request.user?.role||''))throw new ForbiddenException('Only Lead roles can manage standby schedules')}
}
