'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating maintenance logs for equipment using GenAI.
 *
 * generateMaintenanceLog - A function that generates a maintenance log based on the provided equipment details and modifications.
 * GenerateMaintenanceLogInput - The input type for the generateMaintenanceLog function.
 * GenerateMaintenanceLogOutput - The return type for the generateMaintenanceLog function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMaintenanceLogInputSchema = z.object({
  equipmentName: z.string().describe('The name of the equipment.'),
  equipmentDescription: z.string().describe('A detailed description of the equipment.'),
  modifications: z.string().describe('A description of the modifications made to the equipment.'),
});
export type GenerateMaintenanceLogInput = z.infer<typeof GenerateMaintenanceLogInputSchema>;

const GenerateMaintenanceLogOutputSchema = z.object({
  logEntry: z.string().describe('The generated maintenance log entry.'),
});
export type GenerateMaintenanceLogOutput = z.infer<typeof GenerateMaintenanceLogOutputSchema>;

export async function generateMaintenanceLog(input: GenerateMaintenanceLogInput): Promise<GenerateMaintenanceLogOutput> {
  return generateMaintenanceLogFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMaintenanceLogPrompt',
  input: {schema: GenerateMaintenanceLogInputSchema},
  output: {schema: GenerateMaintenanceLogOutputSchema},
  prompt: `Você é um especialista em gerar logs de manutenção para equipamentos industriais.

  Sua tarefa é converter uma descrição informal de um serviço de manutenção em uma entrada de log técnica, clara e profissional.

  **Contexto do Equipamento:**
  - **Nome:** {{{equipmentName}}}
  - **Descrição:** {{{equipmentDescription}}}

  **Serviço Realizado (descrito pelo usuário):**
  - "{{{modifications}}}"

  Com base no serviço realizado, gere uma única frase para o campo "logEntry" que resuma a manutenção de forma técnica. Seja específico e formal.

  **Exemplo:**
  - **Se o usuário descreveu:** "troquei o óleo e apertei os parafusos da base"
  - **Seu log gerado poderia ser:** "Realizada a substituição do óleo lubrificante e o reaperto dos parafusos de fixação da base do equipamento."

  Agora, gere a entrada de log para o serviço descrito acima.`,
});

const generateMaintenanceLogFlow = ai.defineFlow(
  {
    name: 'generateMaintenanceLogFlow',
    inputSchema: GenerateMaintenanceLogInputSchema,
    outputSchema: GenerateMaintenanceLogOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
