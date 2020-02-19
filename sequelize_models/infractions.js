const infractions = function(sequelize, DataTypes) {
    return sequelize.define('infractions', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true },
        infractionsCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0 }
    })
}

module.exports = infractions;
