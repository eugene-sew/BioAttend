# Testing Guide for BioAttend Frontend

## Overview

This project uses a comprehensive testing setup with:
- **Vitest** - Fast unit test runner with Vite integration
- **React Testing Library** - Component testing utilities
- **MSW (Mock Service Worker)** - API mocking for integration tests
- **Happy DOM** - Lightweight DOM implementation for tests

## Test Structure

```
src/
├── test/                    # Test configuration and utilities
│   ├── setup.js            # Global test setup
│   ├── test-utils.jsx      # Custom render functions with providers
│   └── mocks/              # MSW mock handlers
│       ├── server.js       # MSW server setup
│       └── handlers.js     # API endpoint mocks
├── components/
│   └── **/*.test.jsx       # Component unit tests
├── store/
│   └── **/*.test.js        # Store unit tests
└── pages/
    └── **/*.test.jsx       # Page integration tests
```

## Running Tests

### Basic Commands

```bash
# Run all tests with lint and format checks
npm test

# Run tests in watch mode (interactive)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run CI pipeline (lint + format + tests + coverage)
npm run test:ci
```

### Test Execution Flow

When you run `npm test`, it executes:
1. **ESLint** - Checks code quality
2. **Prettier** - Verifies code formatting
3. **Vitest** - Runs all test suites

## Writing Tests

### Component Tests

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });
});
```

### Store Tests

```js
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMyStore from './myStore';

describe('MyStore', () => {
  it('should update state', () => {
    const { result } = renderHook(() => useMyStore());
    
    act(() => {
      result.current.updateValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

### API Integration Tests with MSW

```jsx
import { rest } from 'msw';
import { server } from '@/test/mocks/server';

describe('API Integration', () => {
  it('should handle API responses', async () => {
    // Override default handler for this test
    server.use(
      rest.get('/api/data', (req, res, ctx) => {
        return res(ctx.json({ data: 'test' }));
      })
    );
    
    // Test your component that makes API calls
    render(<MyApiComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });
});
```

## Test Coverage

### Current Coverage Areas

1. **Authentication Flow**
   - Login/logout functionality
   - Token management
   - Protected routes
   - Role-based access control

2. **Camera Capture**
   - Camera access and permissions
   - Photo capture and preview
   - Error handling

3. **Attendance Store**
   - Real-time updates
   - Session management
   - Optimistic updates
   - Statistics calculation

### Coverage Reports

Run `npm run test:coverage` to generate coverage reports:
- Console output with summary
- HTML report in `coverage/` directory
- JSON report for CI integration

## Best Practices

### 1. Test Organization
- Group related tests with `describe` blocks
- Use descriptive test names that explain the expected behavior
- Keep tests focused on a single concern

### 2. Setup and Teardown
- Use `beforeEach` to reset state between tests
- Clean up side effects in `afterEach`
- Mock external dependencies consistently

### 3. Assertions
- Test user-visible behavior, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Avoid testing internal state directly

### 4. Async Testing
- Always use `await` with user interactions
- Use `waitFor` for async state updates
- Handle loading and error states

### 5. Mocking
- Mock at the network layer with MSW
- Avoid mocking React components
- Keep mocks realistic and maintainable

## Common Testing Patterns

### Testing Loading States

```jsx
it('should show loading state', async () => {
  server.use(
    rest.get('/api/data', async (req, res, ctx) => {
      await new Promise(r => setTimeout(r, 100));
      return res(ctx.json({ data: 'test' }));
    })
  );
  
  render(<MyComponent />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});
```

### Testing Error States

```jsx
it('should handle errors', async () => {
  server.use(
    rest.get('/api/data', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    })
  );
  
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText(/server error/i)).toBeInTheDocument();
  });
});
```

### Testing Form Validation

```jsx
it('should validate form inputs', async () => {
  const user = userEvent.setup();
  render(<MyForm />);
  
  // Submit without filling required fields
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByText(/field is required/i)).toBeInTheDocument();
});
```

## Debugging Tests

### Interactive Mode
```bash
npm run test:watch
```
- Press `p` to filter by filename
- Press `t` to filter by test name
- Press `f` to run only failed tests

### UI Mode
```bash
npm run test:ui
```
Opens a browser interface for:
- Visual test execution
- Time travel debugging
- Coverage visualization

### Debug in VS Code
Add this configuration to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:watch"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## CI/CD Integration

The `npm run test:ci` command is designed for CI pipelines:
- Runs all quality checks (lint, format, tests)
- Generates coverage reports
- Exits with appropriate status codes
- No watch mode or interactive features

### GitHub Actions Example

```yaml
- name: Run Tests
  run: npm run test:ci
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Troubleshooting

### Common Issues

1. **Tests failing with "Cannot find module"**
   - Check import paths and aliases in `vitest.config.js`
   - Ensure all dependencies are installed

2. **Async tests timing out**
   - Increase timeout: `it('test', async () => {...}, 10000)`
   - Check for unresolved promises

3. **MSW not intercepting requests**
   - Verify server is started in setup file
   - Check request URLs match handlers

4. **DOM queries not finding elements**
   - Use `screen.debug()` to see current DOM
   - Check for async rendering with `waitFor`

## Future Enhancements

### Planned Improvements

1. **E2E Tests with Cypress**
   - Full user journey testing
   - Visual regression testing
   - Cross-browser compatibility

2. **Performance Testing**
   - Component render performance
   - Bundle size monitoring
   - Memory leak detection

3. **Accessibility Testing**
   - Automated a11y checks
   - Screen reader testing
   - Keyboard navigation tests

4. **Visual Testing**
   - Snapshot testing for UI consistency
   - Storybook integration
   - Component documentation

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
