/**
 * Database Seeder
 * 
 * This script fills the database with sample data.
 * Useful for local testing and development.
 * 
 * Run using:
 *   node src/scripts/seed.js
 */

const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const logger = require('../utils/logger');
const { USER_STATUS, CURRENCY } = require('../constants');

/**
 * Sample users for testing
 */
const users = [
  {
    email: 'ajit.dubey@example.com',
    name: 'Ajit Dubey',
    status: USER_STATUS.ACTIVE
  },
  {
    email: 'deepak.dubey@example.com',
    name: 'Deepak Dubey',
    status: USER_STATUS.ACTIVE
  },
  {
    email: 'manoj.kumar@example.com',
    name: 'Manoj Kumar',
    status: USER_STATUS.ACTIVE
  },
  {
    email: 'mohan.sharma@example.com',
    name: 'Mohan Sharma',
    status: USER_STATUS.SUSPENDED
  },
  {
    email: 'prince.verma@example.com',
    name: 'Prince Verma',
    status: USER_STATUS.BLOCKED
  }
];

/**
 * Seeds users and wallets
 */
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      config.mongodb.uri,
      config.mongodb.options
    );
    logger.info('Connected to database for seeding');

    // Remove old data
    await User.deleteMany({});
    await Wallet.deleteMany({});
    logger.info('Cleared existing data');

    const createdUsers = [];

    // Create users and wallets
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);

      const initialBalance =
        Math.floor(Math.random() * 100000) + 10000;

      await Wallet.create({
        userId: user._id,
        balance: initialBalance.toString(),
        currency: CURRENCY.INR,
        version: 0
      });

      logger.info('Created user and wallet', {
        email: user.email,
        balance: initialBalance
      });
    }

    logger.info('Database seeded successfully', {
      usersCreated: createdUsers.length
    });

    // Pretty console output
    console.log('\n=================================');
    console.log('Database Seeded Successfully!');
    console.log('=================================\n');
    console.log('Created Users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.email} (${user.status})`);
    });
    console.log('\nYou can now start the application.');
    console.log('=================================\n');

    // Close DB connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database', {
      error: error.message
    });
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();