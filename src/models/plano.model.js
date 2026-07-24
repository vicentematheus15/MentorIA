import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";

export const Plano = sequelize.define('Plano',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        trilhaTitulo: {
            type: DataTypes.STRING,
            allowNull: false
        },
        //valores esperados: 'diagnostico_gerado' | 'diagnostico_corrigido' | 'progresso_gerado' | 'progresso_corrigido'
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'diagnostico_gerado'
        },
        // nível geral do usuário nesse plano, de 1 a 5 — calculado após a correção da diagnóstica
        nivel: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'planos',
        timestamps: true
    }
);

export default Plano;