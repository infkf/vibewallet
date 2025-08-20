# VibewWallet Test Suite

This directory contains comprehensive tests for the VibewWallet expense tracking application.

## Test Organization

We follow modern testing conventions with clean, human-readable structure:

```
vibewallet/
├── utils.test.ts                              # Unit tests (co-located)
└── tests/                                     # Integration & specialized tests
    ├── integration/
    │   ├── simpleStorage.integration.test.ts  # Storage layer tests
    │   └── dataFlow.integration.test.ts       # Business logic tests
    └── README.md                              # This file
```

### Why This Structure?

- **Co-location**: Unit tests (`utils.test.ts`) live next to source files for easy maintenance
- **Dedicated folder**: Integration tests in clean `tests/` directory (not ugly `__tests__`)
- **Clear naming**: Human-readable folder names, descriptive test file names

## Test Coverage

### 🧪 Unit Tests (12 tests)

**Location**: `../utils.test.ts`

✅ UUID generation and validation  
✅ Date range calculations (current month start/end)  
✅ Currency formatting (USD, EUR, JPY, invalid codes)  
✅ Date parsing for Money Tracker imports  
✅ Color generation for categories  
✅ ISO date string formatting

### 🔗 Storage Integration (10 tests)

**Location**: `integration/simpleStorage.integration.test.ts`

✅ Data loading and saving to AsyncStorage  
✅ Empty storage initialization  
✅ Corrupted data recovery  
✅ Storage failure error handling  
✅ Schema version validation  
✅ Large dataset performance (1000+ transactions)  
✅ Concurrent storage operations  
✅ Decimal precision preservation  
✅ Round-trip data integrity  
✅ Real-world error scenarios

### 🏗️ Data Flow Integration (12 tests)

**Location**: `integration/dataFlow.integration.test.ts`

✅ Referential integrity (transactions ↔ categories ↔ wallets)  
✅ Transaction filtering and date ranges  
✅ Financial calculations and totals  
✅ Category/wallet deletion constraints  
✅ Money Tracker import data transformation  
✅ UUID uniqueness at scale (1000+ IDs)  
✅ Date range consistency  
✅ Currency formatting edge cases  
✅ Business rule validation  
✅ Import format parsing  
✅ Data validation rules  
✅ Orphaned record prevention

## Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test -- utils.test.ts
npm test -- tests/integration/simpleStorage.integration.test.ts
npm test -- tests/integration/dataFlow.integration.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test pattern
npm test -- --testNamePattern="storage"
```

## Test Results Summary

**📊 Total Tests: 34**  
**📁 Test Suites: 3**  
**✅ Pass Rate: 100%**  
**⚡ Execution Time: ~2 seconds**

## Key Features Tested

### 💾 Data Persistence

- AsyncStorage integration with comprehensive error handling
- Data corruption detection and recovery mechanisms
- Schema version validation and migration scenarios
- Performance with large datasets (1000+ transactions)
- Concurrent operation safety

### 💼 Business Logic

- Transaction creation, validation, and calculations
- Category and wallet management with constraints
- Financial totals, filtering, and date range operations
- Referential integrity enforcement

### 📥 Import/Export Features

- Money Tracker JSON format parsing and transformation
- Currency handling and decimal precision
- Data mapping and validation during import
- Error handling for malformed import files

### 🛡️ Error Handling

- Storage access failures and permission issues
- Invalid data format recovery
- Missing reference detection and prevention
- Network/connectivity error scenarios

## Testing Philosophy

Our test suite emphasizes:

1. **🎯 Unit Testing** - Fast, focused tests for pure functions
2. **🔧 Integration Testing** - Data flow and component interaction
3. **💰 Business Logic** - Financial calculations and app rules
4. **🚨 Error Scenarios** - Graceful failure and recovery
5. **🚀 Performance** - Large dataset and concurrent operations

## Development Guidelines

### Adding New Tests

**For new utility functions:**

```bash
# Add tests in the same directory as the source file
touch newFeature.test.ts  # next to newFeature.ts
```

**For integration scenarios:**

```bash
# Add to the appropriate integration test file
# or create new ones in tests/integration/
```

### Test Quality Standards

- ✅ Tests should be **independent** and **deterministic**
- ✅ Use **descriptive test names** that explain the scenario
- ✅ **Mock external dependencies** (AsyncStorage, network calls)
- ✅ Test **both success and failure paths**
- ✅ Include **edge cases and boundary conditions**

## Notes

- **No React Native UI testing**: We focus on business logic rather than complex UI mocking
- **Node.js environment**: All tests run in Node with mocked dependencies for speed
- **AsyncStorage mocked**: Provides consistent, fast test execution
- **Integration over E2E**: Tests critical data flows without UI complexity

## Contributing

When adding features:

1. Write unit tests for pure functions (co-located)
2. Add integration tests for complex workflows
3. Update this README if adding new test categories
4. Ensure all tests pass: `npm test`
