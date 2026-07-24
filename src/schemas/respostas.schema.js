import { z } from "zod";
 
const respostasSchema = z.object({
    respostas: z.array(
        z.object({
            questaoId: z.number().int().positive(),
            resposta: z.number().int().min(0).max(3)
        })
    ).min(1, "Envie pelo menos uma resposta")
});
 
export default respostasSchema;