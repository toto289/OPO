'use server';

/**
 * @fileOverview This file defines a Genkit flow for finding equipment components using GenAI.
 *
 * findEquipmentComponents - A function that generates a list of components for a given equipment model.
 * FindEquipmentComponentsInput - The input type for the findEquipmentComponents function.
 * FindEquipmentComponentsOutput - The return type for the findEquipmentComponents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindEquipmentComponentsInputSchema = z.object({
  equipmentName: z.string().describe('The name of the equipment (e.g., "Masseira").'),
  model: z.string().describe('The specific model of the equipment (e.g., "G. Paniz ME-50").'),
});
export type FindEquipmentComponentsInput = z.infer<typeof FindEquipmentComponentsInputSchema>;

const ComponentSchema = z.object({
    id: z.string().describe("Um ID único para o componente, pode ser o número da peça."),
    name: z.string().describe("O nome do componente."),
    partNumber: z.string().describe("O número da peça (part number) do componente."),
    description: z.string().describe("Uma breve descrição do componente."),
});

const FindEquipmentComponentsOutputSchema = z.object({
  components: z.array(ComponentSchema).describe('A list of components for the specified equipment model.'),
});
export type FindEquipmentComponentsOutput = z.infer<typeof FindEquipmentComponentsOutputSchema>;

export async function findEquipmentComponents(input: FindEquipmentComponentsInput): Promise<FindEquipmentComponentsOutput> {
  return findEquipmentComponentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findEquipmentComponentsPrompt',
  input: {schema: FindEquipmentComponentsInputSchema},
  output: {schema: FindEquipmentComponentsOutputSchema},
  prompt: `Você é um especialista em catalogação de peças e componentes de equipamentos industriais.

  Sua tarefa é listar os principais componentes para um equipamento específico, com base em seu nome e modelo. Gere uma lista plausível de componentes que seriam comumente encontrados nesse tipo de equipamento.

  **Importante**: Use nomes e números de peça (part numbers) que sejam genéricos e críveis para o modelo fornecido. Não use informações de marcas reais se não forem fornecidas. A lista deve estar em português.

  Nome do Equipamento: {{{equipmentName}}}
  Modelo: {{{model}}}

  Gere a lista de componentes.`,
});

const findEquipmentComponentsFlow = ai.defineFlow(
  {
    name: 'findEquipmentComponentsFlow',
    inputSchema: FindEquipmentComponentsInputSchema,
    outputSchema: FindEquipmentComponentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
