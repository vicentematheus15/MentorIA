import {z} from "zod";

const cadastroSchema = z.object({
    nome: z.string()
    .trim()
    .min(2, "O nome deve ter no mínimo 2 caracteres")
    .max(20, "O nome deve ter no máximo 20 caracteres"),
    email: z.email("Insira um email válido")
    .toLowerCase(),
    senha: z.string()
    .min(6, "A senha deve ter no mínimo 6 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres")
});

export default cadastroSchema;