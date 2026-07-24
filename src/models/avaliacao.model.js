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
        type: DataTypes.TEXT,
        allowNull: false
       },
       opcoes:{
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false
       },
       gabarito:{
        type: DataTypes.INTEGER,
        allowNull: false
       },
       topico:{
        type: DataTypes.STRING
       },
       habilidade:{
        type: DataTypes.TEXT

       },
       dificuldade:{
        type: DataTypes.STRING
       },
       //'diagnostica', 'progresso'
       tipo: {
        type: DataTypes.STRING,
        allowNull: false
       }
    }, {
        tableName: 'avaliacao_diagnostica',
        timestamps: true,
    }
)
export default Avaliacao_diagnostica;