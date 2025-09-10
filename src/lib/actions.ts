
'use server';

import {
  generateMaintenanceLog as genMaintenanceLog,
  type GenerateMaintenanceLogOutput,
} from '@/ai/flows/generate-maintenance-log';
import {
  improveDescription,
  type ImproveDescriptionInput,
} from '@/ai/flows/improve-description';
import {
  improveName,
  type ImproveNameInput,
} from '@/ai/flows/improve-name';
import {
  findEquipmentComponents,
  type FindEquipmentComponentsInput,
} from '@/ai/flows/find-equipment-components';
import {
  findEquipmentModels,
  type FindEquipmentModelsInput,
} from '@/ai/flows/find-equipment-models';
import {
  findEquipmentInsumos,
  type FindEquipmentInsumosInput,
} from '@/ai/flows/find-equipment-insumos';
import {
    addEquipment as apiAddEquipment,
    addMaintenanceLog as apiAddMaintenanceLog,
    deleteEquipment as apiDeleteEquipment,
    updateEquipment as apiUpdateEquipment,
    addStore as apiAddStore,
    deleteStore as apiDeleteStore,
    updateStore as apiUpdateStore,
    getEquipmentById,
    getUserById as apiGetUserById,
    updateUser as apiUpdateUser,
    addUser as apiAddUser,
    addWarehouseComponent as apiAddWarehouseComponent,
    addWarehouseInsumo as apiAddWarehouseInsumo,
    updateWarehouseComponent as apiUpdateWarehouseComponent,
    updateWarehouseInsumo as apiUpdateWarehouseInsumo,
    getWarehouseInsumos,
    getWarehouseComponents,
    getWarehouseComponentByPartNumber,
    getWarehouseInsumoByName,
} from './api';
import type { Equipment, Store, MaintenanceLog, User, WarehouseComponent, WarehouseInsumo } from './types';
import { revalidatePath } from 'next/cache';
import type { GenerateMaintenanceLogInput as GenMaintenanceLogInput } from '@/ai/flows/generate-maintenance-log';

// --- API Functions Re-exported as Server Actions ---

export async function addEquipment(item: Omit<Equipment, 'maintenanceHistory' | 'preventivePlan'> & { maintenanceHistory: MaintenanceLog[] }): Promise<{success: boolean; data?: Equipment; error?: string}> {
    const result = await apiAddEquipment(item);
    if (result.success && result.data) {
        revalidatePath('/dashboard/equipment');
        revalidatePath(`/dashboard/equipment/${result.data.id}`);
    }
    return result;
}

export async function addMaintenanceLog(equipmentId: string, log: Omit<MaintenanceLog, 'id' | 'date'>): Promise<void> {
    await apiAddMaintenanceLog(equipmentId, log);
    revalidatePath(`/dashboard/equipment/${equipmentId}`);
    // Revalidate related pages that use this data
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/insumos');
    revalidatePath('/dashboard/mrp');
    revalidatePath('/dashboard/corrective');
    revalidatePath('/dashboard/maintenance-dashboard');
}

export async function deleteEquipment(id: string): Promise<void> {
    const result = await apiDeleteEquipment(id);
    revalidatePath('/dashboard/equipment');
    return result;
}

export async function updateEquipment(id: string, updatedData: Partial<Equipment>): Promise<{success: boolean; data?: Equipment; error?: string}> {
    const result = await apiUpdateEquipment(id, updatedData);
    if(result.success) {
        const newId = updatedData.id || id;
        revalidatePath('/dashboard/equipment');
        revalidatePath(`/dashboard/equipment/${id}`);
        if(id !== newId) {
            revalidatePath(`/dashboard/equipment/${newId}`);
        }
        revalidatePath('/dashboard/preventive'); // Revalidate preventive page
        // Also revalidate warehouse if location is updated
        if (updatedData.location) {
             revalidatePath('/dashboard/warehouse');
        }
    }
    return result;
}

export async function addStore(store: Omit<Store, 'id'>): Promise<Store> {
    const result = await apiAddStore(store);
    revalidatePath('/dashboard/stores');
    revalidatePath('/dashboard/equipment/new'); 
    return result;
  }

export async function deleteStore(id: string): Promise<{ success: boolean; message?: string }> {
    const result = await apiDeleteStore(id);
    revalidatePath('/dashboard/stores');
    revalidatePath('/dashboard/equipment/new');
    return result;
}

export async function updateStore(id: string, updatedStoreData: Partial<Store>): Promise<void> {
    await apiUpdateStore(id, updatedStoreData);
    revalidatePath('/dashboard/stores');
    revalidatePath('/dashboard/equipment/new');
  }

export async function getUserById(id: string): Promise<User | undefined> {
    return apiGetUserById(id);
}

export async function createUser(userData: Omit<User, 'id' | 'avatarUrl'>): Promise<{success: boolean; data?: User; error?: string}> {
    const result = await apiAddUser(userData);
    if(result.success) {
        revalidatePath('/dashboard/users');
    }
    return result;
}

export async function updateUser(id: string, updatedUserData: Partial<User>): Promise<{success: boolean; data?: User; error?: string}> {
    const result = await apiUpdateUser(id, updatedUserData);
    if(result.success) {
        revalidatePath('/dashboard/profile');
        revalidatePath('/dashboard/users');
    }
    return result;
}


export async function validateQrCode(id: string): Promise<{ success: boolean; equipment?: Equipment }> {
    const equipment = await getEquipmentById(id);
    return { success: !!equipment, equipment };
}


// --- WAREHOUSE Actions ---

export async function searchWarehouseComponents(query: string): Promise<WarehouseComponent[]> {
  if (!query) return [];
  const components = await getWarehouseComponents();
  return components.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) || 
      c.partNumber.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Return max 5 suggestions
}

export async function addWarehouseComponent(component: WarehouseComponent): Promise<{success: boolean, error?: string}> {
    const result = await apiAddWarehouseComponent(component);
    if (result.success) revalidatePath('/dashboard/warehouse');
    return result;
}

export async function addWarehouseInsumo(insumo: Omit<WarehouseInsumo, 'id'>): Promise<{success: boolean, data?: WarehouseInsumo, error?: string}> {
    const result = await apiAddWarehouseInsumo(insumo);
    if (result.success) revalidatePath('/dashboard/warehouse');
    return result;
}

export async function updateWarehouseComponent(partNumber: string, updatedData: Partial<WarehouseComponent>): Promise<{success: boolean, error?: string}> {
    const result = await apiUpdateWarehouseComponent(partNumber, updatedData);
    if (result.success) {
        revalidatePath('/dashboard/warehouse');
        revalidatePath('/dashboard/mrp');
        revalidatePath('/dashboard/purchasing');
    }
    return result;
}

export async function updateWarehouseInsumo(id: string, updatedData: Partial<WarehouseInsumo>): Promise<{success: boolean, error?: string}> {
    const result = await apiUpdateWarehouseInsumo(id, updatedData);
    if (result.success) {
        revalidatePath('/dashboard/warehouse');
        revalidatePath('/dashboard/insumos');
        revalidatePath('/dashboard/mrp');
        revalidatePath('/dashboard/purchasing');
    }
    return result;
}


// --- AI Actions ---
export type CreateMaintenanceLogInput = GenMaintenanceLogInput & {
  componentId?: string;
  componentPartNumber?: string; // We'll use partNumber to find in warehouse
  componentName?: string;
  insumoName?: string; // To find insumo in warehouse
  tempoGasto?: number;
  cost?: number; // Manual cost override
};


export async function createMaintenanceLog(
  input: CreateMaintenanceLogInput
): Promise<{
  success: boolean;
  data: GenerateMaintenanceLogOutput;
  logData: Omit<MaintenanceLog, 'id' | 'date'>;
}> {
  try {
    const aiResult = await genMaintenanceLog({
        equipmentName: input.equipmentName,
        equipmentDescription: input.equipmentDescription,
        modifications: input.modifications,
    });
    
    let finalCost = input.cost;

    // Se o custo não foi informado manualmente, tentamos buscar no estoque
    if (finalCost === undefined || finalCost === 0) {
        // Se for um componente, busca pelo part number
        if (input.componentPartNumber) {
            const component = await getWarehouseComponentByPartNumber(input.componentPartNumber);
            if (component && component.quantityInStock > 0) {
                await updateWarehouseComponent(component.partNumber, { quantityInStock: component.quantityInStock - 1});
                finalCost = component.cost;
            }
        } 
        // Se for um insumo, busca pelo nome
        else if (input.insumoName) {
            const insumo = await getWarehouseInsumoByName(input.insumoName);
             if (insumo && insumo.quantityInStock > 0) {
                await updateWarehouseInsumo(insumo.id, { quantityInStock: insumo.quantityInStock - 1});
                finalCost = insumo.cost;
            }
        }
    }
    
    const logData: Omit<MaintenanceLog, 'id' | 'date'> = {
        userRequest: input.modifications,
        generatedLog: aiResult.logEntry,
        componentId: input.componentId,
        componentName: input.componentName,
        tempoGasto: input.tempoGasto,
        cost: finalCost,
    };

    return {
      success: true,
      data: aiResult,
      logData,
    };
  } catch (error) {
    console.error('AI log generation failed:', JSON.stringify(error, null, 2));
    // Mesmo que a IA falhe, criamos um log básico.
    const fallbackLogData: Omit<MaintenanceLog, 'id' | 'date'> = {
      userRequest: input.modifications,
      generatedLog: `Serviço registrado: ${input.modifications}`, // Log de fallback
      componentId: input.componentId,
      componentName: input.componentName,
      tempoGasto: input.tempoGasto,
      cost: input.cost,
    };
    return {
      success: false,
      error: 'Falha ao gerar o log de manutenção com IA. Um log básico foi criado.',
      data: { logEntry: fallbackLogData.generatedLog },
      logData: fallbackLogData
    };
  }
}

export async function generateImprovedDescription(
  input: ImproveDescriptionInput
) {
  try {
    const result = await improveDescription(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI description improvement failed:', JSON.stringify(error, null, 2));
    return {
      success: false,
      error: 'Falha ao melhorar a descrição com IA.',
    };
  }
}

export async function generateImprovedName(input: ImproveNameInput) {
  try {
    const result = await improveName(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI name improvement failed:', JSON.stringify(error, null, 2));
    return { success: false, error: 'Falha ao melhorar o nome com IA.' };
  }
}

export async function getEquipmentComponents(
  input: FindEquipmentComponentsInput
) {
  try {
    const result = await findEquipmentComponents(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI component search failed:', JSON.stringify(error, null, 2));
    return { success: false, error: 'Falha ao buscar componentes com IA.' };
  }
}

export async function getEquipmentModels(input: FindEquipmentModelsInput) {
  try {
    const result = await findEquipmentModels(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI model search failed:', JSON.stringify(error, null, 2));
    return { success: false, error: 'Falha ao buscar modelos com IA.' };
  }
}

export async function getEquipmentInsumos(input: FindEquipmentInsumosInput) {
  try {
    const result = await findEquipmentInsumos(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI insumos search failed:', JSON.stringify(error, null, 2));
    return { success: false, error: 'Falha ao buscar insumos com IA.' };
  }
}
