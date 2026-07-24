import { Router } from "express";
import * as controller from '../controllers/plano.controller.js';
import {autenticar} from '../middlewares/auth.middleware.js';
import { limitadorListarPlanos, limitadorGerarDiagnostica, limitadorGerarProgresso, limitadorEnviarDiagnostica, limitadorEnviarProgresso } from '../config/rateLimit.js'


const planoRoutes = Router();

planoRoutes.get('/', limitadorListarPlanos, autenticar, controller.listar);
planoRoutes.post('/diagnostica', limitadorGerarDiagnostica, autenticar, controller.gerarDiagnostica);
planoRoutes.post('/:id/progresso', limitadorGerarProgresso, autenticar, controller.gerarProgresso);
planoRoutes.post('/:id/diagnostica/enviar', limitadorEnviarDiagnostica, autenticar, controller.enviarDiagnostica);
planoRoutes.post('/:id/progresso/enviar', limitadorEnviarProgresso, autenticar, controller.enviarProgresso);

export default planoRoutes;