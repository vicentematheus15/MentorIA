import { Router } from "express";
import * as controller from '../controllers/auth.controller.js';
import {limitadorCadastro, limitadorLogin} from '../config/rateLimit.js';
import dadosValidador from "../middlewares/dados.validador.js";
import cadastroSchema from "../schemas/cadastro.schema.js";
import loginSchema from "../schemas/login.schema.js";


const authRoutes = Router();

//rotas publicas
authRoutes.post('/cadastro', limitadorCadastro, dadosValidador(cadastroSchema), controller.cadastrar);
authRoutes.post('/login', limitadorLogin, dadosValidador(loginSchema), controller.login);

export default authRoutes;