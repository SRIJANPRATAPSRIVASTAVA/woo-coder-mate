// validation.test.js
// Test suite for Segment Editor input validation

const VALID_FIELDS = ['title', 'price', 'stock_status', 'stock_quantity', 'category', 'on_sale'];
const VALID_OPERATORS = ['=', '!=', '>', '<', '>=', '<='];
const NUMERIC_FIELDS = ['price', 'stock_quantity'];
const BOOLEAN_FIELDS = ['on_sale'];
const COMPARISON_OPERATORS = ['>', '<', '>=', '<='];

function validateConditions(text) {
  const errors = [];
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) return;

    const parts = trimmedLine.split(/\s+/);
    if (parts.length < 3) {
      errors.push({
        line: index + 1,
        message: "Invalid format. Expected: field operator value",
        text: trimmedLine
      });
      return;
    }

    const field = parts[0].toLowerCase().trim();
    const operator = parts[1].trim();
    const value = parts.slice(2).join(' ').trim();

    if (!VALID_FIELDS.includes(field)) {
      errors.push({
        line: index + 1,
        message: `Invalid field '${field}'. Valid fields: ${VALID_FIELDS.join(', ')}`,
        text: trimmedLine
      });
      return;
    }

    if (!VALID_OPERATORS.includes(operator)) {
      errors.push({
        line: index + 1,
        message: `Invalid operator '${operator}'. Valid operators: ${VALID_OPERATORS.join(', ')}`,
        text: trimmedLine
      });
      return;
    }

    if (!value) {
      errors.push({
        line: index + 1,
        message: "Value cannot be empty",
        text: trimmedLine
      });
      return;
    }

    if (VALID_OPERATORS.some(op => value.includes(op))) {
      errors.push({
        line: index + 1,
        message: "Value contains an operator. Did you forget a newline between conditions?",
        text: trimmedLine
      });
      return;
    }

    const valueFirstWord = value.split(/\s+/)[0].toLowerCase();
    if (VALID_FIELDS.includes(valueFirstWord)) {
      errors.push({
        line: index + 1,
        message: "Value starts with a field name. Did you forget a newline between conditions?",
        text: trimmedLine
      });
      return;
    }

    if (COMPARISON_OPERATORS.includes(operator) && !NUMERIC_FIELDS.includes(field)) {
      errors.push({
        line: index + 1,
        message: `Comparison operator '${operator}' can only be used with numeric fields (${NUMERIC_FIELDS.join(', ')})`,
        text: trimmedLine
      });
      return;
    }

    if (NUMERIC_FIELDS.includes(field)) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push({
          line: index + 1,
          message: `Field '${field}' requires a numeric value, got '${value}'`,
          text: trimmedLine
        });
        return;
      }
      if (field === 'stock_quantity' && numValue < 0) {
        errors.push({
          line: index + 1,
          message: "stock_quantity cannot be negative",
          text: trimmedLine
        });
        return;
      }
    }

    if (BOOLEAN_FIELDS.includes(field)) {
      const lowerValue = value.toLowerCase();
      if (lowerValue !== 'true' && lowerValue !== 'false') {
        errors.push({
          line: index + 1,
          message: `Field '${field}' requires a boolean value (true/false), got '${value}'`,
          text: trimmedLine
        });
        return;
      }
      if (COMPARISON_OPERATORS.includes(operator)) {
        errors.push({
          line: index + 1,
          message: `Boolean field '${field}' cannot use comparison operators. Use = or != only`,
          text: trimmedLine
        });
        return;
      }
    }
  });

  return errors;
}

// Test Cases
const testCases = [
  // ===== VALID CASES (Should Pass) =====
  {
    name: "Test 1: Single basic condition",
    input: "price > 50",
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 2: Multiple simple conditions",
    input: `price > 50
category = Accessories`,
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 3: All valid operators",
    input: `price = 100
stock_quantity != 5
price > 50
stock_quantity < 100
price >= 75
stock_quantity <= 200`,
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 4: Boolean field",
    input: "on_sale = true",
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 5: Stock status",
    input: "stock_status = instock",
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 6: Title with multiple words",
    input: "title = Cool Winter Jacket",
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 7: Mixed conditions with spacing",
    input: `price >= 100
stock_status = instock
on_sale = false
category = Electronics`,
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 8: Zero values",
    input: `price > 0
stock_quantity >= 0`,
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 9: Decimal prices",
    input: `price > 99.99
price <= 1500.50`,
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 10: Empty lines between conditions",
    input: `price > 50

category = Jackets

on_sale = true`,
    expectedErrors: 0,
    shouldPass: true
  },

  // ===== INVALID CASES (Should Fail) =====
  {
    name: "Test 11: Missing operator",
    input: "price 50",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "Invalid format"
  },
  {
    name: "Test 12: Missing value",
    input: "price >",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "Value cannot be empty"
  },
  {
    name: "Test 13: Invalid field name",
    input: "cost > 50",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "Invalid field"
  },
  {
    name: "Test 14: Invalid operator",
    input: "price == 50",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "Invalid operator"
  },
  {
    name: "Test 15: Non-numeric value for numeric field",
    input: "price > fifty",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "requires a numeric value"
  },
  {
    name: "Test 16: Non-boolean value for boolean field",
    input: "on_sale = yes",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "requires a boolean value"
  },
  {
    name: "Test 17: Comparison operator on boolean field",
    input: "on_sale > true",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "cannot use comparison operators"
  },
  {
    name: "Test 18: Comparison operator on text field",
    input: "category > Electronics",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "can only be used with numeric fields"
  },
  {
    name: "Test 19: Negative stock quantity",
    input: "stock_quantity >= -5",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "cannot be negative"
  },
  {
    name: "Test 20: Multiple errors in one input",
    input: `cost > fifty
price == 100
on_sale > yes
stock_quantity < -10
invalid_field = test`,
    expectedErrors: 5,
    shouldPass: false
  },

  // ===== EDGE CASES =====
  {
    name: "Test 21: Extra whitespace",
    input: `  price   >   50  
category=Accessories`,
    expectedErrors: 1, // "category=Accessories" will fail because no space around operator
    shouldPass: false
  },
  {
    name: "Test 22: Mixed case field names",
    input: `Price > 50
CATEGORY = Jackets`,
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 23: Very large numbers",
    input: `price > 999999999
stock_quantity < 1000000`,
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 24: Only empty lines",
    input: `


`,
    expectedErrors: 0,
    shouldPass: true
  },
  {
    name: "Test 25: Special characters in text values",
    input: `title = Product@2024!
category = Men's-Wear`,
    expectedErrors: 0,
    shouldPass: true
  },

  // ===== CRITICAL BUG TEST =====
  {
    name: "Test 26: Missing newline between conditions (THE BUG)",
    input: "price > 90category = Jackets",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "Value starts with a field name"
  },
  {
    name: "Test 27: Missing newline with operator in value",
    input: "price > 90 > 100",
    expectedErrors: 1,
    shouldPass: false,
    expectedMessage: "Value contains an operator"
  }
];

// Run Tests
function runTests() {
  console.log("🧪 Running Segment Editor Validation Tests\n");
  console.log("=".repeat(70));
  
  let passed = 0;
  let failed = 0;
  const failures = [];

  testCases.forEach((test, index) => {
    const errors = validateConditions(test.input);
    const actualPass = errors.length === 0;
    const testPassed = (actualPass === test.shouldPass) && 
                       (errors.length === test.expectedErrors);

    if (testPassed) {
      passed++;
      console.log(`✅ ${test.name}`);
    } else {
      failed++;
      console.log(`❌ ${test.name}`);
      failures.push({
        test,
        expected: test.expectedErrors,
        actual: errors.length,
        errors: errors
      });
    }
  });

  console.log("\n" + "=".repeat(70));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

  if (failures.length > 0) {
    console.log("❌ Failed Tests Details:\n");
    failures.forEach(failure => {
      console.log(`\n--- ${failure.test.name} ---`);
      console.log(`Input: "${failure.test.input.substring(0, 50)}..."`);
      console.log(`Expected errors: ${failure.expected}, Got: ${failure.actual}`);
      if (failure.errors.length > 0) {
        console.log("Errors found:");
        failure.errors.forEach(err => {
          console.log(`  Line ${err.line}: ${err.message}`);
        });
      }
    });
  }

  return { passed, failed, total: testCases.length };
}

// Execute tests
runTests();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateConditions, testCases, runTests };
}