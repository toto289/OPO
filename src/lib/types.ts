

export interface MaintenanceLog {
  id: string;
  date: string;
  userRequest: string;
  generatedLog: string;
  componentId?: string;
  componentName?: string;
  tempoGasto?: number; // Tempo em horas
  cost?: number; // Custo dos componentes/insumos utilizados
}

export interface EquipmentLocation {
  latitude?: number;
  longitude?: number;
  manualAddress?: string;
}

export interface Store {
  id: string;
  name: string;
}

export interface Component {
  id: string;
  name: string;
  partNumber: string;
  description?: string;
}

export interface Insumo {
    id: string;
    name: string;
    type: string;
    description?: string;
}

export interface PreventiveTask {
    id: string;
    taskName: string;
    frequencyDays: number;
    lastExecution: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  imageHint: string;
  storeId: string;
  model?: string;
  value?: number; // Valor de compra do ativo
  location?: EquipmentLocation;
  maintenanceHistory: MaintenanceLog[];
  components?: Component[];
  insumos?: Insumo[];
  preventivePlan?: PreventiveTask[];
}


export interface User {
    id: string;
    email: string;
    password?: string;
    name: string;
    cargo?: string; // O título do cargo, ex: "Técnico Eletromecânico"
    role?: string; // O papel no sistema para permissões, ex: "Técnico de Manutenção"
    avatarUrl?: string;
}

export interface WarehouseComponent {
    partNumber: string;
    name: string;
    description: string;
    quantityInStock: number;
    reorderPoint?: number;
    cost?: number;
}

export interface WarehouseInsumo {
    id: string;
    name: string;
    type: string;
    description: string;
    quantityInStock: number;
    reorderPoint?: number;
    cost?: number;
}
