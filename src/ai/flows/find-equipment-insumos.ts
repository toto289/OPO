'use server';

/**
 * @fileOverview This file defines a Genkit flow for finding equipment consumables (insumos) using GenAI.
 *
 * findEquipmentInsumos - A function that generates a list of consumables for a given equipment model.
 * FindEquipmentInsumosInput - The input type for the findEquipmentInsumos function.
 * FindEquipmentInsumosOutput - The return type for the findEquipmentInsumos function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindEquipmentInsumosInputSchema = z.object({
  equipmentName: z.string().describe('The name of the equipment (e.g., "Masseira").'),
  model: z.string().describe('The specific model of the equipment (e.g., "G. Paniz ME-50").'),
});
export type FindEquipmentInsumosInput = z.infer<typeof FindEquipmentInsumosInputSchema>;

const InsumoSchema = z.object({
    id: z.string().describe("Um ID único para o insumo, pode ser um código."),
    name: z.string().describe("O nome do insumo (ex: Óleo Lubrificante Mineral ISO VG 68)."),
    type: z.string().describe("O tipo do insumo (ex: Óleo, Graxa, Filtro, Fluído)."),
    description: z.string().describe("Uma breve descrição ou especificação do insumo."),
});

const FindEquipmentInsumosOutputSchema = z.object({
  insumos: z.array(InsumoSchema).describe('A list of consumables for the specified equipment model.'),
});
export type FindEquipmentInsumosOutput = z.infer<typeof FindEquipmentInsumosOutputSchema>;

export async function findEquipmentInsumos(input: FindEquipmentInsumosInput): Promise<FindEquipmentInsumosOutput> {
  return findEquipmentInsumosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findEquipmentInsumosPrompt',
  input: {schema: FindEquipmentInsumosInputSchema},
  output: {schema: FindEquipmentInsumosOutputSchema},
  prompt: `Você é um especialista em manutenção de equipamentos industriais.

  Sua tarefa é listar os principais insumos (como óleos, graxas, filtros, etc.) para um equipamento específico, com base em seu nome e modelo. Gere uma lista curta e plausível de insumos que seriam comumente usados na manutenção preventiva desse tipo de equipamento.

  **Importante**: Use nomes e tipos que sejam genéricos e críveis para o modelo fornecido. Não use informações de marcas reais se não forem fornecidas. A lista deve estar em português.

  Nome do Equipamento: {{{equipmentName}}}
  Modelo: {{{model}}}

  Gere a lista de insumos.`,
});

const findEquipmentInsumosFlow = ai.defineFlow(
  {
    name: 'findEquipmentInsumosFlow',
    inputSchema: FindEquipmentInsumosInputSchema,
    outputSchema: FindEquipmentInsumosOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
