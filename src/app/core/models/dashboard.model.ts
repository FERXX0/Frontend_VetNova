export interface ResumenDashboard {
  empresas: {
    total: number;
    activas: number;
    suspendidas: number;
    nuevas_este_mes: number;
  };
  usuarios: {
    total: number;
    activos: number;
  };
  suscripciones: {
    activas: number;
    proximas_a_vencer: number;
  };
  ingreso_mensual_estimado: number;
}
