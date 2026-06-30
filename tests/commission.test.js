/**
 * @file commission.test.js
 * @description MCS抽成计算核心逻辑测试 - 覆盖v2.13价格门槛移除后的关键风险场景
 * @version 1.0
 * 
 * 测试重点：
 * 1. 普陪类型价格门槛移除后的边界条件验证
 * 2. 抽成计算精度验证（涉及金钱计算）
 * 3. 邀请人场景的正确性验证
 * 4. 礼物/选送单价临界值（>=10 vs <10）测试
 */

/**
 * 模拟calculate函数的核心逻辑
 * 由于原逻辑嵌入HTML，提取为纯函数便于测试
 */
function calculateCommission(params) {
  const {
    currentType,
    finalPrice,
    unitPrice,
    quantity,
    inviter,
    companion
  } = params;

  // 初始化抽成金额
  let groupCommission = 0;
  let dispatchCommission = 0;
  let receptionCommission = 0;
  let inviterCommission = 0;

  // 根据类型计算抽成
  if (currentType === 'pupai') {
    // 普陪：无论总价多少都计算抽成（v2.13移除价格门槛）
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
        receptionCommission = finalPrice * 0.05;
        inviterCommission = finalPrice * 0.05;
        dispatchCommission = 0;
      } else {
        receptionCommission = finalPrice * 0.1;
      }
    }
  }

  // 保留两位小数
  const groupVal = Math.round(groupCommission * 100) / 100;
  const dispatchVal = Math.round(dispatchCommission * 100) / 100;
  const receptionVal = Math.round(receptionCommission * 100) / 100;
  const inviterVal = Math.round(inviterCommission * 100) / 100;
  
  // 计算净金额
  const finalPriceVal = Math.round(finalPrice * 100) / 100;
  const netAmount = Math.round((finalPriceVal - groupVal - dispatchVal - receptionVal - inviterVal) * 100) / 100;
  
  // 如果陪陪就是邀请人，合并抽成
  const isCompanionInviter = companion && inviter && companion.trim() === inviter.trim();
  let actualNetAmount = netAmount;
  if (isCompanionInviter) {
    actualNetAmount = Math.round((netAmount + inviterVal) * 100) / 100;
  }

  // 计算显示的到手价
  let displayNet = actualNetAmount;
  if (currentType !== 'pupai') {
    const hasCommission = groupCommission > 0 || dispatchCommission > 0 || receptionCommission > 0 || inviterCommission > 0;
    if (!hasCommission) {
      displayNet = unitPrice;
    } else {
      displayNet = Math.round((actualNetAmount / quantity) * 100) / 100;
    }
  }

  return {
    groupCommission: groupVal,
    dispatchCommission: dispatchVal,
    receptionCommission: receptionVal,
    inviterCommission: inviterVal,
    netAmount: displayNet,
    actualNetAmount
  };
}

/**
 * 计算总价函数
 */
function calculateTotalPrice(params) {
  const { currentType, duration, unitPrice, quantity } = params;
  
  let autoTotal = 0;
  if (currentType === 'pupai') {
    if (duration > 0 && unitPrice > 0) {
      const integerPart = Math.floor(duration);
      const decimalPart = duration - integerPart;
      
      if (decimalPart === 0) {
        autoTotal = integerPart * unitPrice;
      } else if (decimalPart === 0.5) {
        autoTotal = integerPart * unitPrice + unitPrice / 2 + 2;
      }
    }
  } else {
    if (quantity > 0 && unitPrice > 0) {
      autoTotal = quantity * unitPrice;
    }
  }
  
  return Math.round(autoTotal * 100) / 100;
}

describe('MCS抽成计算测试', () => {
  
  describe('普陪类型 - 价格门槛移除后的验证', () => {
    
    test('总价为0时不应产生抽成', () => {
      const result = calculateCommission({
        currentType: 'pupai',
        finalPrice: 0,
        unitPrice: 0,
        quantity: 0,
        inviter: '',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
      expect(result.dispatchCommission).toBe(0);
      expect(result.inviterCommission).toBe(0);
      expect(result.netAmount).toBe(0);
    });
    
    test('总价为极小值0.01时应正确计算抽成', () => {
      const result = calculateCommission({
        currentType: 'pupai',
        finalPrice: 0.01,
        unitPrice: 0.01,
        quantity: 0,
        inviter: '',
        companion: '测试陪陪'
      });
      
      // 极小值抽成：团抽5% = 0.0005 -> 0.00（四舍五入）
      // 接抽15% = 0.0015 -> 0.00（四舍五入）
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
      expect(result.netAmount).toBe(0.01);
    });
    
    test('总价为正常值100时应正确计算抽成', () => {
      const result = calculateCommission({
        currentType: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        quantity: 0,
        inviter: '',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBe(5);        // 团抽5%
      expect(result.receptionCommission).toBe(15);   // 接抽15%
      expect(result.dispatchCommission).toBe(0);
      expect(result.inviterCommission).toBe(0);
      expect(result.netAmount).toBe(80);             // 100-5-15=80
    });
    
    test('有邀请人时抽成应正确分配', () => {
      const result = calculateCommission({
        currentType: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        quantity: 0,
        inviter: '邀请人A',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBe(5);        // 团抽5%
      expect(result.receptionCommission).toBe(7.5);  // 接抽7.5%
      expect(result.inviterCommission).toBe(7.5);    // 邀请人7.5%
      expect(result.dispatchCommission).toBe(7.5);   // 派抽7.5%
      expect(result.netAmount).toBe(72.5);           // 100-5-7.5-7.5-7.5=72.5
    });
    
    test('陪陪就是邀请人时应合并抽成', () => {
      const result = calculateCommission({
        currentType: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        quantity: 0,
        inviter: '测试陪陪',
        companion: '测试陪陪'
      });
      
      expect(result.inviterCommission).toBe(7.5);
      expect(result.actualNetAmount).toBe(80);  // 72.5 + 7.5 = 80（邀请人抽成返还）
      expect(result.netAmount).toBe(80);
    });
  });
  
  describe('礼物/选送类型 - 单价临界值验证', () => {
    
    test('单价小于10时不应产生抽成', () => {
      const result = calculateCommission({
        currentType: 'gift',
        finalPrice: 18,  // 2份 * 9元
        unitPrice: 9,
        quantity: 2,
        inviter: '',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
      expect(result.netAmount).toBe(9);  // 无抽成时，到手价=单价
    });
    
    test('单价等于10时应产生抽成（临界值）', () => {
      const result = calculateCommission({
        currentType: 'gift',
        finalPrice: 20,  // 2份 * 10元
        unitPrice: 10,
        quantity: 2,
        inviter: '',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBe(2);        // 团抽10%
      expect(result.receptionCommission).toBe(2);    // 接抽10%
      expect(result.netAmount).toBe(8);              // (20-2-2)/2 = 8
    });
    
    test('单价大于10时应正确计算抽成', () => {
      const result = calculateCommission({
        currentType: 'gift',
        finalPrice: 30,  // 2份 * 15元
        unitPrice: 15,
        quantity: 2,
        inviter: '',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBe(3);        // 团抽10% = 30*0.1
      expect(result.receptionCommission).toBe(3);    // 接抽10%
      expect(result.netAmount).toBe(12);             // (30-3-3)/2 = 12
    });
    
    test('有邀请人时邀请人和接待各5%抽成', () => {
      const result = calculateCommission({
        currentType: 'gift',
        finalPrice: 20,
        unitPrice: 10,
        quantity: 2,
        inviter: '邀请人B',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBe(2);        // 团抽10%
      expect(result.receptionCommission).toBe(1);    // 接抽5%
      expect(result.inviterCommission).toBe(1);      // 邀请人5%
      expect(result.dispatchCommission).toBe(0);     // 派抽为0
      expect(result.netAmount).toBe(8);              // (20-2-1-1)/2 = 8
    });
    
    test('单价临界值9.99不应产生抽成', () => {
      const result = calculateCommission({
        currentType: 'gift',
        finalPrice: 19.98,
        unitPrice: 9.99,
        quantity: 2,
        inviter: '',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
      expect(result.netAmount).toBe(9.99);
    });
  });
  
  describe('总价计算验证', () => {
    
    test('普陪整数时长总价计算正确', () => {
      const totalPrice = calculateTotalPrice({
        currentType: 'pupai',
        duration: 2,
        unitPrice: 50,
        quantity: 0
      });
      
      expect(totalPrice).toBe(100);  // 2h * 50元/h
    });
    
    test('普陪x.5时长总价应加收2元', () => {
      const totalPrice = calculateTotalPrice({
        currentType: 'pupai',
        duration: 1.5,
        unitPrice: 50,
        quantity: 0
      });
      
      expect(totalPrice).toBe(77);  // 1*50 + 50/2 + 2 = 77
    });
    
    test('普陪0.5时长总价计算正确', () => {
      const totalPrice = calculateTotalPrice({
        currentType: 'pupai',
        duration: 0.5,
        unitPrice: 100,
        quantity: 0
      });
      
      expect(totalPrice).toBe(52);  // 0*100 + 100/2 + 2 = 52
    });
    
    test('礼物/选送份数总价计算正确', () => {
      const totalPrice = calculateTotalPrice({
        currentType: 'gift',
        duration: 0,
        unitPrice: 15,
        quantity: 3
      });
      
      expect(totalPrice).toBe(45);  // 3份 * 15元/份
    });
  });
  
  describe('精度验证 - 金钱计算关键', () => {
    
    test('大额金额抽成精度正确', () => {
      const result = calculateCommission({
        currentType: 'pupai',
        finalPrice: 1000.33,
        unitPrice: 500,
        quantity: 0,
        inviter: '',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBe(50.02);     // 1000.33 * 0.05
      expect(result.receptionCommission).toBe(150.05); // 1000.33 * 0.15
      expect(result.netAmount).toBe(800.26);
    });
    
    test('浮点数精度问题处理正确', () => {
      const result = calculateCommission({
        currentType: 'pupai',
        finalPrice: 33.33,
        unitPrice: 16.67,
        quantity: 0,
        inviter: '',
        companion: '测试陪陪'
      });
      
      // 验证精度处理，避免浮点数误差
      expect(result.groupCommission).toBeCloseTo(1.67, 2);
      expect(result.receptionCommission).toBeCloseTo(5.00, 2);
      expect(result.netAmount).toBeCloseTo(26.66, 2);
    });
    
    test('多份礼物抽成精度正确', () => {
      const result = calculateCommission({
        currentType: 'gift',
        finalPrice: 33.33,
        unitPrice: 11.11,
        quantity: 3,
        inviter: '',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBeCloseTo(3.33, 2);
      expect(result.receptionCommission).toBeCloseTo(3.33, 2);
      expect(result.netAmount).toBeCloseTo(8.89, 2);  // (33.33-3.33-3.33)/3
    });
  });
  
  describe('边界条件验证', () => {
    
    test('时长为空或0时总价为0', () => {
      const totalPrice = calculateTotalPrice({
        currentType: 'pupai',
        duration: 0,
        unitPrice: 50,
        quantity: 0
      });
      
      expect(totalPrice).toBe(0);
    });
    
    test('单价为空或0时总价为0', () => {
      const totalPrice = calculateTotalPrice({
        currentType: 'pupai',
        duration: 2,
        unitPrice: 0,
        quantity: 0
      });
      
      expect(totalPrice).toBe(0);
    });
    
    test('份数为空或0时总价为0', () => {
      const totalPrice = calculateTotalPrice({
        currentType: 'gift',
        duration: 0,
        unitPrice: 15,
        quantity: 0
      });
      
      expect(totalPrice).toBe(0);
    });
    
    test('邀请人为空格时应视为无邀请人', () => {
      const result = calculateCommission({
        currentType: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        quantity: 0,
        inviter: '   ',
        companion: '测试陪陪'
      });
      
      expect(result.inviterCommission).toBe(0);
      expect(result.receptionCommission).toBe(15);  // 无邀请人，接抽15%
    });
    
    test('负数总价应被正确处理', () => {
      // 虽然业务上不应出现负数，但测试验证数学计算的健壮性
      const result = calculateCommission({
        currentType: 'pupai',
        finalPrice: -100,
        unitPrice: 50,
        quantity: 0,
        inviter: '',
        companion: '测试陪陪'
      });
      
      expect(result.groupCommission).toBe(-5);
      expect(result.receptionCommission).toBe(-15);
      expect(result.netAmount).toBe(-80);
    });
  });
});