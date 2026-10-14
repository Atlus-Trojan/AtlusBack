import { Controller, Get } from '@nestjs/common';
import { ProdutosService } from './produtos.service';

@Controller('admin/produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  findAll() {
    return this.produtosService.findAll();
  }
}
