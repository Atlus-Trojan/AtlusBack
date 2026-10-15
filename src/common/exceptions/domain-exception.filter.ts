import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from './domain.exception';

/**
 * Mapa de tradução: código de domínio → status HTTP.
 * Adicione novas entradas conforme surgirem novos erros de domínio.
 */
const CODE_TO_STATUS: Record<string, HttpStatus> = {
  DOCUMENTO_DUPLICADO: HttpStatus.CONFLICT, // 409
};

const DEFAULT_STATUS = HttpStatus.UNPROCESSABLE_ENTITY; // 422

/**
 * Filtro global que intercepta qualquer DomainException lançada por um
 * Service e a converte automaticamente numa resposta HTTP padronizada.
 *
 * Registrado em main.ts via app.useGlobalFilters().
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = CODE_TO_STATUS[exception.code] ?? DEFAULT_STATUS;

    response.status(status).json({
      statusCode: status,
      error: exception.code,
      message: exception.message,
    });
  }
}
