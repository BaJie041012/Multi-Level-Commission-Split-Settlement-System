/**
 * MCS 抽成计算逻辑测试套件
 * 测试普陪和礼物/选送的抽成计算、时长验证、总价计算等核心逻辑
 */

// ==================== 测试辅助工具 ====================

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, fn) {
    this.tests.push({ name, fn });
  }

  run() {
    console.log('\n========================================');
    console.log('    MCS 抽成计算逻辑测试套件');
    console.log('========================================\n');
    
    for (const test of this.tests) {
      try {
        test.fn();
        this.passed++;
        console.log(`✓ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}`);
      }
    }
    
    console.log('\n----------------------------------------');
    console.log(`总计: ${this.tests.length} 个测试`);
    console.log(`通过: ${this.passed} 个`);
    console.log(`失败: ${this.failed} 个`);
    console.log('----------------------------------------\n');
    
    return this.failed === 0;
  }
}

function assertEqual(actual, expected, message = '') {
  const actualRounded = Math.round(actual * 100) / 100;
  const expectedRounded = Math.round(expected * 100) / 100;
  if (actualRounded !== expectedRounded) {
    throw new Error(`${message}\n期望: ${expectedRounded}, 实际: ${actualRounded}`);
  }
}

function assertTrue(condition, message = '') {
  if (!condition) {
    throw new Error(message || '条件应为 true');
  }
}

function assertFalse(condition, message = '') {
  if (condition) {
    throw new Error(message || '条件应为 false');
  }
}

// ==================== 抽成计算核心逻辑（从 index.html 提取）====================

/**
 * 普陪抽成计算
 * @param {number} totalPrice - 总价
 * @param {string} inviter - 邀请人（可选）
 * @returns {object} - 各项抽成金额
 */
function calculatePupaiCommission(totalPrice, inviter = '') {
  const finalPrice = totalPrice;
  
  let groupCommission = 0;
  let dispatchCommission = 0;
  let receptionCommission = 0;
  let inviterCommission = 0;
  
  // 普陪：无论总价多少都计算抽成
  groupCommission = finalPrice * 0.05;  // 团抽5%
  
  if (inviter && inviter.trim()) {
    // 有邀请人：接抽、派抽、邀请人各7.5%
    receptionCommission = finalPrice * 0.075;
    inviterCommission = finalPrice * 0.075;
    dispatchCommission = finalPrice * 0.075;
  } else {
    // 无邀请人：接抽15%
    receptionCommission = finalPrice * 0.15;
  }
  
  return {
    groupCommission: Math.round(groupCommission * 100) / 100,
    dispatchCommission: Math.round(dispatchCommission * 100) / 100,
    receptionCommission: Math.round(receptionCommission * 100) / 100,
    inviterCommission: Math.round(inviterCommission * 100) / 100
  };
}

/**
 * 礼物/选送抽成计算
 * @param {number} totalPrice - 总价
 * @param {number} unitPrice - 单价
 * @param {string} inviter - 邀请人（可选）
 * @returns {object} - 各项抽成金额
 */
function calculateGiftCommission(totalPrice, unitPrice, inviter = '') {
  const finalPrice = totalPrice;
  
  let groupCommission = 0;
  let dispatchCommission = 0;
  let receptionCommission = 0;
  let inviterCommission = 0;
  
  // 礼物/选送：单价 >= 10 时计算抽成
  if (unitPrice >= 10) {
    groupCommission = finalPrice * 0.1;   // 团抽10%
    
    if (inviter && inviter.trim()) {
      // 有邀请人：邀请人和接待各5%
      receptionCommission = finalPrice * 0.05;
      inviterCommission = finalPrice * 0.05;
      dispatchCommission = 0;
    } else {
      // 无邀请人：接抽10%
      receptionCommission = finalPrice * 0.1;
    }
  }
  
  return {
    groupCommission: Math.round(groupCommission * 100) / 100,
    dispatchCommission: Math.round(dispatchCommission * 100) / 100,
    receptionCommission: Math.round(receptionCommission * 100) / 100,
    inviterCommission: Math.round(inviterCommission * 100) / 100
  };
}

/**
 * 普陪总价计算
 * @param {number} duration - 时长
 * @param {number} unitPrice - 单价
 * @returns {number} - 总价
 */
function calculatePupaiTotalPrice(duration, unitPrice) {
  if (duration <= 0 || unitPrice <= 0) return 0;
  
  const integerPart = Math.floor(duration);
  const decimalPart = duration - integerPart;
  
  let totalPrice = 0;
  
  if (decimalPart === 0) {
    // 整数时长
    totalPrice = integerPart * unitPrice;
  } else if (decimalPart === 0.5) {
    // x.5时长：加收2元
    totalPrice = integerPart * unitPrice + unitPrice / 2 + 2;
  } else {
    // 不合法的小数部分，返回0
    totalPrice = 0;
  }
  
  return Math.round(totalPrice * 100) / 100;
}

/**
 * 礼物/选送总价计算
 * @param {number} quantity - 份数
 * @param {number} unitPrice - 单价
 * @returns {number} - 总价
 */
function calculateGiftTotalPrice(quantity, unitPrice) {
  if (quantity <= 0 || unitPrice <= 0) return 0;
  return Math.round((quantity * unitPrice) * 100) / 100;
}

/**
 * 时长验证函数
 * @param {number} duration - 时长
 * @returns {number} - 修正后的时长
 */
function validateDuration(duration) {
  if (isNaN(duration)) return 0;
  if (duration <= 0) return 0;
  
  const decimalPart = duration - Math.floor(duration);
  
  if (decimalPart === 0 || decimalPart === 0.5) {
    return duration;
  }
  
  // 修正小数部分
  if (decimalPart < 0.5) {
    return Math.floor(duration);
  } else {
    return Math.floor(duration) + 0.5;
  }
}

/**
 * 到手价计算（普陪）
 * @param {number} totalPrice - 总价
 * @param {object} commissions - 抽成金额
 * @returns {number} - 到手价
 */
function calculateNetAmount(totalPrice, commissions) {
  const net = totalPrice - 
    commissions.groupCommission - 
    commissions.dispatchCommission - 
    commissions.receptionCommission - 
    commissions.inviterCommission;
  
  return Math.round(net * 100) / 100;
}

/**
 * 到手价计算（礼物/选送）
 * @param {number} totalPrice - 总价
 * @param {number} unitPrice - 单价
 * @param {number} quantity - 份数
 * @param {object} commissions - 抽成金额
 * @returns {number} - 到手价
 */
function calculateGiftNetAmount(totalPrice, unitPrice, quantity, commissions) {
  const hasCommission = commissions.groupCommission > 0 || 
    commissions.dispatchCommission > 0 || 
    commissions.receptionCommission > 0 || 
    commissions.inviterCommission > 0;
  
  if (!hasCommission) {
    // 无抽成：到手价 = 单价
    return unitPrice;
  } else {
    // 有抽成：到手价 = 抽后总价 ÷ 份数
    const net = calculateNetAmount(totalPrice, commissions);
    return Math.round((net / quantity) * 100) / 100;
  }
}

// ==================== 测试用例 ====================

const runner = new TestRunner();

// 普陪抽成测试 - 无邀请人
runner.addTest('普陪 - 100元总价无邀请人 - 团抽5元接抽15元', () => {
  const result = calculatePupaiCommission(100, '');
  assertEqual(result.groupCommission, 5, '团抽');
  assertEqual(result.receptionCommission, 15, '接抽');
  assertEqual(result.dispatchCommission, 0, '派抽应为0');
  assertEqual(result.inviterCommission, 0, '邀请人抽成应为0');
});

runner.addTest('普陪 - 50元总价无邀请人 - 团抽2.5元接抽7.5元', () => {
  const result = calculatePupaiCommission(50, '');
  assertEqual(result.groupCommission, 2.5, '团抽');
  assertEqual(result.receptionCommission, 7.5, '接抽');
});

// 普陪抽成测试 - 有邀请人
runner.addTest('普陪 - 100元总价有邀请人 - 团抽5元接抽派抽邀请人各7.5元', () => {
  const result = calculatePupaiCommission(100, '小明');
  assertEqual(result.groupCommission, 5, '团抽');
  assertEqual(result.receptionCommission, 7.5, '接抽');
  assertEqual(result.dispatchCommission, 7.5, '派抽');
  assertEqual(result.inviterCommission, 7.5, '邀请人抽成');
});

runner.addTest('普陪 - 验证邀请人抽成占比', () => {
  const result = calculatePupaiCommission(100, '测试');
  // 总抽成应为: 5 (团抽) + 7.5 (接抽) + 7.5 (派抽) + 7.5 (邀请人) = 27.5元
  const totalCommission = result.groupCommission + result.receptionCommission + 
    result.dispatchCommission + result.inviterCommission;
  assertEqual(totalCommission, 27.5, '总抽成');
});

// 礼物/选送抽成测试 - 单价>=10
runner.addTest('礼物 - 单价10元总价30元无邀请人 - 团抽3元接抽3元', () => {
  const result = calculateGiftCommission(30, 10, '');
  assertEqual(result.groupCommission, 3, '团抽');
  assertEqual(result.receptionCommission, 3, '接抽');
  assertEqual(result.dispatchCommission, 0, '派抽应为0');
});

runner.addTest('礼物 - 单价10元总价30元有邀请人 - 团抽3元接抽邀请人各1.5元', () => {
  const result = calculateGiftCommission(30, 10, '小红');
  assertEqual(result.groupCommission, 3, '团抽');
  assertEqual(result.receptionCommission, 1.5, '接抽');
  assertEqual(result.inviterCommission, 1.5, '邀请人抽成');
  assertEqual(result.dispatchCommission, 0, '派抽应为0');
});

// 礼物/选送抽成测试 - 单价<10（无抽成）
runner.addTest('礼物 - 单价9元总价27元 - 无抽成', () => {
  const result = calculateGiftCommission(27, 9, '');
  assertEqual(result.groupCommission, 0, '团抽应为0');
  assertEqual(result.receptionCommission, 0, '接抽应为0');
});

runner.addTest('礼物 - 单价9元总价27元有邀请人 - 无抽成', () => {
  const result = calculateGiftCommission(27, 9, '小红');
  assertEqual(result.groupCommission, 0, '团抽应为0');
  assertEqual(result.receptionCommission, 0, '接抽应为0');
  assertEqual(result.inviterCommission, 0, '邀请人抽成应为0');
});

// 普陪总价计算测试
runner.addTest('普陪总价 - 整数时长1小时单价100元 - 总价100元', () => {
  const result = calculatePupaiTotalPrice(1, 100);
  assertEqual(result, 100, '总价');
});

runner.addTest('普陪总价 - x.5时长1.5小时单价100元 - 总价152元', () => {
  const result = calculatePupaiTotalPrice(1.5, 100);
  // 1 * 100 + 100/2 + 2 = 100 + 50 + 2 = 152
  assertEqual(result, 152, '总价');
});

runner.addTest('普陪总价 - x.5时长2.5小时单价100元 - 总价252元', () => {
  const result = calculatePupaiTotalPrice(2.5, 100);
  // 2 * 100 + 100/2 + 2 = 200 + 50 + 2 = 252
  assertEqual(result, 252, '总价');
});

runner.addTest('普陪总价 - 3小时单价50元 - 总价150元', () => {
  const result = calculatePupaiTotalPrice(3, 50);
  assertEqual(result, 150, '总价');
});

runner.addTest('普陪总价 - 0时长或0单价 - 总价0元', () => {
  assertEqual(calculatePupaiTotalPrice(0, 100), 0, '0时长');
  assertEqual(calculatePupaiTotalPrice(1, 0), 0, '0单价');
});

// 礼物/选送总价计算测试
runner.addTest('礼物总价 - 2份单价15元 - 总价30元', () => {
  const result = calculateGiftTotalPrice(2, 15);
  assertEqual(result, 30, '总价');
});

runner.addTest('礼物总价 - 5份单价20元 - 总价100元', () => {
  const result = calculateGiftTotalPrice(5, 20);
  assertEqual(result, 100, '总价');
});

runner.addTest('礼物总价 - 0份或0单价 - 总价0元', () => {
  assertEqual(calculateGiftTotalPrice(0, 10), 0, '0份数');
  assertEqual(calculateGiftTotalPrice(2, 0), 0, '0单价');
});

// 时长验证测试
runner.addTest('时长验证 - 整数1.0 - 保持不变', () => {
  const result = validateDuration(1.0);
  assertEqual(result, 1, '时长');
});

runner.addTest('时长验证 - 合法小数1.5 - 保持不变', () => {
  const result = validateDuration(1.5);
  assertEqual(result, 1.5, '时长');
});

runner.addTest('时长验证 - 非法小数1.3 - 修正为1.0', () => {
  const result = validateDuration(1.3);
  assertEqual(result, 1, '时长应修正为1');
});

runner.addTest('时长验证 - 非法小数1.8 - 修正为1.5', () => {
  const result = validateDuration(1.8);
  assertEqual(result, 1.5, '时长应修正为1.5');
});

runner.addTest('时长验证 - 非法小数2.2 - 修正为2.0', () => {
  const result = validateDuration(2.2);
  assertEqual(result, 2, '时长应修正为2');
});

runner.addTest('时长验证 - 非法小数2.7 - 修正为2.5', () => {
  const result = validateDuration(2.7);
  assertEqual(result, 2.5, '时长应修正为2.5');
});

runner.addTest('时长验证 - NaN - 返回0', () => {
  const result = validateDuration(NaN);
  assertEqual(result, 0, 'NaN应返回0');
});

runner.addTest('时长验证 - 负数 - 返回0', () => {
  const result = validateDuration(-1);
  assertEqual(result, 0, '负数应返回0');
});

// 到手价计算测试（普陪）
runner.addTest('普陪到手价 - 100元无邀请人 - 到手80元', () => {
  const commissions = calculatePupaiCommission(100, '');
  const net = calculateNetAmount(100, commissions);
  // 100 - 5 - 15 = 80
  assertEqual(net, 80, '到手价');
});

runner.addTest('普陪到手价 - 100元有邀请人 - 到手72.5元', () => {
  const commissions = calculatePupaiCommission(100, '小明');
  const net = calculateNetAmount(100, commissions);
  // 100 - 5 - 7.5 - 7.5 - 7.5 = 72.5
  assertEqual(net, 72.5, '到手价');
});

// 到手价计算测试（礼物/选送）
runner.addTest('礼物到手价 - 单价9元无抽成 - 到手价等于单价', () => {
  const commissions = calculateGiftCommission(18, 9, '');
  const net = calculateGiftNetAmount(18, 9, 2, commissions);
  // 无抽成时，到手价 = 单价
  assertEqual(net, 9, '到手价应等于单价');
});

runner.addTest('礼物到手价 - 单价10元有抽成2份 - 到手价按份计算', () => {
  const commissions = calculateGiftCommission(20, 10, '');
  const net = calculateGiftNetAmount(20, 10, 2, commissions);
  // 总价20，团抽2，接抽2，到手16，每份8元
  const expectedNet = (20 - 2 - 2) / 2;
  assertEqual(net, expectedNet, '到手价');
});

runner.addTest('礼物到手价 - 单价10元有邀请人2份 - 到手价按份计算', () => {
  const commissions = calculateGiftCommission(20, 10, '小红');
  const net = calculateGiftNetAmount(20, 10, 2, commissions);
  // 总价20，团抽2，接抽1，邀请人1，到手16，每份8元
  const expectedNet = (20 - 2 - 1 - 1) / 2;
  assertEqual(net, expectedNet, '到手价');
});

// 边界条件测试
runner.addTest('边界 - 普陪总价为0 - 无抽成', () => {
  const result = calculatePupaiCommission(0, '');
  assertEqual(result.groupCommission, 0, '团抽应为0');
  assertEqual(result.receptionCommission, 0, '接抽应为0');
});

runner.addTest('边界 - 礼物单价刚好10元 - 触发抽成', () => {
  const result = calculateGiftCommission(10, 10, '');
  assertEqual(result.groupCommission, 1, '团抽应为1元');
});

runner.addTest('边界 - 礼物单价10.01元 - 触发抽成', () => {
  const result = calculateGiftCommission(10.01, 10.01, '');
  assertTrue(result.groupCommission > 0, '应触发抽成');
});

runner.addTest('边界 - 礼物单价9.99元 - 无抽成', () => {
  const result = calculateGiftCommission(9.99, 9.99, '');
  assertEqual(result.groupCommission, 0, '团抽应为0');
});

// 折扣计算测试（模拟）
runner.addTest('折扣 - 100元打9折 - 折后90元', () => {
  const originalPrice = 100;
  const discount = 9;
  const finalPrice = Math.round((originalPrice * (discount / 10)) * 100) / 100;
  assertEqual(finalPrice, 90, '折后总价');
});

runner.addTest('折扣 - 100元打9.5折 - 折后95元', () => {
  const originalPrice = 100;
  const discount = 9.5;
  const finalPrice = Math.round((originalPrice * (discount / 10)) * 100) / 100;
  assertEqual(finalPrice, 95, '折后总价');
});

runner.addTest('折扣 - 152元打9折再计算抽成', () => {
  const originalPrice = 152;
  const discount = 9;
  const finalPrice = Math.round((originalPrice * (discount / 10)) * 100) / 100;
  assertEqual(finalPrice, 136.8, '折后总价');
  
  const commissions = calculatePupaiCommission(finalPrice, '');
  // 团抽5%: 136.8 * 0.05 = 6.84
  // 接抽15%: 136.8 * 0.15 = 20.52
  assertEqual(commissions.groupCommission, 6.84, '团抽');
  assertEqual(commissions.receptionCommission, 20.52, '接抽');
});

// ==================== 运行测试 ====================

const allPassed = runner.run();

if (allPassed) {
  console.log('✓ 所有测试通过！抽成计算逻辑正确。\n');
  process.exit(0);
} else {
  console.log('✗ 存在失败的测试，请检查抽成计算逻辑。\n');
  process.exit(1);
}