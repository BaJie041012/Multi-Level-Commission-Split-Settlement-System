const { calculateTotalPrice, validateDuration } = require('./utils');

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`FAIL: ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    return false;
  }
  console.log(`PASS: ${message}`);
  return true;
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    console.error(`FAIL: ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    return false;
  }
  console.log(`PASS: ${message}`);
  return true;
}

function testPupaiIntegerDuration() {
  const input = {
    type: 'pupai',
    duration: 2,
    quantity: 0,
    unitPrice: 100
  };
  
  const result = calculateTotalPrice(input);
  assertClose(result, 200.00, 0.01, '普陪整数时长2h×100应等于200');
}

function testPupaiHalfDuration() {
  const input = {
    type: 'pupai',
    duration: 2.5,
    quantity: 0,
    unitPrice: 100
  };
  
  const result = calculateTotalPrice(input);
  assertClose(result, 252.00, 0.01, '普陪x.5时长2.5h×100应等于252');
}

function testPupaiHalfDurationEdgeCase() {
  const input = {
    type: 'pupai',
    duration: 0.5,
    quantity: 0,
    unitPrice: 100
  };
  
  const result = calculateTotalPrice(input);
  assertClose(result, 52.00, 0.01, '普陪0.5h时长应等于52');
}

function testPupaiZeroDuration() {
  const input = {
    type: 'pupai',
    duration: 0,
    quantity: 0,
    unitPrice: 100
  };
  
  const result = calculateTotalPrice(input);
  assertClose(result, 0, 0.01, '普陪时长为0应返回0');
}

function testPupaiZeroUnitPrice() {
  const input = {
    type: 'pupai',
    duration: 2,
    quantity: 0,
    unitPrice: 0
  };
  
  const result = calculateTotalPrice(input);
  assertClose(result, 0, 0.01, '普陪单价为0应返回0');
}

function testGiftPriceCalculation() {
  const input = {
    type: 'gift',
    duration: 0,
    quantity: 5,
    unitPrice: 10
  };
  
  const result = calculateTotalPrice(input);
  assertClose(result, 50.00, 0.01, '礼物5份×10单价应等于50');
}

function testGiftZeroQuantity() {
  const input = {
    type: 'gift',
    duration: 0,
    quantity: 0,
    unitPrice: 10
  };
  
  const result = calculateTotalPrice(input);
  assertClose(result, 0, 0.01, '礼物份数为0应返回0');
}

function testDurationValidationInteger() {
  assertEqual(validateDuration('2'), 2, '整数2应保持不变');
}

function testDurationValidationHalf() {
  assertEqual(validateDuration('2.5'), 2.5, 'x.5格式2.5应保持不变');
}

function testDurationValidationRoundDown() {
  assertEqual(validateDuration('2.3'), 2, '小数0.3应向下取整为2');
}

function testDurationValidationRoundUp() {
  assertEqual(validateDuration('2.6'), 2.5, '小数0.6应向上修正为2.5');
}

function testDurationValidationRoundUpToHalf() {
  assertEqual(validateDuration('3.7'), 3.5, '小数0.7应向上修正为3.5');
}

function testDurationValidationZero() {
  assertEqual(validateDuration('0'), 0, '0应保持不变');
}

function testDurationValidationNegative() {
  assertEqual(validateDuration('-1'), -1, '负数应保持不变');
}

function testDurationValidationEmpty() {
  assertEqual(validateDuration(''), null, '空字符串应返回null');
}

function testDurationValidationInvalid() {
  assertEqual(validateDuration('abc'), null, '无效输入应返回null');
}

function runAllTests() {
  console.log('\n=== 价格计算和时长验证测试 ===\n');
  
  testPupaiIntegerDuration();
  testPupaiHalfDuration();
  testPupaiHalfDurationEdgeCase();
  testPupaiZeroDuration();
  testPupaiZeroUnitPrice();
  testGiftPriceCalculation();
  testGiftZeroQuantity();
  
  console.log('\n--- 时长验证测试 ---\n');
  
  testDurationValidationInteger();
  testDurationValidationHalf();
  testDurationValidationRoundDown();
  testDurationValidationRoundUp();
  testDurationValidationRoundUpToHalf();
  testDurationValidationZero();
  testDurationValidationNegative();
  testDurationValidationEmpty();
  testDurationValidationInvalid();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
} else {
  runAllTests();
}