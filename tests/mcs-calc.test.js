const test = require('node:test');
const assert = require('node:assert/strict');
const MCSCalc = require('../www/mcs-calc.js');

const {
  round2,
  calcTotalPriceByDuration,
  calcTotalPriceByQuantity,
  applyDiscount,
  validateDuration,
  autoQuantityFromCompanion,
  buildRemark,
  calcPupai,
  calcGift,
  calculate
} = MCSCalc;

test('round2: 两位小数四舍五入', () => {
  assert.equal(round2(10.123), 10.12);
  assert.equal(round2(10.126), 10.13);
  assert.equal(round2(10), 10);
  assert.equal(round2(0), 0);
  assert.equal(round2(0.005), 0.01);
  assert.equal(round2(0.004), 0);
});

test('calcTotalPriceByDuration: 整数时长', () => {
  assert.equal(calcTotalPriceByDuration(2, 100), 200);
  assert.equal(calcTotalPriceByDuration(1, 50), 50);
  assert.equal(calcTotalPriceByDuration(3, 33.33), 99.99);
});

test('calcTotalPriceByDuration: x.5 时长加收2元', () => {
  assert.equal(calcTotalPriceByDuration(2.5, 100), 252);
  assert.equal(calcTotalPriceByDuration(1.5, 50), 77);
  assert.equal(calcTotalPriceByDuration(0.5, 10), 7);
});

test('calcTotalPriceByDuration: 边界和零值', () => {
  assert.equal(calcTotalPriceByDuration(0, 100), 0);
  assert.equal(calcTotalPriceByDuration(2, 0), 0);
  assert.equal(calcTotalPriceByDuration(-1, 100), 0);
  assert.equal(calcTotalPriceByDuration(2, -10), 0);
  assert.equal(calcTotalPriceByDuration(2.3, 100), 0);
});

test('calcTotalPriceByQuantity: 基础计算', () => {
  assert.equal(calcTotalPriceByQuantity(3, 50), 150);
  assert.equal(calcTotalPriceByQuantity(1, 100), 100);
  assert.equal(calcTotalPriceByQuantity(10, 9.9), 99);
});

test('calcTotalPriceByQuantity: 边界和零值', () => {
  assert.equal(calcTotalPriceByQuantity(0, 100), 0);
  assert.equal(calcTotalPriceByQuantity(3, 0), 0);
  assert.equal(calcTotalPriceByQuantity(-5, 100), 0);
});

test('applyDiscount: 折扣计算', () => {
  assert.equal(applyDiscount(100, 9), 90);
  assert.equal(applyDiscount(100, 9.5), 95);
  assert.equal(applyDiscount(200, 8), 160);
  assert.equal(applyDiscount(100, 1), 10);
});

test('applyDiscount: 无折扣时原值返回', () => {
  assert.equal(applyDiscount(100, null), 100);
  assert.equal(applyDiscount(100, undefined), 100);
  assert.equal(applyDiscount(100, NaN), 100);
  assert.equal(applyDiscount(100, 0), 100);
  assert.equal(applyDiscount(100, -1), 100);
});

test('validateDuration: 合法值直接返回', () => {
  assert.equal(validateDuration('2'), '2');
  assert.equal(validateDuration('2.5'), '2.5');
  assert.equal(validateDuration('0.5'), '0.5');
  assert.equal(validateDuration('10'), '10');
});

test('validateDuration: 向下取整到最近的整数或.5', () => {
  assert.equal(validateDuration('2.1'), '2');
  assert.equal(validateDuration('2.2'), '2');
  assert.equal(validateDuration('2.4'), '2');
  assert.equal(validateDuration('2.499'), '2');
});

test('validateDuration: 向上取整到最近的.5', () => {
  assert.equal(validateDuration('2.6'), '2.5');
  assert.equal(validateDuration('2.7'), '2.5');
  assert.equal(validateDuration('2.9'), '2.5');
  assert.equal(validateDuration('2.501'), '2.5');
});

test('validateDuration: 空值和非法值', () => {
  assert.equal(validateDuration(''), '');
  assert.equal(validateDuration(null), '');
  assert.equal(validateDuration(undefined), '');
  assert.equal(validateDuration('abc'), '');
  assert.equal(validateDuration('0'), '');
  assert.equal(validateDuration('-5'), '');
});

test('autoQuantityFromCompanion: 空格分割计算份数', () => {
  assert.equal(autoQuantityFromCompanion('八戒'), 1);
  assert.equal(autoQuantityFromCompanion('八戒 小竹'), 2);
  assert.equal(autoQuantityFromCompanion('八戒 小竹 小三'), 3);
  assert.equal(autoQuantityFromCompanion('a b c d e'), 5);
});

test('autoQuantityFromCompanion: 空值和空白', () => {
  assert.equal(autoQuantityFromCompanion(''), 0);
  assert.equal(autoQuantityFromCompanion('   '), 0);
  assert.equal(autoQuantityFromCompanion(null), 0);
  assert.equal(autoQuantityFromCompanion(undefined), 0);
});

test('autoQuantityFromCompanion: 多空格合并', () => {
  assert.equal(autoQuantityFromCompanion('八戒  小竹'), 2);
  assert.equal(autoQuantityFromCompanion(' 八戒 小竹 '), 2);
  assert.equal(autoQuantityFromCompanion('  八戒  小竹  小三  '), 3);
});

test('buildRemark: 仅折扣', () => {
  assert.equal(buildRemark({ discount: 9 }), '9.0折');
  assert.equal(buildRemark({ discount: 9.5 }), '9.5折');
});

test('buildRemark: 仅加价 (普陪)', () => {
  assert.equal(
    buildRemark({ currentType: 'pupai', extraReason: '深夜', extraAmount: 5 }),
    '深夜+5'
  );
  assert.equal(
    buildRemark({ currentType: 'pupai', extraReason: 'custom', customReason: '心情好', extraAmount: 10 }),
    '心情好+10'
  );
});

test('buildRemark: 折扣+加价组合 (普陪)', () => {
  assert.equal(
    buildRemark({ discount: 9, currentType: 'pupai', extraReason: '深夜', extraAmount: 5 }),
    '9.0折  深夜+5'
  );
});

test('buildRemark: 自定义加价无理由时使用默认', () => {
  assert.equal(
    buildRemark({ currentType: 'pupai', extraReason: 'custom', extraAmount: 10 }),
    '加价+10'
  );
});

test('buildRemark: 礼物/选送不加价备注', () => {
  assert.equal(
    buildRemark({ currentType: 'gift', extraReason: '深夜', extraAmount: 5 }),
    ''
  );
  assert.equal(
    buildRemark({ discount: 9, currentType: 'gift', extraReason: '深夜', extraAmount: 5 }),
    '9.0折'
  );
});

test('buildRemark: 自定义备注', () => {
  assert.equal(buildRemark({ customRemark: '测试备注' }), '测试备注');
  assert.equal(
    buildRemark({ discount: 9, customRemark: '测试备注' }),
    '9.0折  测试备注'
  );
});

test('buildRemark: 空备注', () => {
  assert.equal(buildRemark({}), '');
  assert.equal(buildRemark({ currentType: 'pupai' }), '');
  assert.equal(buildRemark({ customRemark: '   ' }), '');
  assert.equal(buildRemark({ extraReason: '', extraAmount: 0 }), '');
});

test('calcPupai: 无邀请人 - 基础抽成', () => {
  const result = calcPupai({ totalPrice: 100, inviter: '' });
  assert.equal(result.finalPrice, 100);
  assert.equal(result.groupCommission, 5);
  assert.equal(result.receptionCommission, 15);
  assert.equal(result.dispatchCommission, 0);
  assert.equal(result.inviterCommission, 0);
  assert.equal(result.hasInviter, false);
  assert.equal(result.netAmount, 80);
  assert.equal(result.displayNet, 80);
});

test('calcPupai: 有邀请人 - 三分抽成', () => {
  const result = calcPupai({ totalPrice: 100, inviter: '邀请人A' });
  assert.equal(result.groupCommission, 5);
  assert.equal(result.receptionCommission, 7.5);
  assert.equal(result.dispatchCommission, 7.5);
  assert.equal(result.inviterCommission, 7.5);
  assert.equal(result.hasInviter, true);
  assert.equal(result.netAmount, 72.5);
});

test('calcPupai: v2.13 - 低价也计算抽成（无价格门槛）', () => {
  const lowPrice = calcPupai({ totalPrice: 5, inviter: '' });
  assert.equal(lowPrice.groupCommission, 0.25);
  assert.equal(lowPrice.receptionCommission, 0.75);
  assert.equal(lowPrice.hasCommission !== undefined ? lowPrice.hasCommission : true, true);

  const veryLow = calcPupai({ totalPrice: 1, inviter: '' });
  assert.equal(veryLow.groupCommission, 0.05);
  assert.equal(veryLow.receptionCommission, 0.15);

  const zeroPrice = calcPupai({ totalPrice: 0, inviter: '' });
  assert.equal(zeroPrice.groupCommission, 0);
  assert.equal(zeroPrice.receptionCommission, 0);
  assert.equal(zeroPrice.netAmount, 0);
});

test('calcPupai: 陪陪就是邀请人时合并抽成', () => {
  const result = calcPupai({
    totalPrice: 100,
    inviter: '八戒',
    companion: '八戒'
  });
  assert.equal(result.isCompanionInviter, true);
  assert.equal(result.inviterCommission, 7.5);
  assert.equal(result.netAmount, 80);
});

test('calcPupai: 陪陪和邀请人不同', () => {
  const result = calcPupai({
    totalPrice: 100,
    inviter: '八戒',
    companion: '小竹'
  });
  assert.equal(result.isCompanionInviter, false);
  assert.equal(result.netAmount, 72.5);
});

test('calcPupai: 大额计算精度', () => {
  const result = calcPupai({ totalPrice: 9999.99, inviter: '' });
  assert.equal(result.groupCommission, 500);
  assert.equal(result.receptionCommission, 1500);
  assert.equal(result.netAmount, 7999.99);
});

test('calcPupai: 浮点精度处理', () => {
  const result = calcPupai({ totalPrice: 0.1, inviter: '' });
  assert.equal(typeof result.groupCommission, 'number');
  assert.equal(typeof result.receptionCommission, 'number');
  assert.equal(typeof result.netAmount, 'number');
});

test('calcGift: 无邀请人，单价>=10，有抽成', () => {
  const result = calcGift({
    totalPrice: 200,
    unitPrice: 20,
    quantity: 10,
    inviter: ''
  });
  assert.equal(result.hasCommission, true);
  assert.equal(result.groupCommission, 20);
  assert.equal(result.receptionCommission, 20);
  assert.equal(result.dispatchCommission, 0);
  assert.equal(result.inviterCommission, 0);
  assert.equal(result.hasInviter, false);
  assert.equal(result.netAmount, 160);
  assert.equal(result.displayNet, 16);
});

test('calcGift: 有邀请人，单价>=10，有抽成', () => {
  const result = calcGift({
    totalPrice: 200,
    unitPrice: 20,
    quantity: 10,
    inviter: '邀请人A'
  });
  assert.equal(result.hasCommission, true);
  assert.equal(result.groupCommission, 20);
  assert.equal(result.receptionCommission, 10);
  assert.equal(result.dispatchCommission, 0);
  assert.equal(result.inviterCommission, 10);
  assert.equal(result.hasInviter, true);
  assert.equal(result.netAmount, 160);
  assert.equal(result.displayNet, 16);
});

test('calcGift: 单价<10，无抽成，到手价=单价', () => {
  const result = calcGift({
    totalPrice: 50,
    unitPrice: 5,
    quantity: 10,
    inviter: ''
  });
  assert.equal(result.hasCommission, false);
  assert.equal(result.groupCommission, 0);
  assert.equal(result.receptionCommission, 0);
  assert.equal(result.dispatchCommission, 0);
  assert.equal(result.inviterCommission, 0);
  assert.equal(result.displayNet, 5);
});

test('calcGift: 单价=10，边界值，应有抽成', () => {
  const result = calcGift({
    totalPrice: 100,
    unitPrice: 10,
    quantity: 10,
    inviter: ''
  });
  assert.equal(result.hasCommission, true);
  assert.equal(result.groupCommission, 10);
  assert.equal(result.receptionCommission, 10);
});

test('calcGift: 单价=9.99，边界值，无抽成', () => {
  const result = calcGift({
    totalPrice: 99.9,
    unitPrice: 9.99,
    quantity: 10,
    inviter: ''
  });
  assert.equal(result.hasCommission, false);
  assert.equal(result.groupCommission, 0);
  assert.equal(result.displayNet, 9.99);
});

test('calcGift: 陪陪就是邀请人时合并抽成', () => {
  const result = calcGift({
    totalPrice: 200,
    unitPrice: 20,
    quantity: 10,
    inviter: '八戒',
    companion: '八戒'
  });
  assert.equal(result.isCompanionInviter, true);
  assert.equal(result.inviterCommission, 10);
  assert.equal(result.netAmount, 170);
  assert.equal(result.displayNet, 17);
});

test('calcGift: 有邀请人但单价低，无抽成，到手价=单价', () => {
  const result = calcGift({
    totalPrice: 50,
    unitPrice: 5,
    quantity: 10,
    inviter: '邀请人A'
  });
  assert.equal(result.hasCommission, false);
  assert.equal(result.inviterCommission, 0);
  assert.equal(result.displayNet, 5);
});

test('calcGift: 份数为0时的保护', () => {
  const result = calcGift({
    totalPrice: 0,
    unitPrice: 20,
    quantity: 0,
    inviter: ''
  });
  assert.equal(result.hasCommission, true);
  assert.equal(result.displayNet, 0);
});

test('calculate: 类型分发', () => {
  const pupaiResult = calculate('pupai', { totalPrice: 100, inviter: '' });
  assert.equal(pupaiResult.groupCommission, 5);
  assert.equal(pupaiResult.receptionCommission, 15);

  const giftResult = calculate('gift', {
    totalPrice: 200,
    unitPrice: 20,
    quantity: 10,
    inviter: ''
  });
  assert.equal(giftResult.groupCommission, 20);
  assert.equal(giftResult.receptionCommission, 20);
});

test('calculate: 折扣后抽成计算 (普陪)', () => {
  const discounted = applyDiscount(200, 8);
  assert.equal(discounted, 160);
  const result = calcPupai({ totalPrice: discounted, inviter: '' });
  assert.equal(result.finalPrice, 160);
  assert.equal(result.groupCommission, 8);
  assert.equal(result.receptionCommission, 24);
  assert.equal(result.netAmount, 128);
});

test('calculate: 折扣后抽成计算 (礼物/选送)', () => {
  const discounted = applyDiscount(200, 9);
  assert.equal(discounted, 180);
  const result = calcGift({
    totalPrice: discounted,
    unitPrice: 20,
    quantity: 10,
    inviter: ''
  });
  assert.equal(result.finalPrice, 180);
  assert.equal(result.groupCommission, 18);
  assert.equal(result.receptionCommission, 18);
  assert.equal(result.netAmount, 144);
  assert.equal(result.displayNet, 14.4);
});

test('抽成总和验证: 普陪无邀请人 团抽+接抽=20%', () => {
  const result = calcPupai({ totalPrice: 1000, inviter: '' });
  const totalCommission = result.groupCommission + result.receptionCommission;
  assert.equal(totalCommission, 200);
});

test('抽成总和验证: 普陪有邀请人 团抽+接抽+派抽+邀请抽=27.5%', () => {
  const result = calcPupai({ totalPrice: 1000, inviter: 'A' });
  const totalCommission = result.groupCommission + result.receptionCommission
    + result.dispatchCommission + result.inviterCommission;
  assert.equal(totalCommission, 275);
});

test('抽成总和验证: 礼物无邀请人 团抽+接抽=20%', () => {
  const result = calcGift({ totalPrice: 1000, unitPrice: 100, quantity: 10, inviter: '' });
  const totalCommission = result.groupCommission + result.receptionCommission;
  assert.equal(totalCommission, 200);
});

test('抽成总和验证: 礼物有邀请人 团抽+接抽+邀请抽=20%', () => {
  const result = calcGift({ totalPrice: 1000, unitPrice: 100, quantity: 10, inviter: 'A' });
  const totalCommission = result.groupCommission + result.receptionCommission
    + result.inviterCommission;
  assert.equal(totalCommission, 200);
});
