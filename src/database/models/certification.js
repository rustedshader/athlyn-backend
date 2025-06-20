"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Certification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Certification.belongsTo(models.Profile, { foreignKey: "profileId" });
    }
  }
  Certification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      fileUrl: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      issuedBy: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      timestamps: true,
      modelName: "Certification",
    }
  );
  return Certification;
};
