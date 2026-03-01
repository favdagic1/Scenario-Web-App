const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('scenariopro', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
    define: {
        timestamps: false,
        freezeTableName: true
    }
});

module.exports = sequelize;
