import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateMeetingDto, UpdateMeetingDto } from './meeting.dto';
import { MeetingsService } from './meetings.service';

@UseGuards(AuthGuard('jwt'))
@Controller('meetings')
export class MeetingsController {
  constructor(private service:MeetingsService){}
  @Get() list(@Query('search') search?:string,@Query('merchantId') merchantId?:string,@Query('picUserId') picUserId?:string,@Query('dateFrom') dateFrom?:string,@Query('dateTo') dateTo?:string){return this.service.list(search,merchantId,picUserId,dateFrom,dateTo);}
  @Post() create(@Body() dto:CreateMeetingDto,@Req() request:any){return this.service.create(dto,request.user.name);}
  @Patch(':id') update(@Param('id') id:string,@Body() dto:UpdateMeetingDto){return this.service.update(id,dto);}
  @Delete(':id') remove(@Param('id') id:string){return this.service.remove(id);}
}
