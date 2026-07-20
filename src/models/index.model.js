import {Usuario} from './usuario.model.js';
import {Avaliacao_diagnostica} from './avaliacao.model.js';

Usuario.hasMany(Avaliacao_diagnostica, { foreignKey: 'usuarioId' });
Avaliacao_diagnostica.belongsTo(Usuario, { foreignKey: 'usuarioId'});

export { Usuario, Avaliacao_diagnostica }