export interface PlanDashboard {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  precio_mensual: number;
  precio_anual: number;
  moneda: string;
  maximo_usuarios: number | null;
  activo: boolean;
  empresas_suscritas: number;
  suscripciones_activas: number;
  modulos: ModuloDashboard[];
}

export interface ModuloDashboard {
  id: string;
  nombre: string;
}

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

    ingresos: {
      mensual: number;
      trimestral: number;
      semestral: number;
      anual: number;
    };
  };

  cantidad_por_periodo: {
    mensual: number;
    trimestral: number;
    semestral: number;
    anual: number;
  };

  ingreso_mensual_estimado: number;

  planes: PlanDashboard[];
}