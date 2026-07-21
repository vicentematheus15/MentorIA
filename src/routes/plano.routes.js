import { Router } from "express";
import * as controller from '../controllers/avaliacao.controller.js';
import {autenticar} from '../middlewares/auth.middleware.js';

const avaliacaoRoutes = Router();

avaliacaoRoutes.post('/diagnostica', autenticar, controller.gerar);

export default avaliacaoRoutes;