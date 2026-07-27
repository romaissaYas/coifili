/** Erreur métier porteuse d'un code HTTP, pour que les contrôleurs puissent
 * traduire directement une erreur de service en réponse Express. */
export class ServiceError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string>) {
    super(message);
    this.name = 'ServiceError';
  }
}
