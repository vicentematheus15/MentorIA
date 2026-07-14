import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";

export const Avaliacao_diagnostica = sequelize.define('Avaliacao_diagnostica',
    {
       id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
       },
       enunciado: {
        type: DataTypes.STRING,
        allowNull: false
       },
       opcoes:{
        type: DataTypes.ARRAY
       },
       gabarito:{
        type: DataTypes.INTEGER
       },
       topico:{
        type: DataTypes.STRING
       },
       habilidade:{
        type: DataTypes.STRING

       },
       dificuldade:{

       }

    }, {
        tableName: 'avaliacao_diagnostica',
        timestamps: true,
    }
)