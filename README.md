# Payment Withdrawal System

## Overview

This project is a secure and scalable Payment Withdrawal backend system built using Node.js and MongoDB.

The main purpose of this system is to simulate how real-world payment applications handle withdrawals safely.  
There is no frontend UI — the focus is purely on backend logic, data safety, and system design.

This system ensures:
- Users cannot withdraw more than their balance.
- Concurrent requests do not cause double spending.
- Every transaction is permanently logged for auditing.

---

## Core Idea

Think of this system as a digital wallet engine.

When a user tries to withdraw money:
1. The system checks if the user exists and is active.
2. It checks wallet balance.
3. It ensures the request is not duplicated.
4. It deducts money and creates logs in one atomic operation.
5. If anything fails, everything is rolled back.

Either everything succeeds, or nothing changes.

---

## Architecture

Controller → Service → Repository → Database

Each layer has one responsibility only.

---

## Project Structure

src/
config/          Environment and database config  
controllers/     API request handlers  
services/        Business logic  
repositories/    Database operations  
models/          Mongoose schemas  
middleware/      Logging, rate limiting, error handling  
validators/      Joi input validation  
utils/           Logger, security helpers, custom errors  

---

## Database Design

Collections:
- users
- wallets
- withdrawals
- transaction_logs

Important points:
- Wallet uses Decimal128 for financial precision.
- Transaction logs are immutable.
- Indexes added for performance.

---

## Concurrency Handling

This system is designed to handle multiple simultaneous requests safely.

Techniques used:
- MongoDB transactions
- Optimistic locking using version field
- Idempotency keys for duplicate prevention

---

## Security

Security layers:
- Joi input validation
- MongoDB injection protection
- Data integrity hashing
- Strict withdrawal status flow

---

## Setup

Prerequisites:
- Node.js v18+
- MongoDB v4.4+ (Replica set)

Installation:
npm install

Seed data:
npm run db:seed

Start server:
npm start

---

## API Example

POST /api/v1/withdrawals

Headers:
X-Idempotency-Key: unique-id

Body:
{
  "userId": "USER_ID",
  "amount": 500,
  "destination": {
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234",
    "accountHolderName": "Rahul Kumar"
  }
}

---

## Error Handling

All errors use custom classes and return a consistent format.

---

## Conclusion

This project focuses on correctness, safety, and real-world backend design.
It reflects how real fintech systems handle money operations.