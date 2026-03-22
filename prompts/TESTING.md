# Agent Test Suite
# Run with: npx promptfoo@latest eval

## Quick Test Commands

```bash
# Run all tests
npx promptfoo@latest eval

# Run specific agent tests
npx promptfoo@latest eval --tests promptfooconfig.yaml --filter "Planner"
npx promptfoo@latest eval --tests promptfooconfig.yaml --filter "Scheduler"
npx promptfoo@latest eval --tests promptfooconfig.yaml --filter "Reflection"

# View results
npx promptfoo@latest view
```

## Test Coverage

### Planner Agent Tests
- ✅ Valid feature request parsing
- ✅ No hallucinated systems (Finance, Social, etc.)
- ✅ Only 3 valid systems: Health, Work, Relationships
- ✅ JSON output validation
- ✅ Confidence score based on evidence

### Scheduler Agent Tests
- ✅ Conflict detection works
- ✅ No invented event IDs
- ✅ Valid time ranges
- ✅ Overlap calculation accuracy
- ✅ Suggestions are contextual

### Reflection Agent Tests
- ✅ Completion rate calculation accuracy
- ✅ Valid systems only (Health, Work, Relationships)
- ✅ No hallucinated metrics
- ✅ Health system included
- ✅ Grade calculation correctness

## Assertions Used

| Type | Purpose |
|------|---------|
| `is-json` | Valid JSON output |
| `contains` | Required fields present |
| `equals` | Exact value match |
| `not-contains` | No hallucinated data |
| `contains-all` | All systems present |
| `greater-than` | Metric validation |

## Adding New Tests

Add test cases to `promptfooconfig.yaml` under `testcases`:

```yaml
- description: "New test description"
  vars:
    var1: "value"
  assert:
    - type: is-json
    - type: contains
      value: "expected"
```
