'use server';

/**
 * @fileOverview This file defines a Genkit flow for improving equipment descriptions using GenAI.
 *
 * improveDescription - A function that enhances a user-provided description for a piece of equipment.
 * ImproveDescriptionInput - The input type for the improveDescription function.
 * ImproveDescriptionOutput - The return type for the improveDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveDescriptionInputSchema = z.object({
  equipmentName: z.string().describe('The name of the equipment.'),
  currentDescription: z.string().describe('The user-written description of the equipment.'),
});
export type ImproveDescriptionInput = z.infer<typeof ImproveDescriptionInputSchema>;

const ImproveDescriptionOutputSchema = z.object({
  improvedDescription: z.string().describe('The AI-generated, improved description.'),
});
export type ImproveDescriptionOutput = z.infer<typeof ImproveDescriptionOutputSchema>;

export async function improveDescription(input: ImproveDescriptionInput): Promise<ImproveDescriptionOutput> {
  return improveDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveDescriptionPrompt',
  input: {schema: ImproveDescriptionInputSchema},
  output: {schema: ImproveDescriptionOutputSchema},
  prompt: `Você é um escritor técnico especialista. Sua tarefa é melhorar e expandir uma descrição de equipamento fornecida pelo usuário.

  A descrição gerada deve ser clara, concisa e profissional. Deve incluir detalhes importantes que seriam relevantes para manutenção e identificação. Não repita apenas a entrada. Adicione detalhes plausíveis com base no nome do equipamento se a descrição original for muito escassa.

  Gere a descrição aprimorada em português.

  Nome do Equipamento: {{{equipmentName}}}
  Descrição do Usuário: {{{currentDescription}}}

  Gere uma descrição aprimorada.`,
});

const improveDescriptionFlow = ai.defineFlow(
  {
    name: 'improveDescriptionFlow',
    inputSchema: ImproveDescriptionInputSchema,
    outputSchema: ImproveDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
