import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemPedido } from './entities/item-pedido.entity';
import { Pedido } from './entities/pedido.entity';
import { Produto } from './entities/produto.entity';
import { ProdutosModule } from './produtos/produtos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto, Pedido, ItemPedido]),
    ProdutosModule,
  ],
  exports: [TypeOrmModule],
})
export class LojaModule {}
