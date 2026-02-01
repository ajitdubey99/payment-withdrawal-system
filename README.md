# Payment Withdrawal System

## Overview
A secure, scalable, and concurrency-safe payment withdrawal module built with Node.js, Express.js, and MongoDB. This system handles financial transactions with guaranteed data integrity, preventing race conditions, double spending, and ensuring atomic operations.

## Architecture

### Layered Architecture
```
src/
├── config/          # Configuration management
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── repositories/    # Data access layer
├── models/          # Database schemas
├── middleware/      # Express middleware
├── validators/      # Input validation
├── utils/           # Utility functions
├── jobs/            # Background job processors
└── constants/       # Application constants
```

### Design Patterns
- **Repository Pattern**: Abstracts data access logic
- **Service Layer**: Contains business logic separate from controllers
- **Dependency Injection**: Loose coupling between components
- **Factory Pattern**: For creating transaction records
- **Strategy Pattern**: For different payment processing strategies

## Key Features

### 1. Concurrency Control
- **MongoDB Transactions**: ACID guarantees for multi-document operations
- **Optimistic Locking**: Version-based concurrency control
- **Distributed Locking**: Redis-based locks for critical sections
- **Idempotency Keys**: Prevents duplicate request processing

### 2. Security Measures
- **Input Validation**: Joi-based schema validation
- **Query Injection Prevention**: Parameterized queries and sanitization
- **Mass Assignment Protection**: Explicit field whitelisting
- **Request Replay Prevention**: Idempotency key tracking
- **Data Integrity**: Cryptographic hashing for tamper detection

### 3. Transaction Safety
- **Atomic Operations**: All-or-nothing balance updates
- **Immutable Audit Logs**: Insert-only transaction history
- **Balance Validation**: Prevents negative balances
- **State Machine**: Controlled withdrawal status transitions
- **Retry Mechanisms**: Exponential backoff for failures

### 4. Scalability
- **Horizontal Scaling**: Stateless API design
- **Background Jobs**: Bull queue for async processing
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching Ready**: Redis integration prepared

## Technical Decisions

### Why MongoDB Transactions?
MongoDB 4.0+ supports multi-document ACID transactions. We use them for:
- Atomic balance deduction + transaction record creation
- Guaranteed consistency across wallet and withdrawal collections
- Rollback capability on failures

### Concurrency Strategy
1. **Version Field**: Each wallet has a version number incremented on update
2. **Optimistic Locking**: Detect concurrent modifications before commit
3. **Idempotency Keys**: Client-provided unique request identifiers
4. **Transaction Isolation**: MongoDB transactions provide snapshot isolation

### Security Approach
1. **Input Sanitization**: All inputs validated against strict schemas
2. **Whitelisting**: Only allowed fields accepted in requests
3. **Integrity Hashing**: Transaction data hashed to detect tampering
4. **Rate Limiting**: Prevents abuse and DoS attacks
5. **Audit Trail**: Comprehensive logging for security analysis

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  name: String,
  status: String (active/suspended/blocked),
  createdAt: Date,
  updatedAt: Date
}
```

### Wallets Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (unique, indexed),
  balance: Decimal128,
  currency: String,
  version: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Withdrawals Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  amount: Decimal128,
  destination: Object,
  status: String (pending/processing/success/failed),
  idempotencyKey: String (unique, indexed),
  integrityHash: String,
  failureReason: String,
  processedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### TransactionLogs Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  transactionType: String,
  referenceId: ObjectId,
  amount: Decimal128,
  balanceBefore: Decimal128,
  balanceAfter: Decimal128,
  status: String,
  metadata: Object,
  timestamp: Date (indexed)
}
```

## Installation

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 4.4 (for transaction support)
- Redis >= 6.x (optional, for distributed locking)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd payment-withdrawal-system

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations/seeders
npm run db:seed

# Start the application
npm start

# For development with auto-reload
npm run dev
```

## Environment Variables
```
NODE_ENV=development
PORT=3000

MONGODB_URI=mongodb://localhost:27017/payment_withdrawal
MONGODB_MAX_POOL_SIZE=10

REDIS_HOST=localhost
REDIS_PORT=6379

LOG_LEVEL=info

WITHDRAWAL_MIN_AMOUNT=10
WITHDRAWAL_MAX_AMOUNT=100000
```

## API Endpoints

### 1. Create Withdrawal Request
```
POST /api/v1/withdrawals
Content-Type: application/json
X-Idempotency-Key: unique-request-id

{
  "userId": "user_id_here",
  "amount": 1000.50,
  "destination": {
    "accountNumber": "1234567890",
    "ifscCode": "ABCD0123456",
    "accountHolderName": "John Doe"
  }
}

Response 201:
{
  "success": true,
  "data": {
    "withdrawalId": "...",
    "status": "pending",
    "amount": 1000.50,
    "createdAt": "..."
  }
}
```

### 2. Get Withdrawal Status
```
GET /api/v1/withdrawals/:withdrawalId

Response 200:
{
  "success": true,
  "data": {
    "withdrawalId": "...",
    "status": "success",
    "amount": 1000.50,
    "processedAt": "..."
  }
}
```

### 3. Get User Wallet
```
GET /api/v1/wallets/:userId

Response 200:
{
  "success": true,
  "data": {
    "userId": "...",
    "balance": 5000.00,
    "currency": "INR"
  }
}
```

### 4. Get Transaction History
```
GET /api/v1/transactions?userId=xxx&page=1&limit=20

Response 200:
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load
```

## Monitoring & Logging

- **Winston Logger**: Structured logging with different levels
- **Request Logging**: All API requests logged with correlation IDs
- **Error Tracking**: Detailed error logs with stack traces
- **Performance Metrics**: Response times and database query metrics

## Production Deployment

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] MongoDB replica set enabled (for transactions)
- [ ] Redis configured for distributed locking
- [ ] Log aggregation setup
- [ ] Monitoring and alerting configured
- [ ] Load balancer configured
- [ ] Rate limiting enabled

### Scaling Considerations
1. **Horizontal Scaling**: Deploy multiple API instances behind load balancer
2. **Database Sharding**: Shard by userId for large-scale operations
3. **Read Replicas**: Use MongoDB read replicas for transaction history queries
4. **Background Jobs**: Scale Bull queue workers independently
5. **Caching**: Implement Redis caching for frequently accessed data

## Security Hardening

1. **Update Dependencies**: Regularly run `npm audit`
2. **Environment Secrets**: Use secrets management (AWS Secrets Manager, Vault)
3. **HTTPS Only**: Force SSL/TLS in production
4. **Rate Limiting**: Implement aggressive rate limiting
5. **IP Whitelisting**: For admin endpoints
6. **Security Headers**: Use Helmet.js middleware
7. **Input Sanitization**: Never trust client input

## Known Limitations

1. **Payment Gateway**: Currently mocked, requires integration with real provider
2. **KYC Verification**: Assumes users are pre-verified
3. **Currency Conversion**: Single currency support (extensible)
4. **Webhook Handling**: Not implemented (for real gateway callbacks)

## Future Enhancements

- [ ] Multi-currency support
- [ ] Scheduled withdrawals
- [ ] Withdrawal limits (daily/monthly)
- [ ] Fee calculation engine
- [ ] Refund/reversal mechanisms
- [ ] Real-time notifications
- [ ] GraphQL API
- [ ] Admin dashboard

## Support

For issues and questions:
- Create an issue in the repository
- Contact: support@example.com

## License

MIT License
