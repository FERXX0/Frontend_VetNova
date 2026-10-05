export interface AlcanceApi {
  plataforma: boolean;
  empresaId?: string | null;
}

export function urlRecurso(apiUrl: string, recurso: string, alcance?: AlcanceApi): string {
  if (!alcance?.plataforma) {
    return `${apiUrl}/${recurso}`;
  }

  return alcance.empresaId
    ? `${apiUrl}/plataforma/empresas/${alcance.empresaId}/${recurso}`
    : `${apiUrl}/plataforma/${recurso}`;
}
