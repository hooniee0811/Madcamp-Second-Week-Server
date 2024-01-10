"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Movie_Problem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Movie_Problem.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      problem: DataTypes.STRING,
      answer: DataTypes.STRING,
      is_text: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Movie_Problem",
    }
  );
  return Movie_Problem;
};
