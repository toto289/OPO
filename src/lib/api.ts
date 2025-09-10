
"use server";

import { promises as fs } from 'fs';
import path from 'path';
import type { Equipment, Store, MaintenanceLog, User, WarehouseComponent, WarehouseInsumo } from './types';
import { cache } from 'react';

// Resolve the path to the data files in the `src/data` directory
const equipmentPath = path.join(process.cwd(), 'src/data/equipment.json');
const storesPath = path.join(process.cwd(), 'src/data/stores.json');
const usersPath = path.join(process.cwd(), 'src/data/users.json');
const warehouseComponentsPath = path.join(process.cwd(), 'src/data/warehouse-components.json');
const warehouseInsumosPath = path.join(process.cwd(), 'src/data/warehouse-insumos.json');


// --- Read Functions ---

async function readFileData<T>(filePath: string): Promise<T[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export const getAllEquipment = cache(async (): Promise<Equipment[]> => {
  return readFileData<Equipment>(equipmentPath);
});

export async function getEquipmentById(id: string): Promise<Equipment | undefined> {
  const equipment = await getAllEquipment();
  return equipment.find(e => e.id === id);
}

export const getStores = cache(async (): Promise<Store[]> => {
  return readFileData<Store>(storesPath);
});

export async function getStoreById(id: string): Promise<Store | undefined> {
    const stores = await getStores();
    return stores.find(s => s.id === id);
}

export const getUsers = cache(async (): Promise<User[]> => {
    return readFileData<User>(usersPath);
});

export async function getUserById(id: string): Promise<User | undefined> {
    const users = await getUsers();
    return users.find(u => u.id === id);
}

export const getWarehouseComponents = cache(async (): Promise<WarehouseComponent[]> => {
  return readFileData<WarehouseComponent>(warehouseComponentsPath);
});

export async function getWarehouseComponentByPartNumber(partNumber: string): Promise<WarehouseComponent | undefined> {
    const components = await getWarehouseComponents();
    return components.find(c => c.partNumber === partNumber);
}

export const getWarehouseInsumos = cache(async (): Promise<WarehouseInsumo[]> => {
    return readFileData<WarehouseInsumo>(warehouseInsumosPath);
});

export async function getWarehouseInsumoByName(name: string): Promise<WarehouseInsumo | undefined> {
    const insumos = await getWarehouseInsumos();
    return insumos.find(i => i.name === name);
}


// --- Write Functions ---

async function writeFileData<T>(filePath: string, data: T[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function addEquipment(item: Omit<Equipment, 'maintenanceHistory' | 'preventivePlan'> & { maintenanceHistory: MaintenanceLog[] }): Promise<{success: boolean; data?: Equipment; error?: string}> {
  const equipment = await getAllEquipment();
  if (equipment.some(e => e.id === item.id)) {
    return { success: false, error: "Este número de patrimônio já está em uso." };
  }
  const newItem: Equipment = { ...item, preventivePlan: [] };
  const updatedEquipment = [...equipment, newItem];
  await writeFileData(equipmentPath, updatedEquipment);
  return { success: true, data: newItem };
}

export async function updateEquipment(id: string, updatedData: Partial<Equipment>): Promise<{success: boolean; data?: Equipment; error?: string}> {
  let equipment = await getAllEquipment();
  const equipmentIndex = equipment.findIndex(e => e.id === id);

  if (equipmentIndex === -1) {
    return { success: false, error: "Equipamento não encontrado." };
  }

  // If the ID is being changed, check if the new ID already exists (and isn't the current item)
  if (updatedData.id && updatedData.id !== id && equipment.some(e => e.id === updatedData.id)) {
    return { success: false, error: "Este número de patrimônio já está em uso por outro equipamento." };
  }
  
  equipment[equipmentIndex] = { ...equipment[equipmentIndex], ...updatedData };
  await writeFileData(equipmentPath, equipment);
  return { success: true, data: equipment[equipmentIndex] };
}

export async function deleteEquipment(id: string): Promise<void> {
  let equipment = await getAllEquipment();
  equipment = equipment.filter(e => e.id !== id);
  await writeFileData(equipmentPath, equipment);
}

export async function addMaintenanceLog(equipmentId: string, log: Omit<MaintenanceLog, 'id' | 'date'>): Promise<void> {
  const newLog: MaintenanceLog = {
    ...log,
    id: `log-${Date.now()}`,
    date: new Date().toISOString(),
  };

  let equipmentList = await getAllEquipment();
  const equipmentIndex = equipmentList.findIndex(item => item.id === equipmentId);

  if (equipmentIndex > -1) {
    const equipment = equipmentList[equipmentIndex];
    if (!equipment.maintenanceHistory) {
        equipment.maintenanceHistory = [];
    }
    equipment.maintenanceHistory.unshift(newLog);
    equipmentList[equipmentIndex] = equipment;
    await writeFileData(equipmentPath, equipmentList);
  } else {
    throw new Error("Equipment not found");
  }
}

export async function addStore(store: Omit<Store, 'id'>): Promise<Store> {
    const stores = await getStores();
    const newStore: Store = {
        ...store,
        id: `loja-${stores.length + 1}`
    };
    const updatedStores = [...stores, newStore];
    await writeFileData(storesPath, updatedStores);
    return newStore;
}

export async function updateStore(id: string, updatedStoreData: Partial<Store>): Promise<void> {
    let stores = await getStores();
    stores = stores.map(s => s.id === id ? { ...s, ...updatedStoreData } : s);
    await writeFileData(storesPath, stores);
}

export async function deleteStore(id: string): Promise<{ success: boolean; message?: string }> {
    const equipment = await getAllEquipment();
    if (equipment.some(e => e.storeId === id)) {
        return { success: false, message: 'Esta loja não pode ser excluída pois há equipamentos associados a ela.' };
    }
    let stores = await getStores();
    stores = stores.filter(s => s.id !== id);
    await writeFileData(storesPath, stores);
    return { success: true };
}

export async function addUser(newUser: Omit<User, 'id' | 'avatarUrl'>): Promise<{success: boolean; data?: User; error?: string}> {
  const users = await getUsers();
  if (users.some(u => u.email === newUser.email)) {
    return { success: false, error: 'Este e-mail já está em uso.' };
  }

  const generatedId = `user-${newUser.name.toLowerCase().replace(/\s/g, '-')}-${Math.floor(Math.random() * 1000)}`;
  
  const userToAdd: User = {
    ...newUser,
    id: generatedId,
    avatarUrl: "",
    cargo: newUser.cargo || "",
  };

  const updatedUsers = [...users, userToAdd];
  await writeFileData(usersPath, updatedUsers);
  return { success: true, data: userToAdd };
}

export async function updateUser(id: string, updatedUserData: Partial<User>): Promise<{success: boolean; data?: User; error?: string}> {
    let users = await getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
        return { success: false, error: 'Usuário não encontrado.' };
    }
    users[userIndex] = { ...users[userIndex], ...updatedUserData };
    await writeFileData(usersPath, users);
    return { success: true, data: users[userIndex] };
}


// --- WAREHOUSE Functions ---

export async function addWarehouseComponent(component: WarehouseComponent): Promise<{success: boolean, error?: string}> {
    const components = await getWarehouseComponents();
    if (components.some(c => c.partNumber === component.partNumber)) {
        return { success: false, error: "Um componente com este Part Number já existe." };
    }
    const updatedComponents = [...components, component];
    await writeFileData(warehouseComponentsPath, updatedComponents);
    return { success: true };
}

export async function addWarehouseInsumo(insumo: Omit<WarehouseInsumo, 'id'>): Promise<{success: boolean, data?: WarehouseInsumo, error?: string}> {
    const insumos = await getWarehouseInsumos();
    if (insumos.some(i => i.name.toLowerCase() === insumo.name.toLowerCase())) {
        return { success: false, error: "Um insumo com este nome já existe." };
    }
    const newInsumo: WarehouseInsumo = {
        ...insumo,
        id: `insumo-${Date.now()}`
    };
    const updatedInsumos = [...insumos, newInsumo];
    await writeFileData(warehouseInsumosPath, updatedInsumos);
    return { success: true, data: newInsumo };
}

export async function updateWarehouseComponent(partNumber: string, updatedData: Partial<WarehouseComponent>): Promise<{success: boolean, error?: string}> {
    let components = await getWarehouseComponents();
    const index = components.findIndex(c => c.partNumber === partNumber);
    if (index === -1) {
        return { success: false, error: "Componente não encontrado." };
    }
    components[index] = { ...components[index], ...updatedData };
    await writeFileData(warehouseComponentsPath, components);
    return { success: true };
}

export async function updateWarehouseInsumo(id: string, updatedData: Partial<WarehouseInsumo>): Promise<{success: boolean, error?: string}> {
    let insumos = await getWarehouseInsumos();
    const index = insumos.findIndex(i => i.id === id);
    if (index === -1) {
        return { success: false, error: "Insumo não encontrado." };
    }
    insumos[index] = { ...insumos[index], ...updatedData };
    await writeFileData(warehouseInsumosPath, insumos);
    return { success: true };
}
