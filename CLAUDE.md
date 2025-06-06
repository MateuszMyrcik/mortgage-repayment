# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- **Development**: `npm run dev` - Start Vite dev server with HMR
- **Build**: `npm run build` - TypeScript compilation + Vite build
- **Lint**: `npm run lint` - Run ESLint on entire codebase
- **Test**: `npm test` - Run all tests with Vitest
- **Test UI**: `npm run test:ui` - Run tests with Vitest UI interface
- **Coverage**: `npm run coverage` - Generate test coverage report

## Architecture Overview

This is a React + TypeScript mortgage calculator with Domain-Driven Design (DDD) architecture:

### Domain Layer (`src/domain/`)
- **Entities**: Core business objects (`Loan`, `MonthlyPayment`, `OverpaymentStrategy`)
- **Value Objects**: Immutable types (`Money`, `InterestRate`, `LoanTerm`, `PaymentDate`)
- **Services**: `MortgageCalculationService` - Core mortgage calculation logic

### Application Layer (`src/application/`)
- **Services**: `MortgageApplicationService` - Orchestrates domain services, handles data transformation between UI and domain
- **Hooks**: React hooks that integrate with application services (`useMortgageCalculation`, `useLoanForm`, `useOverpaymentForm`)

### Component Layer (`src/components/`)
- React components for UI (`LoanForm`, `PaymentSchedule`, `SummaryPanel`, `Charts`)
- Uses Chart.js via react-chartjs-2 for visualizations

### Key Design Patterns
- **Domain-Driven Design**: Clear separation between domain logic and application concerns
- **Value Objects**: Immutable types for financial calculations ensure precision
- **Service Layer**: Business logic encapsulated in domain services
- **Legacy Compatibility**: `convertToLegacyFormat()` in application service maintains backward compatibility

### Data Flow
1. UI components collect user input via React hooks
2. Application service validates and transforms UI data to domain objects
3. Domain service performs calculations using business rules
4. Results flow back through application layer (with legacy format conversion) to UI

### Financial Domain Rules
- Supports both equal and decreasing payment types
- Overpayment strategies with custom monthly adjustments
- Validation includes business rules (e.g., payment-to-income ratios)
- Precise monetary calculations using Money value objects

## Testing
- **Framework**: Vitest with jsdom environment
- **Testing Library**: React Testing Library for component tests
- **Setup**: `src/setupTests.ts` configures testing environment
- Test files follow `*.test.ts` or `*.test.tsx` pattern