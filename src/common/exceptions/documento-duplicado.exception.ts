import { DomainException } from './domain.exception';

/**
 * Lançada quando um documento identificador (e-mail, RGA, CPF…) já existe no
 * banco. O código estável 'DOCUMENTO_DUPLICADO' é consumido pelo filtro global
 * para traduzir automaticamente em HTTP 409.
 */
export class DocumentoDuplicadoException extends DomainException {
  constructor(message: string) {
    super('DOCUMENTO_DUPLICADO', message);
  }
}
