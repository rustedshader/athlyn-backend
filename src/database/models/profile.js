"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Profile.hasMany(models.Certification, { foreignKey: "profileId" });
      Profile.hasMany(models.Achievements, { foreignKey: "profileId" });
    }
  }
  Profile.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: "Users",
          key: "id",
        },
      },
      sports: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      bio: { type: DataTypes.STRING, allowNull: true },
      age: { type: DataTypes.INTEGER, allowNull: true },
      location: { type: DataTypes.STRING, allowNull: true },
      stats: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    },
    {
      sequelize,
      modelName: "Profile",
    }
  );
  return Profile;
};
