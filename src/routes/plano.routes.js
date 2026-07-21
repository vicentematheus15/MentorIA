import { Router } from "express";
import * as controller from '../controllers/plano.controller.js';
import {autenticar} from '../middlewares/auth.middleware.js';
import { limitadorListarPlanos, limitadorGerarDiagnostica, limitadorGerarProgresso, limitadorEnviarDiagnostica, limitadorEnviarProgresso } from '../config/rateLimit.js'


const planoRoutes = Router();

planoRoutes.get('/', limitadorListarPlanos, autenticar, controller.listar)
planoRoutes.post('/diagnostica', autenticar, controller.gerar);
planoRoutes
planoRoutes
planoRoutes
export default avaliacaoRoutes;