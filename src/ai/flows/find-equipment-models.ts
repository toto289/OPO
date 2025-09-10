'use server';

/**
 * @fileOverview This file defines a Genkit flow for finding equipment models using GenAI.
 *
 * findEquipmentModels - A function that generates a list of models for a given equipment name.
 * FindEquipmentModelsInput - The input type for the findEquipmentModels function.
 * FindEquipmentModelsOutput - The return type for the findEquipmentModels function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindEquipmentModelsInputSchema = z.object({
  equipmentName: z.string().describe('The name of the equipment (e.g., "Masseira Industrial").'),
});
export type FindEquipmentModelsInput = z.infer<typeof FindEquipmentModelsInputSchema>;

const FindEquipmentModelsOutputSchema = z.object({
  models: z.array(z.string()).describe('A list of plausible models for the specified equipment.'),
});
export type FindEquipmentModelsOutput = z.infer<typeof FindEquipmentModelsOutputSchema>;

export async function findEquipmentModels(input: FindEquipmentModelsInput): Promise<FindEquipmentModelsOutput> {
  return findEquipmentModelsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findEquipmentModelsPrompt',
  input: {schema: FindEquipmentModelsInputSchema},
  output: {schema: FindEquipmentModelsOutputSchema},
  prompt: `Você é um especialista em catalogação de equipamentos industriais.

  Sua tarefa é listar 5 modelos comuns e plausíveis para um tipo de equipamento, com base em seu nome. Gere apenas os nomes dos modelos.

  **Importante**: Use nomes de modelos que sejam críveis e representativos para o tipo de equipamento. Não precisa inventar marcas, mas os modelos devem parecer realistas. A lista deve estar em português.

  Nome do Equipamento: {{{equipmentName}}}

  Gere a lista de 5 modelos.`,
});

const findEquipmentModelsFlow = ai.defineFlow(
  {
    name: 'findEquipmentModelsFlow',
    inputSchema: FindEquipmentModelsInputSchema,
    outputSchema: FindEquipmentModelsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
