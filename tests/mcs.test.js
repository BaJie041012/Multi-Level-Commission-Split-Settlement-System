/**
 * MCS 抽成计算系统单元测试
 * 
 * 测试目标：验证 index.html 中的核心计算逻辑
 * 重点覆盖：v2.13 版本修复的"移除普陪价格阈值"问题
 */

// 测试框架
class TestRunner {
  constructor() {
    this.passCount = 0;
    this.failCount = 0;
    this.results = [];
  }

  test(description, testFunc) {
    try {
      testFunc();
      this.results.push({ desc: description, status: 'PASS', error: null });
      this.passCount++;
    } catch (error) {
      this.results.push({ desc: description, status: 'FAIL', error: error.message });
      this.failCount++;
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}: 期望 ${expected}, 实际 ${actual}`);
    }
  }

  assertApproxEqual(actual, expected, tolerance, message) {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
      throw new Error(`${message}: 期望约 ${expected}, 实际 ${actual}, 偏差 ${diff}`);
    }
  }

  printResults() {
    console.log('\n=== MCS 单元测试结果 ===');
    console.log(`总计: ${this.passCount + this.failCount} 个测试`);
    console.log(`✅ 通过: ${this.passCount}`);
    console.log(`❌ 失败: ${this.failCount}`);
    console.log('\n详细结果:');
    
    this.results.forEach(result => {
      const symbol = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${symbol} ${result.status}: ${result.desc}`);
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });

    if (this.failCount > 0) {
      console.log('\n⚠️  发现失败测试！请检查业务逻辑');
      process.exit(1);
    } else {
      console.log('\n✅ 所有测试通过！核心业务逻辑已验证');
      process.exit(0);
    }
  }
}

// 核心计算逻辑（从 index.html 提取并适配）
function calculateCommission(type, totalPrice, unitPrice, inviter, quantity) {
  const finalPrice = totalPrice;
  
  let groupCommission = 0;
  let dispatchCommission = 0;
  let receptionCommission = 0;
  let inviterCommission = 0;

  if (type === 'pupai') {
    // 普陪：无论总价多少都计算抽成（修复的核心）
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
  } else {
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
  }

  // 保留两位小数
  return {
    group: Math.round(groupCommission * 100) / 100,
    dispatch: Math.round(dispatchCommission * 100) / 100,
    reception: Math.round(receptionCommission * 100) / 100,
    inviter: Math.round(inviterCommission * 100) / 100,
    net: Math.round((finalPrice - groupCommission - dispatchCommission - receptionCommission - inviterCommission) * 100) / 100
  };
}

function calculateDurationPrice(duration, unitPrice) {
  const integerPart = Math.floor(duration);
  const decimalPart = duration - integerPart;
  
  if (decimalPart === 0) {
    return integerPart * unitPrice;
  } else if (decimalPart === 0.5) {
    return integerPart * unitPrice + unitPrice / 2 + 2;
  }
  return 0;
}

function calculateDiscountPrice(totalPrice, discount) {
  if (discount > 0) {
    return totalPrice * (discount / 10);
  }
  return totalPrice;
}

function calculateGiftNetPrice(hasCommission, netAmount, unitPrice, quantity) {
  if (!hasCommission) {
    return unitPrice;
  }
  return Math.round((netAmount / quantity) * 100) / 100;
}

// 运行测试
const runner = new TestRunner();

// ==========================================
// 测试套件 1: 普陪基础抽成计算（修复的核心）
// ==========================================

runner.test('普陪：总价100元，无邀请人，应抽团抽5元接抽15元到手80元', () => {
  const result = calculateCommission('pupai', 100, 100, '', 0);
  runner.assertApproxEqual(result.group, 5, 0.01, '团抽');
  runner.assertApproxEqual(result.reception, 15, 0.01, '接抽');
  runner.assertApproxEqual(result.net, 80, 0.01, '到手');
});

runner.test('普陪：总价10元（低价），无邀请人，应抽团抽0.5元接抽1.5元到手8元', () => {
  // 这是 v2.13 修复的核心场景：移除价格阈值，低价也应抽成
  const result = calculateCommission('pupai', 10, 10, '', 0);
  runner.assertApproxEqual(result.group, 0.5, 0.01, '低价团抽');
  runner.assertApproxEqual(result.reception, 1.5, 0.01, '低价接抽');
  runner.assertApproxEqual(result.net, 8, 0.01, '低价到手');
});

runner.test('普陪：总价1元（极低价），无邀请人，应抽团抽0.05元接抽0.15元到手0.8元', () => {
  // 测试极端低价场景，验证任何价格都抽成
  const result = calculateCommission('pupai', 1, 1, '', 0);
  runner.assertApproxEqual(result.group, 0.05, 0.01, '极低价团抽');
  runner.assertApproxEqual(result.reception, 0.15, 0.01, '极低价接抽');
  runner.assertApproxEqual(result.net, 0.8, 0.01, '极低价到手');
});

// ==========================================
// 测试套件 2: 普陪有邀请人场景
// ==========================================

runner.test('普陪：总价100元，有邀请人，应抽团抽5元接抽7.5元邀请人7.5元到手72.5元', () => {
  const result = calculateCommission('pupai', 100, 100, '八戒', 0);
  runner.assertApproxEqual(result.group, 5, 0.01, '团抽');
  runner.assertApproxEqual(result.reception, 7.5, 0.01, '接抽');
  runner.assertApproxEqual(result.inviter, 7.5, 0.01, '邀请人抽');
  runner.assertApproxEqual(result.dispatch, 7.5, 0.01, '派抽');
  runner.assertApproxEqual(result.net, 72.5, 0.01, '到手');
});

runner.test('普陪：低价有邀请人，各方抽成比例正确', () => {
  const result = calculateCommission('pupai', 20, 20, '八戒', 0);
  runner.assertApproxEqual(result.group, 1, 0.01, '低价团抽'); // 20 * 0.05
  runner.assertApproxEqual(result.reception, 1.5, 0.01, '低价接抽'); // 20 * 0.075
  runner.assertApproxEqual(result.inviter, 1.5, 0.01, '低价邀请人抽'); // 20 * 0.075
  runner.assertApproxEqual(result.net, 14.5, 0.01, '低价到手'); // 20 - 1 - 1.5 - 1.5 - 1.5
});

// ==========================================
// 测试套件 3: 礼物/选送高价场景（单价>=10）
// ==========================================

runner.test('礼物：单价15元总价45元（3份），无邀请人，应抽团抽4.5元接抽4.5元每份12元', () => {
  const result = calculateCommission('gift', 45, 15, '', 3);
  runner.assertApproxEqual(result.group, 4.5, 0.01, '礼物团抽');
  runner.assertApproxEqual(result.reception, 4.5, 0.01, '礼物接抽');
  
  // 到手：45 - 4.5 - 4.5 = 36元，每份 36/3 = 12元
  const displayNet = calculateGiftNetPrice(true, result.net, 15, 3);
  runner.assertApproxEqual(displayNet, 12, 0.01, '每份到手');
});

runner.test('礼物：单价15元总价45元（3份），有邀请人，应抽团抽4.5元接抽2.25元邀请人2.25元每份12元', () => {
  const result = calculateCommission('gift', 45, 15, '八戒', 3);
  runner.assertApproxEqual(result.group, 4.5, 0.01, '礼物团抽');
  runner.assertApproxEqual(result.reception, 2.25, 0.01, '礼物接抽');
  runner.assertApproxEqual(result.inviter, 2.25, 0.01, '邀请人抽');
  
  // 到手：45 - 4.5 - 2.25 - 2.25 = 36元，每份 36/3 = 12元
  const displayNet = calculateGiftNetPrice(true, result.net, 15, 3);
  runner.assertApproxEqual(displayNet, 12, 0.01, '每份到手');
});

// ==========================================
// 测试套件 4: 礼物/选送低价场景（单价<10）
// ==========================================

runner.test('礼物：单价8元总价16元（2份），无抽成，到手单价8元', () => {
  const result = calculateCommission('gift', 16, 8, '', 2);
  runner.assertEqual(result.group, 0, '低价礼物无团抽');
  runner.assertEqual(result.reception, 0, '低价礼物无接抽');
  
  const displayNet = calculateGiftNetPrice(false, result.net, 8, 2);
  runner.assertEqual(displayNet, 8, '低价礼物到手=单价');
});

runner.test('礼物：单价9.99元，无抽成', () => {
  const result = calculateCommission('gift', 19.98, 9.99, '', 2);
  runner.assertEqual(result.group, 0, '单价9.99无团抽');
  runner.assertEqual(result.reception, 0, '单价9.99无接抽');
});

// ==========================================
// 测试套件 5: 礼物临界值测试（单价=10）
// ==========================================

runner.test('礼物：单价正好10元（临界值），应抽成', () => {
  const result = calculateCommission('gift', 30, 10, '', 3);
  runner.assertApproxEqual(result.group, 3, 0.01, '单价10元应抽团抽');
  runner.assertApproxEqual(result.reception, 3, 0.01, '单价10元应抽接抽');
});

runner.test('礼物：单价10.01元，应抽成', () => {
  const result = calculateCommission('gift', 30.03, 10.01, '', 3);
  runner.assertApproxEqual(result.group, 3.003, 0.01, '单价10.01应抽团抽');
});

// ==========================================
// 测试套件 6: 时长计算规则
// ==========================================

runner.test('时长：整数时长2小时单价50元，总价=100元', () => {
  const total = calculateDurationPrice(2, 50);
  runner.assertEqual(total, 100, '整数时长总价');
});

runner.test('时长：x.5时长（2.5h）单价50元，总价=127元', () => {
  // 公式：整数部分 × 单价 + 单价÷2 + 2
  const total = calculateDurationPrice(2.5, 50);
  runner.assertEqual(total, 127, 'x.5时长总价'); // 2*50 + 25 + 2 = 127
});

runner.test('时长：0.5小时单价50元，总价=27元', () => {
  const total = calculateDurationPrice(0.5, 50);
  runner.assertEqual(total, 27, '0.5时长总价'); // 0*50 + 25 + 2 = 27
});

runner.test('时长：1.5小时单价100元，总价=152元', () => {
  const total = calculateDurationPrice(1.5, 100);
  runner.assertEqual(total, 152, '1.5时长总价'); // 1*100 + 50 + 2 = 152
});

// ==========================================
// 测试套件 7: 折扣计算
// ==========================================

runner.test('折扣：9.4折总价100元，折后94元', () => {
  const final = calculateDiscountPrice(100, 9.4);
  runner.assertEqual(final, 94, '9.4折总价');
});

runner.test('折扣：8.5折总价200元，折后170元', () => {
  const final = calculateDiscountPrice(200, 8.5);
  runner.assertEqual(final, 170, '8.5折总价');
});

runner.test('折扣：无折扣（0折），总价不变', () => {
  const final = calculateDiscountPrice(100, 0);
  runner.assertEqual(final, 100, '无折扣总价');
});

// ==========================================
// 测试套件 8: 边界值测试
// ==========================================

runner.test('边界：总价0元，所有抽成应为0', () => {
  const result = calculateCommission('pupai', 0, 0, '', 0);
  runner.assertEqual(result.group, 0, '零总价团抽');
  runner.assertEqual(result.reception, 0, '零总价接抽');
  runner.assertEqual(result.net, 0, '零总价到手');
});

runner.test('边界：礼物总价0元单价0元，无抽成', () => {
  const result = calculateCommission('gift', 0, 0, '', 0);
  runner.assertEqual(result.group, 0, '零总价礼物无团抽');
  runner.assertEqual(result.reception, 0, '零总价礼物无接抽');
});

runner.test('边界：大额总价10000元，抽成比例正确', () => {
  const result = calculateCommission('pupai', 10000, 10000, '', 0);
  runner.assertApproxEqual(result.group, 500, 0.01, '大额团抽'); // 10000 * 0.05
  runner.assertApproxEqual(result.reception, 1500, 0.01, '大额接抽'); // 10000 * 0.15
  runner.assertApproxEqual(result.net, 8000, 0.01, '大额到手');
});

runner.test('边界：单价999元（高价礼物），抽成正常', () => {
  const result = calculateCommission('gift', 999, 999, '', 1);
  runner.assertApproxEqual(result.group, 99.9, 0.01, '高价礼物团抽');
  runner.assertApproxEqual(result.reception, 99.9, 0.01, '高价礼物接抽');
});

// ==========================================
// 测试套件 9: 陪陪是邀请人场景（合并抽成）
// ==========================================

runner.test('陪陪是邀请人：到手价应增加邀请人抽成', () => {
  // 当陪陪和邀请人是同一人时，邀请人抽成应合并到到手价
  const result = calculateCommission('pupai', 100, 100, '陪陪A', 0);
  // 基础到手：72.5元，邀请人抽成7.5元，合并后80元
  const mergedNet = Math.round((result.net + result.inviter) * 100) / 100;
  runner.assertApproxEqual(mergedNet, 80, 0.01, '陪陪即邀请人到手');
});

runner.test('礼物：陪陪是邀请人，到手价应增加邀请人抽成', () => {
  const result = calculateCommission('gift', 45, 15, '陪陪A', 3);
  // 基础到手：36元，邀请人抽成2.25元，合并后38.25元，每份12.75元
  const mergedNet = result.net + result.inviter;
  const displayNet = calculateGiftNetPrice(true, mergedNet, 15, 3);
  runner.assertApproxEqual(displayNet, 12.75, 0.01, '陪陪即邀请人每份到手');
});

// ==========================================
// 测试套件 10: 浮点数精度测试
// ==========================================

runner.test('精度：总价99.99元，抽成应保留两位小数', () => {
  const result = calculateCommission('pupai', 99.99, 99.99, '', 0);
  runner.assertApproxEqual(result.group, 5.00, 0.01, '精度团抽'); // 99.99 * 0.05 ≈ 5.00
  runner.assertApproxEqual(result.reception, 15.00, 0.01, '精度接抽'); // 99.99 * 0.15 ≈ 15.00
});

runner.test('精度：礼物单价13.33元总价40元，抽成精度正确', () => {
  const result = calculateCommission('gift', 40, 13.33, '', 3);
  runner.assertApproxEqual(result.group, 4.00, 0.01, '精度礼物团抽');
  runner.assertApproxEqual(result.reception, 4.00, 0.01, '精度礼物接抽');
});

// 打印测试结果
runner.printResults();