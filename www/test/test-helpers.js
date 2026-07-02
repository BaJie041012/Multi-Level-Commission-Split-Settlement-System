const { autoQuantityFromCompanion, buildRemark, formatResultForCopy, calculateCommission, calculateDisplayNet } = require('./utils');

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

function testAutoQuantitySingleName() {
  assertEqual(autoQuantityFromCompanion('八戒'), 1, '单个陪陪名称应返回1');
}

function testAutoQuantityMultipleNames() {
  assertEqual(autoQuantityFromCompanion('八戒 小竹'), 2, '两个陪陪名称应返回2');
}

function testAutoQuantityMultipleNamesThree() {
  assertEqual(autoQuantityFromCompanion('八戒 小竹 小竹小竹'), 3, '三个陪陪名称应返回3');
}

function testAutoQuantityEmpty() {
  assertEqual(autoQuantityFromCompanion(''), 0, '空字符串应返回0');
}

function testAutoQuantityWhitespaceOnly() {
  assertEqual(autoQuantityFromCompanion('   '), 0, '仅空白字符应返回0');
}

function testAutoQuantityNull() {
  assertEqual(autoQuantityFromCompanion(null), 0, 'null应返回0');
}

function testAutoQuantityUndefined() {
  assertEqual(autoQuantityFromCompanion(undefined), 0, 'undefined应返回0');
}

function testAutoQuantityMultipleSpaces() {
  assertEqual(autoQuantityFromCompanion('八戒   小竹'), 2, '多个空格分隔应返回2');
}

function testAutoQuantityTabSeparator() {
  assertEqual(autoQuantityFromCompanion('八戒\t小竹'), 2, 'Tab分隔应返回2');
}

function testBuildRemarkNoDiscountNoExtra() {
  const input = {
    discount: null,
    type: 'pupai',
    extraReason: '',
    customReason: '',
    extraAmount: 0,
    customRemark: ''
  };
  
  const result = buildRemark(input);
  assertEqual(result, '', '无折扣无加价无备注应返回空字符串');
}

function testBuildRemarkWithDiscount() {
  const input = {
    discount: 9.4,
    type: 'pupai',
    extraReason: '',
    customReason: '',
    extraAmount: 0,
    customRemark: ''
  };
  
  const result = buildRemark(input);
  assertEqual(result, '9.4折', '仅折扣应返回折扣字符串');
}

function testBuildRemarkWithExtra() {
  const input = {
    discount: null,
    type: 'pupai',
    extraReason: '深夜',
    customReason: '',
    extraAmount: 5,
    customRemark: ''
  };
  
  const result = buildRemark(input);
  assertEqual(result, '深夜+5', '深夜加价应返回深夜+5');
}

function testBuildRemarkWithCustomExtra() {
  const input = {
    discount: null,
    type: 'pupai',
    extraReason: 'custom',
    customReason: '心情好',
    extraAmount: 10,
    customRemark: ''
  };
  
  const result = buildRemark(input);
  assertEqual(result, '心情好+10', '自定义加价理由应返回自定义理由+金额');
}

function testBuildRemarkWithCustomRemark() {
  const input = {
    discount: null,
    type: 'pupai',
    extraReason: '',
    customReason: '',
    extraAmount: 0,
    customRemark: '测试备注'
  };
  
  const result = buildRemark(input);
  assertEqual(result, '测试备注', '仅自定义备注应返回备注内容');
}

function testBuildRemarkCombined() {
  const input = {
    discount: 9.4,
    type: 'pupai',
    extraReason: '深夜',
    customReason: '',
    extraAmount: 5,
    customRemark: '测试备注'
  };
  
  const result = buildRemark(input);
  assertEqual(result, '9.4折  深夜+5  测试备注', '组合备注应正确拼接');
}

function testBuildRemarkGiftNoExtra() {
  const input = {
    discount: 9.4,
    type: 'gift',
    extraReason: '深夜',
    customReason: '',
    extraAmount: 5,
    customRemark: ''
  };
  
  const result = buildRemark(input);
  assertEqual(result, '9.4折', '礼物类型不应包含加价');
}

function testFormatResultForCopyPupai() {
  const input = {
    type: 'pupai',
    duration: 2,
    receptionist: '奶黄包',
    companion: '八戒',
    boss: '老板A',
    inviter: ''
  };
  
  const commissionResult = {
    finalPrice: 200,
    groupCommission: 10,
    dispatchCommission: 0,
    receptionCommission: 30,
    inviterCommission: 0,
    netAmount: 160
  };
  
  const displayNet = 160;
  const remark = '9.4折';
  
  const result = formatResultForCopy(input, commissionResult, displayNet, remark);
  
  assertEqual(result.includes('派单：'), true, '复制内容应包含派单标题');
  assertEqual(result.includes('接待：奶黄包'), true, '复制内容应包含接待');
  assertEqual(result.includes('陪陪：八戒'), true, '复制内容应包含陪陪');
  assertEqual(result.includes('老板：老板A'), true, '复制内容应包含老板');
  assertEqual(result.includes('类型：普陪'), true, '复制内容应包含类型');
  assertEqual(result.includes('时长：2.0h'), true, '普陪复制内容应包含时长');
  assertEqual(result.includes('总价：200.00'), true, '复制内容应包含总价');
  assertEqual(result.includes('团抽：10.00'), true, '复制内容应包含团抽');
  assertEqual(result.includes('接抽：30.00'), true, '复制内容应包含接抽');
  assertEqual(result.includes('到手：160.00'), true, '复制内容应包含到手价');
  assertEqual(result.includes('备注：9.4折'), true, '复制内容应包含备注');
}

function testFormatResultForCopyGift() {
  const input = {
    type: 'gift',
    duration: 0,
    receptionist: '奶黄包',
    companion: '八戒',
    boss: '老板A',
    inviter: ''
  };
  
  const commissionResult = {
    finalPrice: 50,
    groupCommission: 5,
    dispatchCommission: 0,
    receptionCommission: 5,
    inviterCommission: 0,
    netAmount: 40
  };
  
  const displayNet = 8;
  const remark = '';
  
  const result = formatResultForCopy(input, commissionResult, displayNet, remark);
  
  assertEqual(result.includes('类型：礼物/选送'), true, '复制内容应包含礼物类型');
  assertEqual(result.includes('时长：'), false, '礼物复制内容不应包含时长');
  assertEqual(result.includes('到手：8.00'), true, '复制内容应包含到手价');
}

function runAllTests() {
  console.log('\n=== 辅助功能测试 ===\n');
  
  console.log('\n--- 份数自动提取测试 ---\n');
  testAutoQuantitySingleName();
  testAutoQuantityMultipleNames();
  testAutoQuantityMultipleNamesThree();
  testAutoQuantityEmpty();
  testAutoQuantityWhitespaceOnly();
  testAutoQuantityNull();
  testAutoQuantityUndefined();
  testAutoQuantityMultipleSpaces();
  testAutoQuantityTabSeparator();
  
  console.log('\n--- 备注构建测试 ---\n');
  testBuildRemarkNoDiscountNoExtra();
  testBuildRemarkWithDiscount();
  testBuildRemarkWithExtra();
  testBuildRemarkWithCustomExtra();
  testBuildRemarkWithCustomRemark();
  testBuildRemarkCombined();
  testBuildRemarkGiftNoExtra();
  
  console.log('\n--- 复制格式测试 ---\n');
  testFormatResultForCopyPupai();
  testFormatResultForCopyGift();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
} else {
  runAllTests();
}