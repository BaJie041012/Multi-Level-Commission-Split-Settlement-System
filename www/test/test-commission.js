const { calculateCommission, calculateDisplayNet } = require('./utils');

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

let passed = 0;
let failed = 0;

function testPupaiNoInviter() {
  const input = {
    type: 'pupai',
    totalPrice: 100,
    unitPrice: 100,
    inviter: '',
    discount: null,
    companion: '八戒'
  };
  
  const result = calculateCommission(input);
  
  assertClose(result.groupCommission, 5.00, 0.01, '普陪无邀请人团抽应为5%');
  assertClose(result.receptionCommission, 15.00, 0.01, '普陪无邀请人接抽应为15%');
  assertClose(result.dispatchCommission, 0, 0.01, '普陪无邀请人派抽应为0');
  assertClose(result.inviterCommission, 0, 0.01, '普陪无邀请人邀请人抽应为0');
  assertClose(result.netAmount, 80.00, 0.01, '普陪无邀请人到手价应为80');
}

function testPupaiWithInviter() {
  const input = {
    type: 'pupai',
    totalPrice: 100,
    unitPrice: 100,
    inviter: '邀请人',
    discount: null,
    companion: '八戒'
  };
  
  const result = calculateCommission(input);
  
  assertClose(result.groupCommission, 5.00, 0.01, '普陪有邀请人团抽应为5%');
  assertClose(result.receptionCommission, 7.50, 0.01, '普陪有邀请人接抽应为7.5%');
  assertClose(result.dispatchCommission, 7.50, 0.01, '普陪有邀请人派抽应为7.5%');
  assertClose(result.inviterCommission, 7.50, 0.01, '普陪有邀请人邀请人抽应为7.5%');
  assertClose(result.netAmount, 72.50, 0.01, '普陪有邀请人到手价应为72.5');
}

function testPupaiCompanionIsInviter() {
  const input = {
    type: 'pupai',
    totalPrice: 100,
    unitPrice: 100,
    inviter: '八戒',
    discount: null,
    companion: '八戒'
  };
  
  const result = calculateCommission(input);
  
  assertClose(result.groupCommission, 5.00, 0.01, '陪陪即邀请人团抽应为5%');
  assertClose(result.receptionCommission, 7.50, 0.01, '陪陪即邀请人接抽应为7.5%');
  assertClose(result.inviterCommission, 7.50, 0.01, '陪陪即邀请人邀请人抽应为7.5%');
  assertClose(result.netAmount, 80.00, 0.01, '陪陪即邀请人到手价应合并邀请人抽成');
}

function testPupaiWithDiscount() {
  const input = {
    type: 'pupai',
    totalPrice: 100,
    unitPrice: 100,
    inviter: '',
    discount: 9.4,
    companion: '八戒'
  };
  
  const result = calculateCommission(input);
  
  assertClose(result.finalPrice, 94.00, 0.01, '94折后总价应为94');
  assertClose(result.groupCommission, 4.70, 0.01, '94折团抽应为4.7');
  assertClose(result.receptionCommission, 14.10, 0.01, '94折接抽应为14.1');
  assertClose(result.netAmount, 75.20, 0.01, '94折到手价应为75.2');
}

function testGiftNoCommission() {
  const input = {
    type: 'gift',
    totalPrice: 50,
    unitPrice: 5,
    inviter: '',
    discount: null,
    companion: '八戒'
  };
  
  const result = calculateCommission(input);
  
  assertClose(result.groupCommission, 0, 0.01, '礼物单价≤10团抽应为0');
  assertClose(result.receptionCommission, 0, 0.01, '礼物单价≤10接抽应为0');
  assertClose(result.inviterCommission, 0, 0.01, '礼物单价≤10邀请人抽应为0');
  assertClose(result.netAmount, 50.00, 0.01, '礼物无抽成到手价应为总价');
}

function testGiftWithCommissionNoInviter() {
  const input = {
    type: 'gift',
    totalPrice: 100,
    unitPrice: 10,
    inviter: '',
    discount: null,
    companion: '八戒'
  };
  
  const result = calculateCommission(input);
  
  assertClose(result.groupCommission, 10.00, 0.01, '礼物单价≥10无邀请人团抽应为10%');
  assertClose(result.receptionCommission, 10.00, 0.01, '礼物单价≥10无邀请人接抽应为10%');
  assertClose(result.inviterCommission, 0, 0.01, '礼物单价≥10无邀请人邀请人抽应为0');
  assertClose(result.netAmount, 80.00, 0.01, '礼物单价≥10无邀请人到手价应为80');
}

function testGiftWithCommissionWithInviter() {
  const input = {
    type: 'gift',
    totalPrice: 100,
    unitPrice: 10,
    inviter: '邀请人',
    discount: null,
    companion: '八戒'
  };
  
  const result = calculateCommission(input);
  
  assertClose(result.groupCommission, 10.00, 0.01, '礼物单价≥10有邀请人团抽应为10%');
  assertClose(result.receptionCommission, 5.00, 0.01, '礼物单价≥10有邀请人接抽应为5%');
  assertClose(result.inviterCommission, 5.00, 0.01, '礼物单价≥10有邀请人邀请人抽应为5%');
  assertClose(result.dispatchCommission, 0, 0.01, '礼物有邀请人派抽应为0');
  assertClose(result.netAmount, 80.00, 0.01, '礼物单价≥10有邀请人到手价应为80');
}

function testGiftDisplayNetNoCommission() {
  const input = {
    type: 'gift',
    quantity: 5,
    unitPrice: 5,
    totalPrice: 25,
    inviter: '',
    discount: null,
    companion: '八戒'
  };
  
  const commissionResult = calculateCommission(input);
  const displayNet = calculateDisplayNet(input, commissionResult);
  
  assertClose(displayNet, 5.00, 0.01, '礼物无抽成到手价应等于单价');
}

function testGiftDisplayNetWithCommission() {
  const input = {
    type: 'gift',
    quantity: 5,
    unitPrice: 10,
    totalPrice: 50,
    inviter: '',
    discount: null,
    companion: '八戒'
  };
  
  const commissionResult = calculateCommission(input);
  const displayNet = calculateDisplayNet(input, commissionResult);
  
  assertClose(displayNet, 8.00, 0.01, '礼物有抽成到手价应为抽后总价÷份数');
}

function testGiftDisplayNetWithInviter() {
  const input = {
    type: 'gift',
    quantity: 5,
    unitPrice: 10,
    totalPrice: 50,
    inviter: '邀请人',
    discount: null,
    companion: '八戒'
  };
  
  const commissionResult = calculateCommission(input);
  const displayNet = calculateDisplayNet(input, commissionResult);
  
  assertClose(displayNet, 8.00, 0.01, '礼物有邀请人到手价应为抽后总价÷份数');
}

function runAllTests() {
  console.log('\n=== 抽成计算测试 ===\n');
  
  testPupaiNoInviter();
  testPupaiWithInviter();
  testPupaiCompanionIsInviter();
  testPupaiWithDiscount();
  testGiftNoCommission();
  testGiftWithCommissionNoInviter();
  testGiftWithCommissionWithInviter();
  testGiftDisplayNetNoCommission();
  testGiftDisplayNetWithCommission();
  testGiftDisplayNetWithInviter();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
} else {
  runAllTests();
}