import { email } from "zod";
import cadastroSchema from "./cadastro.schema.js";
import { _email } from "zod/v4/core";

const loginSchema = cadastroSchema.pick({email: true, senha: true})

export default loginSchema;
