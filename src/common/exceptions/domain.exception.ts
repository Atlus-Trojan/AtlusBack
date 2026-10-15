/**
 * Classe base para todas as exceções de domínio da aplicação.
 *
 * Services lançam subclasses de DomainException — nunca exceções HTTP.
 * A tradução para status HTTP fica a cargo do DomainExceptionFilter.
 */
export class DomainException extends Error {
  constructor(
    /** Código estável de erro (ex.: 'DOCUMENTO_DUPLICADO') */
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
