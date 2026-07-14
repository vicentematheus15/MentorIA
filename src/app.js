import 'dotenv/config';
import sequelize from './database/database.js';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import avaliacaoRoutes from './routes/avaliacao.routes.js';
import cors from 'cors';
import { limitadorGlobal } from './config/rateLimit.js';
import { helmetConfig } from './config/helmet.js';
import { corsConfig } from './config/cors.js';

//importa o model para garantir registro no sequelize
import './models/usuario.model.js';

const app = express();

app.use(cors(corsConfig)); //variavel com todas as configurações de segurança do cors
app.use(helmetConfig); //variavel com todas as configurações de segurança do helmet
app.use(limitadorGlobal); //limitador global de requisições

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/avaliacao', avaliacaoRoutes)

sequelize.sync({alter: true}).then(() => {
    app.listen(process.env.API_PORT, () => 
        console.log(`Servidor rodando em http://localhost:${process.env.API_PORT}`)
    );
});