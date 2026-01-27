'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Frame', {
      id: { 
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      eventDate: {
        type: Sequelize.DATEONLY, // DATEONLY car on ne stocke pas l'heure
        allowNull: false
      },
      context: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.JSONB, // JSONB est parfait pour le JSON de Tiptap
        allowNull: false
      },
      docUrl: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });

  },

  down: async (queryInterface, Sequelize) => {
   // await queryInterface.dropTable('Frame');
  }
};
