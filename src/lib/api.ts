"use server";

import db from './db';
import type { Equipment, Store, MaintenanceLog, User, WarehouseComponent, WarehouseInsumo } from './types';
import { cache } from 'react';

// --- Equipment ---
export const getAllEquipment = cache(async (): Promise<Equipment[]> => {
  const res = await db.query<{ data: Equipment }>('SELECT data FROM equipment');
  return res.rows.map(r => r.data);
});

export async function getEquipmentById(id: string): Promise<Equipment | undefined> {
  const res = await db.query<{ data: Equipment }>('SELECT data FROM equipment WHERE id = $1', [id]);
  return res.rows[0]?.data;
}

export async function addEquipment(
  item: Omit<Equipment, 'maintenanceHistory' | 'preventivePlan'> & { maintenanceHistory: MaintenanceLog[] }
): Promise<{ success: boolean; data?: Equipment; error?: string }> {
  const newItem: Equipment = { ...item, preventivePlan: [] };
  try {
    await db.query('INSERT INTO equipment (id, data) VALUES ($1, $2)', [newItem.id, newItem]);
    return { success: true, data: newItem };
  } catch (err: any) {
    if (err.code === '23505') {
      return { success: false, error: 'Este número de patrimônio já está em uso.' };
    }
    throw err;
  }
}

export async function updateEquipment(
  id: string,
  updatedData: Partial<Equipment>
): Promise<{ success: boolean; data?: Equipment; error?: string }> {
  const existing = await getEquipmentById(id);
  if (!existing) {
    return { success: false, error: 'Equipamento não encontrado.' };
  }

  if (updatedData.id && updatedData.id !== id) {
    const check = await getEquipmentById(updatedData.id);
    if (check) {
      return { success: false, error: 'Este número de patrimônio já está em uso por outro equipamento.' };
    }
  }

  const updated: Equipment = { ...existing, ...updatedData };
  await db.query('UPDATE equipment SET id = $2, data = $3 WHERE id = $1', [id, updated.id, updated]);
  return { success: true, data: updated };
}

export async function deleteEquipment(id: string): Promise<void> {
  await db.query('DELETE FROM equipment WHERE id = $1', [id]);
}

export async function addMaintenanceLog(
  equipmentId: string,
  log: Omit<MaintenanceLog, 'id' | 'date'>
): Promise<void> {
  const equipment = await getEquipmentById(equipmentId);
  if (!equipment) {
    throw new Error('Equipment not found');
  }

  const newLog: MaintenanceLog = {
    ...log,
    id: `log-${Date.now()}`,
    date: new Date().toISOString(),
  };

  equipment.maintenanceHistory = equipment.maintenanceHistory ?? [];
  equipment.maintenanceHistory.unshift(newLog);
  await db.query('UPDATE equipment SET data = $2 WHERE id = $1', [equipment.id, equipment]);
}

// --- Stores ---
export const getStores = cache(async (): Promise<Store[]> => {
  const res = await db.query<{ data: Store }>('SELECT data FROM stores');
  return res.rows.map(r => r.data);
});

export async function getStoreById(id: string): Promise<Store | undefined> {
  const res = await db.query<{ data: Store }>('SELECT data FROM stores WHERE id = $1', [id]);
  return res.rows[0]?.data;
}

export async function addStore(store: Omit<Store, 'id'>): Promise<Store> {
  const stores = await getStores();
  const newStore: Store = { ...store, id: `loja-${stores.length + 1}` };
  await db.query('INSERT INTO stores (id, data) VALUES ($1, $2)', [newStore.id, newStore]);
  return newStore;
}

export async function updateStore(id: string, updatedStoreData: Partial<Store>): Promise<void> {
  const store = await getStoreById(id);
  if (!store) return;
  const updated = { ...store, ...updatedStoreData };
  await db.query('UPDATE stores SET data = $2 WHERE id = $1', [id, updated]);
}

export async function deleteStore(id: string): Promise<{ success: boolean; message?: string }> {
  const equipment = await getAllEquipment();
  if (equipment.some(e => e.storeId === id)) {
    return { success: false, message: 'Esta loja não pode ser excluída pois há equipamentos associados a ela.' };
  }
  await db.query('DELETE FROM stores WHERE id = $1', [id]);
  return { success: true };
}

// --- Users ---
export const getUsers = cache(async (): Promise<User[]> => {
  const res = await db.query<{ data: User }>('SELECT data FROM users');
  return res.rows.map(r => r.data);
});

export async function getUserById(id: string): Promise<User | undefined> {
  const res = await db.query<{ data: User }>('SELECT data FROM users WHERE id = $1', [id]);
  return res.rows[0]?.data;
}

export async function addUser(
  newUser: Omit<User, 'id' | 'avatarUrl'>
): Promise<{ success: boolean; data?: User; error?: string }> {
  const users = await getUsers();
  if (users.some(u => u.email === newUser.email)) {
    return { success: false, error: 'Este e-mail já está em uso.' };
  }

  const generatedId = `user-${newUser.name.toLowerCase().replace(/\s/g, '-')}-${Math.floor(Math.random() * 1000)}`;

  const userToAdd: User = {
    ...newUser,
    id: generatedId,
    avatarUrl: '',
    cargo: newUser.cargo || '',
  };

  await db.query('INSERT INTO users (id, data) VALUES ($1, $2)', [userToAdd.id, userToAdd]);
  return { success: true, data: userToAdd };
}

export async function updateUser(
  id: string,
  updatedUserData: Partial<User>
): Promise<{ success: boolean; data?: User; error?: string }> {
  const user = await getUserById(id);
  if (!user) {
    return { success: false, error: 'Usuário não encontrado.' };
  }
  const updated = { ...user, ...updatedUserData };
  await db.query('UPDATE users SET data = $2 WHERE id = $1', [id, updated]);
  return { success: true, data: updated };
}

// --- Warehouse Components ---
export const getWarehouseComponents = cache(async (): Promise<WarehouseComponent[]> => {
  const res = await db.query<{ data: WarehouseComponent }>('SELECT data FROM warehouse_components');
  return res.rows.map(r => r.data);
});

export async function getWarehouseComponentByPartNumber(
  partNumber: string
): Promise<WarehouseComponent | undefined> {
  const res = await db.query<{ data: WarehouseComponent }>(
    'SELECT data FROM warehouse_components WHERE part_number = $1',
    [partNumber]
  );
  return res.rows[0]?.data;
}

// --- Warehouse Insumos ---
export const getWarehouseInsumos = cache(async (): Promise<WarehouseInsumo[]> => {
  const res = await db.query<{ data: WarehouseInsumo }>('SELECT data FROM warehouse_insumos');
  return res.rows.map(r => r.data);
});

export async function getWarehouseInsumoByName(
  name: string
): Promise<WarehouseInsumo | undefined> {
  const res = await db.query<{ data: WarehouseInsumo }>(
    "SELECT data FROM warehouse_insumos WHERE data->>'name' = $1",
    [name]
  );
  return res.rows[0]?.data;
}
