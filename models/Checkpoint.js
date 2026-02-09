const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Checkpoint = sequelize.define('Checkpoint', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    scenarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Scenario',
            key: 'id'
        }
    },
    timestamp: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'Checkpoint'
});

module.exports = Checkpoint;
