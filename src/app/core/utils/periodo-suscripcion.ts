import { PeriodoSuscripcion, Plan } from '../models/suscripcion.model';

const MESES_POR_PERIODO: Record<PeriodoSuscripcion, number> = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

/** Fecha local de hoy en formato YYYY-MM-DD. */
export function fechaHoyIso(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');

  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/**
 * Suma a la fecha de inicio (YYYY-MM-DD) los meses del periodo.
 * Si el día no existe en el mes destino, usa el último día de ese mes.
 */
export function calcularFechaFin(inicio: string, periodo: PeriodoSuscripcion): string {
  const [anio, mes, dia] = inicio.split('-').map(Number);
  const meses = MESES_POR_PERIODO[periodo];
  const ultimoDiaDestino = new Date(Date.UTC(anio, mes - 1 + meses + 1, 0)).getUTCDate();
  const fin = new Date(Date.UTC(anio, mes - 1 + meses, Math.min(dia, ultimoDiaDestino)));

  return fin.toISOString().slice(0, 10);
}

/** Monto del periodo: precio anual si aplica; en otro caso precio mensual por los meses del periodo. */
export function calcularMontoPeriodo(plan: Plan, periodo: PeriodoSuscripcion): number {
  if (periodo === 'anual' && plan.precio_anual) {
    return Number(plan.precio_anual);
  }

  return Number(plan.precio_mensual) * MESES_POR_PERIODO[periodo];
}

export function cicloFacturacionDe(periodo: PeriodoSuscripcion): 'mensual' | 'anual' {
  return periodo === 'anual' ? 'anual' : 'mensual';
}

/** Inicio del día local (00:00:00) en ISO UTC. */
export function inicioDelDiaIso(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toISOString();
}

/** Fin del día local (23:59:59) en ISO UTC, para que el último día del plan cuente completo. */
export function finDelDiaIso(fecha: string): string {
  return new Date(`${fecha}T23:59:59`).toISOString();
}
