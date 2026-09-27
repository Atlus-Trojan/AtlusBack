import { Curso } from '../modules/diretorias/entities/curso.entity';
import { Diretoria } from '../modules/diretorias/entities/diretoria.entity';
import { Evento } from '../modules/eventos/entities/evento.entity';
import { Participacao } from '../modules/eventos/entities/participacao.entity';
import { ItemPedido } from '../modules/loja/entities/item-pedido.entity';
import { Pedido } from '../modules/loja/entities/pedido.entity';
import { Produto } from '../modules/loja/entities/produto.entity';
import { Socio } from '../modules/socios/entities/socio.entity';
import { UsuarioDiretoria } from '../modules/usuarios/entities/usuario-diretoria.entity';
import { Usuario } from '../modules/usuarios/entities/usuario.entity';

export {
  Curso,
  Diretoria,
  Evento,
  ItemPedido,
  Participacao,
  Pedido,
  Produto,
  Socio,
  Usuario,
  UsuarioDiretoria,
};

export const DATABASE_ENTITIES = [
  Diretoria,
  Curso,
  Usuario,
  UsuarioDiretoria,
  Socio,
  Produto,
  Pedido,
  ItemPedido,
  Evento,
  Participacao,
];
