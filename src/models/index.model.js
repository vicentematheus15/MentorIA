import {Usuario} from './usuario.model.js';
import {Avaliacao_diagnostica} from './avaliacao.model.js';
import {Plano} from './plano.model.js'

//um usuário pode ter vários planos (um por trilha/ciclo)
Usuario.hasMany(Plano, { foreignKey: 'usuarioId' });
Plano.belongsTo(Usuario, { foreignKey: 'usuarioId'});

//cada plano tem varias questoes (diagnosticas e/ou de progresso, diferenciadas pela coluna 'tipo')
Plano.hasMany(Avaliacao_diagnostica, { foreignKey: 'planoId' });
Avaliacao_diagnostica.belongsTo(Plano, { foreignKey: 'planoId' });

export { Usuario, Avaliacao_diagnostica, Plano };