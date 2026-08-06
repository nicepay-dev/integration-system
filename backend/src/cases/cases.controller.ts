import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateCaseDto, UpdateCaseDto } from './case.dto';
import { CasesService } from './cases.service';

@UseGuards(AuthGuard('jwt'))
@Controller('cases')
export class CasesController {
  constructor(private service:CasesService) {}
  @Get() list(@Query('status') status?:string,@Query('merchantId') merchantId?:string,@Query('picUserId') picUserId?:string,@Query('search') search?:string,@Query('dateFrom') dateFrom?:string,@Query('dateTo') dateTo?:string,@Query('category') category?:string,@Query('paymentMethod') paymentMethod?:string,@Query('paymentArea') paymentArea?:string){return this.service.list(status,merchantId,picUserId,search,dateFrom,dateTo,category,paymentMethod,paymentArea);}
  @Get(':id/history') history(@Param('id') id:string){return this.service.historyFor(id);}
  @Post() create(@Body() dto:CreateCaseDto,@Req() request:any){return this.service.create(dto,request.user.id,request.user.name);}
  @Patch(':id') update(@Param('id') id:string,@Body() dto:UpdateCaseDto,@Req() request:any){return this.service.update(id,dto,request.user.name);}
  @Delete(':id') remove(@Param('id') id:string,@Req() request:any){return this.service.remove(id,request.user.name);}
}
