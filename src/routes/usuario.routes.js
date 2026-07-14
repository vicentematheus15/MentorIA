import { Router } from "express";
import * as controller from '../controllers/usuario.controller.js';
import {autenticar} from '../middlewares/auth.middleware.js';
import { limitadorGetPerfil, limitadorPutPerfil, limitadorDeleteConta } from '../config/rateLimit.js';

const usuarioRoutes = Router();

//rotas privadas
usuarioRoutes.get('/perfil', limitadorGetPerfil, autenticar, controller.perfil);
usuarioRoutes.put('/perfil', limitadorPutPerfil, autenticar, controller.atualizarPerfil);
usuarioRoutes.delete('/conta', limitadorDeleteConta, autenticar, controller.desativarConta);

export default usuarioRoutes;