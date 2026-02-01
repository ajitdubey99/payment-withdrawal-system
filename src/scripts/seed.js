/**
 * Database Seeder
 * 
 * Seeds the database with initial test data.
 * Creates users and wallets for testing purposes.
 * 
 * Usage:
 *   node src/scripts/seed.js
 */

const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const logger = require('../utils/logger');
const { USER_STATUS, CURRENCY } = require('../constants');

/**
 * Sample users data
 */
const users = [
  {
    email: 'john.doe@example.com',
    name: 'John Doe',
    status: USER_STATUS.ACTIVE
  },
  {
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    status: USER_STATUS.ACTIVE
  },
  {
    email: 'bob.wilson@example.com',
    name: 'Bob Wilson',
    status: USER_STATUS.ACTIVE
  },
  {
    email: 'alice.johnson@example.com',
    name: 'Alice Johnson',
    status: USER_STATUS.SUSPENDED
  },
  {
    email: 'charlie.brown@example.com',
    name: 'Charlie Brown',
    status: USER_STATUS.BLOCKED
  }
];

/**
 * Seed users and wallets
 */
async function seedDatabase() {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Connected to database for seeding');
    
    await User.deleteMany({});
    await Wallet.deleteMany({});
    logger.info('Cleared existing data');
    
    const createdUsers = [];
    
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      
      const initialBalance = Math.floor(Math.random() * 100000) + 10000;
      
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
    
    console.log('\n=================================');
    console.log('Database Seeded Successfully!');
    console.log('=================================\n');
    console.log('Created Users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.email} (${user.status})`);
    });
    console.log('\nYou can now start the application.');
    console.log('=================================\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database', { error: error.message });
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
