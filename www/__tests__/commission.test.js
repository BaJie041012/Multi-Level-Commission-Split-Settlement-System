/**
 * MCS 抽成计算模块测试
 *
 * 测试覆盖：
 * 1. 普陪抽成计算（v2.13修复：无价格门槛）
 * 2. 礼物/选送抽成计算
 * 3. 时长计算规则
 * 4. 折扣计算
 * 5. 邀请人分抽规则
 * 6. 边界条件和极端情况
 */

import {
  calculateAutoTotalPrice,
  validateDuration,
  applyDiscount,
  calculateCommission,
  calculateNetDisplay,
  calculate
} from '../commission.js';

// ============== 时长自动计算测试 ==============

describe('时长自动计算', () => {
  describe('普陪类型', () => {
    test('整数时长：总价 = 时长 × 单价', () => {
      expect(calculateAutoTotalPrice('pupai', 2, 50, 0)).toBe(100);
      expect(calculateAutoTotalPrice('pupai', 3, 30, 0)).toBe(90);
      expect(calculateAutoTotalPrice('pupai', 1, 100, 0)).toBe(100);
    });

    test('x.5时长：总价 = 整数部分 × 单价 + 单价÷2 + 2', () => {
      // 2.5小时 = 2×50 + 25 + 2 = 127
      expect(calculateAutoTotalPrice('pupai', 2.5, 50, 0)).toBe(127);
      // 1.5小时 = 1×30 + 15 + 2 = 47
      expect(calculateAutoTotalPrice('pupai', 1.5, 30, 0)).toBe(47);
    });

    test('零值输入返回0', () => {
      expect(calculateAutoTotalPrice('pupai', 0, 50, 0)).toBe(0);
      expect(calculateAutoTotalPrice('pupai', 2, 0, 0)).toBe(0);
    });
  });

  describe('礼物/选送类型', () => {
    test('总价 = 份数 × 单价', () => {
      expect(calculateAutoTotalPrice('gift', 0, 50, 3)).toBe(150);
      expect(calculateAutoTotalPrice('gift', 0, 30, 2)).toBe(60);
    });

    test('零值输入返回0', () => {
      expect(calculateAutoTotalPrice('gift', 0, 50, 0)).toBe(0);
      expect(calculateAutoTotalPrice('gift', 0, 0, 3)).toBe(0);
    });
  });
});

// ============== 时长验证测试 ==============

describe('时长验证', () => {
  test('有效整数', () => {
    expect(validateDuration(2)).toEqual({ valid: true, value: 2 });
    expect(validateDuration(5)).toEqual({ valid: true, value: 5 });
  });

  test('有效的x.5格式', () => {
    expect(validateDuration(2.5)).toEqual({ valid: true, value: 2.5 });
    expect(validateDuration(1.5)).toEqual({ valid: true, value: 1.5 });
  });

  test('无效数字被修正', () => {
    // 小数部分 < 0.5 → 修正为整数
    expect(validateDuration(2.3)).toEqual({ valid: true, value: 2 });
    // 小数部分 > 0.5 → 修正为 x.5
    expect(validateDuration(2.7)).toEqual({ valid: true, value: 2.5 });
  });

  test('空值和NaN', () => {
    expect(validateDuration('')).toEqual({ valid: true, value: 0 });
    expect(validateDuration(null)).toEqual({ valid: true, value: 0 });
    expect(validateDuration(NaN)).toEqual({ valid: false, value: 0 });
  });

  test('负数无效', () => {
    expect(validateDuration(-1)).toEqual({ valid: false, value: 0 });
    expect(validateDuration(-0.5)).toEqual({ valid: false, value: 0 });
  });
});

// ============== 折扣计算测试 ==============

describe('折扣计算', () => {
  test('正常折扣', () => {
    expect(applyDiscount(100, 9.5)).toBe(95);
    expect(applyDiscount(100, 9.4)).toBe(94);
    expect(applyDiscount(100, 8)).toBe(80);
  });

  test('无折扣', () => {
    expect(applyDiscount(100, null)).toBe(100);
    expect(applyDiscount(100, NaN)).toBe(100);
    expect(applyDiscount(100, 0)).toBe(100);
  });

  test('极端折扣值', () => {
    expect(applyDiscount(100, 0.1)).toBe(1);
    expect(applyDiscount(100, 9.9)).toBe(99);
  });
});

// ============== 普陪抽成计算测试（重点：v2.13价格门槛修复） ==============

describe('普陪抽成计算', () => {
  describe('无邀请人', () => {
    test('团抽5% + 接抽15%（总价8元 - 测试价格门槛修复）', () => {
      // v2.13修复：之前有价格门槛（总价>10），现在无论多少钱都计算
      const result = calculateCommission('pupai', 8, 0, '');
      expect(result.groupCommission).toBe(0.4);   // 8 × 5% = 0.4
      expect(result.receptionCommission).toBe(1.2); // 8 × 15% = 1.2
      expect(result.dispatchCommission).toBe(0);
      expect(result.inviterCommission).toBe(0);
    });

    test('团抽5% + 接抽15%（总价10元 - 边界值）', () => {
      const result = calculateCommission('pupai', 10, 0, '');
      expect(result.groupCommission).toBe(0.5);   // 10 × 5% = 0.5
      expect(result.receptionCommission).toBe(1.5); // 10 × 15% = 1.5
    });

    test('团抽5% + 接抽15%（总价100元）', () => {
      const result = calculateCommission('pupai', 100, 0, '');
      expect(result.groupCommission).toBe(5);   // 100 × 5% = 5
      expect(result.receptionCommission).toBe(15); // 100 × 15% = 15
    });

    test('极小金额（0.5元）', () => {
      const result = calculateCommission('pupai', 0.5, 0, '');
      expect(result.groupCommission).toBe(0.03);   // 0.5 × 5% = 0.025 ≈ 0.03
      expect(result.receptionCommission).toBe(0.08); // 0.5 × 15% = 0.075 ≈ 0.08
    });
  });

  describe('有邀请人', () => {
    test('团抽5% + 接抽7.5% + 派抽7.5% + 邀请人7.5%（总价80元）', () => {
      const result = calculateCommission('pupai', 80, 0, '张三');
      expect(result.groupCommission).toBe(4);    // 80 × 5% = 4
      expect(result.receptionCommission).toBe(6); // 80 × 7.5% = 6
      expect(result.dispatchCommission).toBe(6); // 80 × 7.5% = 6
      expect(result.inviterCommission).toBe(6);  // 80 × 7.5% = 6
    });

    test('邀请人带空格也被识别', () => {
      const result = calculateCommission('pupai', 80, 0, '  张三  ');
      expect(result.inviterCommission).toBe(6);
    });
  });

  describe('v2.13价格门槛修复验证', () => {
    test('修复前会跳过的低价订单（8元）现在正常计算', () => {
      // 这是一个关键测试用例，验证v2.13修复
      const result = calculateCommission('pupai', 8, 0, '');
      // 确保有抽成计算（而不是返回0）
      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBeGreaterThan(0);
      expect(result.receptionCommission).toBeGreaterThan(0);
    });

    test('修复前会跳过的低价订单（5元）现在正常计算', () => {
      const result = calculateCommission('pupai', 5, 0, '');
      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBe(0.25); // 5 × 5% = 0.25
    });

    test('修复前会跳过的低价订单（0.5元）现在正常计算', () => {
      const result = calculateCommission('pupai', 0.5, 0, '');
      expect(result.hasCommission).toBe(true);
      // 小额抽成也应该被计算
      expect(result.groupCommission).toBeGreaterThan(0);
    });
  });
});

// ============== 礼物/选送抽成计算测试 ==============

describe('礼物/选送抽成计算', () => {
  describe('单价门槛（单价 >= 10 才计算抽成）', () => {
    test('单价9.99元 - 无抽成', () => {
      const result = calculateCommission('gift', 100, 9.99, '', 2);
      expect(result.hasCommission).toBe(false);
      expect(result.groupCommission).toBe(0);
    });

    test('单价10元 - 有抽成', () => {
      const result = calculateCommission('gift', 100, 10, '', 2);
      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBe(10); // 100 × 10% = 10
    });

    test('单价100元 - 有抽成', () => {
      const result = calculateCommission('gift', 200, 100, '', 2);
      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBe(20); // 200 × 10% = 20
    });
  });

  describe('无邀请人', () => {
    test('团抽10% + 接抽10%（单价50元，总价100元）', () => {
      const result = calculateCommission('gift', 100, 50, '', 2);
      expect(result.groupCommission).toBe(10); // 100 × 10% = 10
      expect(result.receptionCommission).toBe(10); // 100 × 10% = 10
      expect(result.dispatchCommission).toBe(0);
      expect(result.inviterCommission).toBe(0);
    });
  });

  describe('有邀请人', () => {
    test('团抽10% + 接抽5% + 邀请人5%（单价50元，总价100元）', () => {
      const result = calculateCommission('gift', 100, 50, '李四', 2);
      expect(result.groupCommission).toBe(10);  // 100 × 10% = 10
      expect(result.receptionCommission).toBe(5); // 100 × 5% = 5
      expect(result.inviterCommission).toBe(5);  // 100 × 5% = 5
      expect(result.dispatchCommission).toBe(0);
    });
  });
});

// ============== 到手价计算测试 ==============

describe('到手价计算', () => {
  describe('普陪类型', () => {
    test('到手价 = 净金额', () => {
      // 总价100，团抽5，接抽15，到手80
      const result = calculateNetDisplay('pupai', 80, 0, 1, true);
      expect(result).toBe(80);
    });
  });

  describe('礼物/选送类型', () => {
    test('无抽成：到手价 = 单价', () => {
      const result = calculateNetDisplay('gift', 50, 50, 2, false);
      expect(result).toBe(50);
    });

    test('有抽成：到手价 = 抽后总价 ÷ 份数', () => {
      // 净金额100，份数2，到手50
      const result = calculateNetDisplay('gift', 100, 50, 2, true);
      expect(result).toBe(50);
    });

    test('有抽成但份数不整除', () => {
      // 净金额100，份数3，100/3 ≈ 33.33
      const result = calculateNetDisplay('gift', 100, 50, 3, true);
      expect(result).toBe(33.33);
    });
  });
});

// ============== 完整计算流程测试 ==============

describe('完整计算流程', () => {
  test('普陪 - 有折扣、有邀请人', () => {
    // 总价100，9折=90，有邀请人
    // 团抽: 90 × 5% = 4.5
    // 接抽: 90 × 7.5% = 6.75
    // 派抽: 90 × 7.5% = 6.75
    // 邀请人抽: 90 × 7.5% = 6.75
    // 净金额: 90 - 4.5 - 6.75 - 6.75 - 6.75 = 65.25
    const result = calculate({
      type: 'pupai',
      totalPrice: 100,
      unitPrice: 0,
      inviter: '王五',
      companion: '赵六',
      discount: 9,
      duration: 2,
      quantity: 1
    });

    expect(result.finalPrice).toBe(90);
    expect(result.groupCommission).toBe(4.5);
    expect(result.receptionCommission).toBe(6.75);
    expect(result.dispatchCommission).toBe(6.75);
    expect(result.inviterCommission).toBe(6.75);
    expect(result.netAmount).toBe(65.25);
  });

  test('礼物/选送 - 无邀请人、低单价（无抽成）', () => {
    // 单价9 < 10，无抽成
    // 到手价 = 单价 = 9
    const result = calculate({
      type: 'gift',
      totalPrice: 18,
      unitPrice: 9,
      inviter: '',
      companion: '小明',
      discount: null,
      duration: 0,
      quantity: 2
    });

    expect(result.hasCommission).toBe(false);
    expect(result.groupCommission).toBe(0);
    expect(result.displayNet).toBe(9);
  });

  test('礼物/选送 - 有邀请人、有抽成', () => {
    // 单价50 >= 10，有抽成，有邀请人
    // 总价100，团抽10%，接抽5%，邀请人5%
    // 团抽: 10, 接抽: 5, 邀请人: 5
    // 净金额: 100 - 10 - 5 - 5 = 80
    // 到手价: 80 / 2份 = 40
    const result = calculate({
      type: 'gift',
      totalPrice: 100,
      unitPrice: 50,
      inviter: '小红',
      companion: '小芳',
      discount: null,
      duration: 0,
      quantity: 2
    });

    expect(result.hasCommission).toBe(true);
    expect(result.groupCommission).toBe(10);
    expect(result.receptionCommission).toBe(5);
    expect(result.inviterCommission).toBe(5);
    expect(result.netAmount).toBe(80);
    expect(result.displayNet).toBe(40);
  });
});

// ============== 边界条件和极端情况测试 ==============

describe('边界条件和极端情况', () => {
  test('零总价', () => {
    const result = calculateCommission('pupai', 0, 0, '');
    expect(result.groupCommission).toBe(0);
    expect(result.receptionCommission).toBe(0);
    expect(result.hasCommission).toBe(false);
  });

  test('超高价订单', () => {
    const result = calculateCommission('pupai', 999999, 0, '');
    expect(result.groupCommission).toBe(49999.95); // 999999 × 5%
    expect(result.receptionCommission).toBe(149999.85); // 999999 × 15%
  });

  test('浮点数精度处理', () => {
    // 0.1 + 0.2 !== 0.3 的经典问题
    const result = calculateCommission('pupai', 0.1, 0, '');
    expect(result.groupCommission).toBe(0.01); // 0.1 × 5% = 0.005 ≈ 0.01
  });

  test('邀请人为空字符串', () => {
    const result = calculateCommission('pupai', 100, 0, '', 1);
    expect(result.inviterCommission).toBe(0);
    expect(result.hasCommission).toBe(true);
  });

  test('未定义的邀请人', () => {
    const result = calculateCommission('pupai', 100, 0, undefined, 1);
    expect(result.inviterCommission).toBe(0);
  });
});
