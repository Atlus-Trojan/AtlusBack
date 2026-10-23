import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { DiretoriasService } from './diretorias.service';
import { CreateDiretoriaDto } from './dto/create-diretoria.dto';
import { UpdateDiretoriaDto } from './dto/update-diretoria.dto';
import { Diretoria } from './entities/diretoria.entity';

@Controller('admin/diretorias')
export class DiretoriasController {
  constructor(private readonly diretoriasService: DiretoriasService) {}

  @Get()
  findAll(): Promise<Diretoria[]> {
    return this.diretoriasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Diretoria> {
    return this.diretoriasService.findOne(id);
  }

  @Post()
  create(@Body() createDiretoriaDto: CreateDiretoriaDto): Promise<Diretoria> {
    return this.diretoriasService.create(createDiretoriaDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDiretoriaDto: UpdateDiretoriaDto,
  ): Promise<Diretoria> {
    return this.diretoriasService.update(id, updateDiretoriaDto);
  }
}

