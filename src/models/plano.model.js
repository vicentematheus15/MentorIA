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
        }
    }, {
        tableName: 'planos',
        timestamps: true
    }
);

export default Plano;