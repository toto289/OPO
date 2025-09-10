'use server';

/**
 * @fileOverview This file defines a Genkit flow for improving equipment names using GenAI.
 *
 * improveName - A function that enhances a user-provided name for a piece of equipment.
 * ImproveNameInput - The input type for the improveName function.
 * ImproveNameOutput - The return type for the improveName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveNameInputSchema = z.object({
  currentName: z.string().describe('The user-written name of the equipment.'),
});
export type ImproveNameInput = z.infer<typeof ImproveNameInputSchema>;

const ImproveNameOutputSchema = z.object({
  improvedName: z.string().describe('The AI-generated, improved name.'),
});
export type ImproveNameOutput = z.infer<typeof ImproveNameOutputSchema>;

export async function improveName(input: ImproveNameInput): Promise<ImproveNameOutput> {
  return improveNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveNamePrompt',
  input: {schema: ImproveNameInputSchema},
  output: {schema: ImproveNameOutputSchema},
  prompt: `Você é um especialista em catalogação de equipamentos. Sua tarefa é melhorar e padronizar o nome de um equipamento fornecido pelo usuário.

  O nome gerado deve ser claro e específico. Se o usuário fornecer detalhes como marca, modelo ou especificações, inclua-os de forma padronizada (ex: 'Furadeira de Impacto 1/2" 500W Bosch GSB 550 RE').

  **Importante**: Não invente marcas, modelos ou especificações. Se o nome original for simples (ex: "Masseira"), gere um nome profissional, mas genérico (ex: "Masseira Industrial para Pão").

  Gere o nome aprimorado em português.

  Nome do Usuário: {{{currentName}}}

  Gere um nome aprimorado.`,
});

const improveNameFlow = ai.defineFlow(
  {
    name: 'improveNameFlow',
    inputSchema: ImproveNameInputSchema,
    outputSchema: ImproveNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
