"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Achievements extends Model {
    static associate(models) {
      Achievements.belongsTo(models.Profile, { foreignKey: "profileId" });
    }
  }
  Achievements.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      profileId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Profile",
          key: "id",
        },
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: "Achievements",
    }
  );
  return Achievements;
};
