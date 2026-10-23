import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diretoria } from './entities/diretoria.entity';
import { CreateDiretoriaDto } from './dto/create-diretoria.dto';
import { UpdateDiretoriaDto } from './dto/update-diretoria.dto';

@Injectable()
export class DiretoriasService {
  constructor(
    @InjectRepository(Diretoria)
    private readonly diretoriaRepository: Repository<Diretoria>,
  ) {}

  async findAll(): Promise<Diretoria[]> {
    return this.diretoriaRepository.find();
  }

  async findOne(id: string): Promise<Diretoria> {
    const diretoria = await this.diretoriaRepository.findOne({
      where: { id },
    });

    if (!diretoria) {
      throw new NotFoundException('Atlética não encontrada');
    }

    return diretoria;
  }

  async create(createDiretoriaDto: CreateDiretoriaDto): Promise<Diretoria> {
    const existing = await this.diretoriaRepository.findOne({
      where: { email: createDiretoriaDto.email },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe uma atlética cadastrada com este e-mail',
      );
    }

    const { descontoSocio, ...rest } = createDiretoriaDto;
    const diretoria = this.diretoriaRepository.create({
      ...rest,
      ...(descontoSocio !== undefined && {
        descontoSocio: String(descontoSocio),
      }),
      ativo: true,
    });

    return this.diretoriaRepository.save(diretoria);
  }

  async update(
    id: string,
    updateDiretoriaDto: UpdateDiretoriaDto,
  ): Promise<Diretoria> {
    const diretoria = await this.findOne(id);

    if (
      updateDiretoriaDto.email &&
      updateDiretoriaDto.email !== diretoria.email
    ) {
      const existing = await this.diretoriaRepository.findOne({
        where: { email: updateDiretoriaDto.email },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Já existe uma atlética cadastrada com este e-mail',
        );
      }
    }

    const { descontoSocio, ...rest } = updateDiretoriaDto;
    Object.assign(diretoria, rest);
    if (descontoSocio !== undefined) {
      diretoria.descontoSocio = String(descontoSocio);
    }

    return this.diretoriaRepository.save(diretoria);
  }
}
