"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Four_Problem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Four_Problem.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      problem: DataTypes.STRING,
      is_text: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Four_Problem",
    }
  );
  return Four_Problem;
};
