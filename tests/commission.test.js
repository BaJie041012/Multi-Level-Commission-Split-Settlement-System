/**
 * @file commission.test.js
 * @description 抽成计算核心逻辑测试
 * 重点测试v2.13修复：移除普陪抽成的价格阈值限制
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCommission,
  calculateNetAmount,
  calculateTotalPrice,
  validateDuration,
  buildRemark,
  autoQuantityFromCompanion
} from '../src/commission.js';

describe('calculateCommission - 抽成计算', () => {
  
  describe('普陪类型 (pupai) - v2.13修复验证', () => {
    
    it('应该在总价较低时仍然计算抽成（修复：移除价格阈值）', () => {
      // 这是v2.13的关键修复：无论总价多少都计算抽成
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 10,  // 低于之前的阈值
        unitPrice: 5,
        inviter: ''
      });
      
      expect(result.groupCommission).toBe(0.5);  // 团抽5%
      expect(result.receptionCommission).toBe(1.5);  // 接抽15%
      expect(result.dispatchCommission).toBe(0);
      expect(result.inviterCommission).toBe(0);
    });
    
    it('应该在总价为5时计算抽成', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 5,
        unitPrice: 2.5,
        inviter: ''
      });
      
      expect(result.groupCommission).toBe(0.25);  // 团抽5%
      expect(result.receptionCommission).toBe(0.75);  // 接抽15%
    });
    
    it('应该在总价为1时计算抽成（极端情况）', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 1,
        unitPrice: 0.5,
        inviter: ''
      });
      
      expect(result.groupCommission).toBe(0.05);
      expect(result.receptionCommission).toBe(0.15);
    });
    
    it('应该在总价为100时正确计算抽成（正常情况）', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        inviter: ''
      });
      
      expect(result.groupCommission).toBe(5);  // 团抽5%
      expect(result.receptionCommission).toBe(15);  // 接抽15%
    });
    
    it('应该在有邀请人时正确分配抽成', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        inviter: '测试邀请人'
      });
      
      expect(result.groupCommission).toBe(5);  // 团抽5%
      expect(result.receptionCommission).toBe(7.5);  // 接抽7.5%
      expect(result.inviterCommission).toBe(7.5);  // 邀请人抽7.5%
      expect(result.dispatchCommission).toBe(7.5);  // 派抽7.5%
    });
    
    it('应该在邀请人为空字符串时不分配邀请人抽成', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        inviter: ''
      });
      
      expect(result.inviterCommission).toBe(0);
      expect(result.receptionCommission).toBe(15);
    });
    
    it('应该在邀请人为空白字符串时不分配邀请人抽成', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        inviter: '   '
      });
      
      expect(result.inviterCommission).toBe(0);
      expect(result.receptionCommission).toBe(15);
    });
  });
  
  describe('礼物/选送类型 (gift)', () => {
    
    it('应该在单价>=10时计算抽成', () => {
      const result = calculateCommission({
        type: 'gift',
        finalPrice: 100,
        unitPrice: 10,  // 临界值
        inviter: ''
      });
      
      expect(result.groupCommission).toBe(10);  // 团抽10%
      expect(result.receptionCommission).toBe(10);  // 接抽10%
    });
    
    it('应该在单价>10时计算抽成', () => {
      const result = calculateCommission({
        type: 'gift',
        finalPrice: 150,
        unitPrice: 15,
        inviter: ''
      });
      
      expect(result.groupCommission).toBe(15);
      expect(result.receptionCommission).toBe(15);
    });
    
    it('应该在单价<10时不计算抽成', () => {
      const result = calculateCommission({
        type: 'gift',
        finalPrice: 90,
        unitPrice: 9,  // 低于10
        inviter: ''
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
      expect(result.inviterCommission).toBe(0);
    });
    
    it('应该在单价=9.99时不计算抽成（边界条件）', () => {
      const result = calculateCommission({
        type: 'gift',
        finalPrice: 9.99,
        unitPrice: 9.99,
        inviter: ''
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
    });
    
    it('应该在有邀请人且单价>=10时正确分配抽成', () => {
      const result = calculateCommission({
        type: 'gift',
        finalPrice: 100,
        unitPrice: 10,
        inviter: '测试邀请人'
      });
      
      expect(result.groupCommission).toBe(10);  // 团抽10%
      expect(result.receptionCommission).toBe(5);  // 接抽5%
      expect(result.inviterCommission).toBe(5);  // 邀请人抽5%
      expect(result.dispatchCommission).toBe(0);
    });
    
    it('应该在有邀请人但单价<10时不分配邀请人抽成', () => {
      const result = calculateCommission({
        type: 'gift',
        finalPrice: 90,
        unitPrice: 9,
        inviter: '测试邀请人'
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
      expect(result.inviterCommission).toBe(0);
    });
  });
  
  describe('浮点数精度处理', () => {
    
    it('应该正确处理浮点数精度问题', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 33.33,
        unitPrice: 16.67,
        inviter: ''
      });
      
      // 验证结果精确到两位小数
      expect(result.groupCommission).toBeCloseTo(1.67, 2);
      expect(result.receptionCommission).toBeCloseTo(5, 2);
    });
    
    it('应该正确处理不精确的总价', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 99.999,
        unitPrice: 50,
        inviter: ''
      });
      
      // 结果应该四舍五入到两位小数
      expect(result.groupCommission).toBe(5);
      expect(result.receptionCommission).toBe(15);
    });
  });
});

describe('calculateNetAmount - 到手价计算', () => {
  
  describe('普陪类型', () => {
    
    it('应该正确计算普陪到手价', () => {
      const commission = calculateCommission({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        inviter: ''
      });
      
      const netAmount = calculateNetAmount({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        quantity: 1,
        commission,
        companion: '八戒',
        inviter: ''
      });
      
      // 100 - 5(团抽) - 15(接抽) = 80
      expect(netAmount).toBe(80);
    });
    
    it('应该在陪陪是邀请人时合并抽成', () => {
      const commission = calculateCommission({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        inviter: '八戒'
      });
      
      const netAmount = calculateNetAmount({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        quantity: 1,
        commission,
        companion: '八戒',  // 陪陪=邀请人
        inviter: '八戒'
      });
      
      // 100 - 5(团抽) - 7.5(接抽) - 7.5(派抽) - 7.5(邀请人抽) = 72.5
      // 陪陪是邀请人时，合并邀请人抽成：72.5 + 7.5 = 80
      expect(netAmount).toBe(80);
    });
    
    it('应该在陪陪不是邀请人时不合并抽成', () => {
      const commission = calculateCommission({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        inviter: '小明'
      });
      
      const netAmount = calculateNetAmount({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        quantity: 1,
        commission,
        companion: '八戒',  // 陪陪≠邀请人
        inviter: '小明'
      });
      
      // 100 - 5 - 7.5 - 7.5 - 7.5 = 72.5
      expect(netAmount).toBe(72.5);
    });
  });
  
  describe('礼物/选送类型', () => {
    
    it('应该在有抽成时按份数计算到手价', () => {
      const commission = calculateCommission({
        type: 'gift',
        finalPrice: 100,
        unitPrice: 10,
        inviter: ''
      });
      
      const netAmount = calculateNetAmount({
        type: 'gift',
        finalPrice: 100,
        unitPrice: 10,
        quantity: 10,  // 10份
        commission,
        companion: '八戒',
        inviter: ''
      });
      
      // 100 - 10(团抽) - 10(接抽) = 80, 然后 80/10 = 8
      expect(netAmount).toBe(8);
    });
    
    it('应该在无抽成时到手价等于单价', () => {
      const commission = calculateCommission({
        type: 'gift',
        finalPrice: 90,
        unitPrice: 9,  // < 10，无抽成
        inviter: ''
      });
      
      const netAmount = calculateNetAmount({
        type: 'gift',
        finalPrice: 90,
        unitPrice: 9,
        quantity: 10,
        commission,
        companion: '八戒',
        inviter: ''
      });
      
      // 无抽成，到手价 = 单价
      expect(netAmount).toBe(9);
    });
    
    it('应该正确处理份数为0的情况', () => {
      const commission = {
        groupCommission: 10,
        receptionCommission: 10,
        dispatchCommission: 0,
        inviterCommission: 0
      };
      
      const netAmount = calculateNetAmount({
        type: 'gift',
        finalPrice: 100,
        unitPrice: 10,
        quantity: 0,  // 份数为0
        commission,
        companion: '八戒',
        inviter: ''
      });
      
      // 当份数为0时，除法会产生Infinity，业务上应该避免
      expect(netAmount).toBe(Infinity);
    });
  });
});

describe('calculateTotalPrice - 总价计算', () => {
  
  describe('普陪类型 - 时长计算规则', () => {
    
    it('应该正确计算整数时长总价', () => {
      const total = calculateTotalPrice({
        type: 'pupai',
        duration: 2,
        unitPrice: 50,
        quantity: 1
      });
      
      expect(total).toBe(100);
    });
    
    it('应该正确计算x.5时长总价（特殊规则）', () => {
      const total = calculateTotalPrice({
        type: 'pupai',
        duration: 1.5,
        unitPrice: 50,
        quantity: 1
      });
      
      // 1 × 50 + 50÷2 + 2 = 50 + 25 + 2 = 77
      expect(total).toBe(77);
    });
    
    it('应该正确计算2.5时长总价', () => {
      const total = calculateTotalPrice({
        type: 'pupai',
        duration: 2.5,
        unitPrice: 50,
        quantity: 1
      });
      
      // 2 × 50 + 50÷2 + 2 = 100 + 25 + 2 = 127
      expect(total).toBe(127);
    });
    
    it('应该对非0.5的小数部分不计算总价', () => {
      const total = calculateTotalPrice({
        type: 'pupai',
        duration: 1.3,  // 非0或0.5
        unitPrice: 50,
        quantity: 1
      });
      
      expect(total).toBe(0);
    });
    
    it('应该在时长为0时返回0', () => {
      const total = calculateTotalPrice({
        type: 'pupai',
        duration: 0,
        unitPrice: 50,
        quantity: 1
      });
      
      expect(total).toBe(0);
    });
    
    it('应该在单价为0时返回0', () => {
      const total = calculateTotalPrice({
        type: 'pupai',
        duration: 2,
        unitPrice: 0,
        quantity: 1
      });
      
      expect(total).toBe(0);
    });
  });
  
  describe('礼物/选送类型 - 份数计算规则', () => {
    
    it('应该正确计算份数总价', () => {
      const total = calculateTotalPrice({
        type: 'gift',
        duration: 0,
        unitPrice: 10,
        quantity: 5
      });
      
      expect(total).toBe(50);
    });
    
    it('应该在份数为1时总价等于单价', () => {
      const total = calculateTotalPrice({
        type: 'gift',
        duration: 0,
        unitPrice: 15,
        quantity: 1
      });
      
      expect(total).toBe(15);
    });
    
    it('应该在份数为0时返回0', () => {
      const total = calculateTotalPrice({
        type: 'gift',
        duration: 0,
        unitPrice: 10,
        quantity: 0
      });
      
      expect(total).toBe(0);
    });
  });
});

describe('validateDuration - 时长验证', () => {
  
  it('应该接受整数时长', () => {
    expect(validateDuration(2)).toBe(2);
    expect(validateDuration(5)).toBe(5);
    expect(validateDuration(0)).toBe(0);
  });
  
  it('应该接受x.5时长', () => {
    expect(validateDuration(1.5)).toBe(1.5);
    expect(validateDuration(2.5)).toBe(2.5);
    expect(validateDuration(0.5)).toBe(0.5);
  });
  
  it('应该修正小于0.5的小数部分', () => {
    expect(validateDuration(1.2)).toBe(1);
    expect(validateDuration(2.3)).toBe(2);
    expect(validateDuration(3.4)).toBe(3);
  });
  
  it('应该修正大于0.5的小数部分', () => {
    expect(validateDuration(1.6)).toBe(1.5);
    expect(validateDuration(2.7)).toBe(2.5);
    expect(validateDuration(3.8)).toBe(3.5);
  });
  
  it('应该拒绝负数时长', () => {
    expect(validateDuration(-1)).toBeNull();
    expect(validateDuration(-2.5)).toBeNull();
  });
  
  it('应该拒绝无效输入', () => {
    expect(validateDuration(null)).toBeNull();
    expect(validateDuration(undefined)).toBeNull();
    expect(validateDuration('abc')).toBeNull();
    expect(validateDuration(NaN)).toBeNull();
  });
  
  it('应该正确处理字符串输入', () => {
    expect(validateDuration('2')).toBe(2);
    expect(validateDuration('1.5')).toBe(1.5);
  });
});

describe('buildRemark - 备注构建', () => {
  
  describe('折扣备注', () => {
    
    it('应该正确添加折扣备注', () => {
      const remark = buildRemark({
        discount: 9.4,
        extraReason: '',
        customReason: '',
        extraAmount: 0,
        customRemark: '',
        type: 'pupai'
      });
      
      expect(remark).toBe('9.4折');
    });
    
    it('应该在折扣为0时不添加折扣备注', () => {
      const remark = buildRemark({
        discount: 0,
        extraReason: '',
        customReason: '',
        extraAmount: 0,
        customRemark: '',
        type: 'pupai'
      });
      
      expect(remark).toBe('');
    });
    
    it('应该在折扣为null时不添加折扣备注', () => {
      const remark = buildRemark({
        discount: null,
        extraReason: '',
        customReason: '',
        extraAmount: 0,
        customRemark: '',
        type: 'pupai'
      });
      
      expect(remark).toBe('');
    });
  });
  
  describe('加价备注 - 仅普陪类型', () => {
    
    it('应该在普陪类型时添加加价备注', () => {
      const remark = buildRemark({
        discount: 0,
        extraReason: '深夜',
        customReason: '',
        extraAmount: 5,
        customRemark: '',
        type: 'pupai'
      });
      
      expect(remark).toBe('深夜+5');
    });
    
    it('应该在礼物类型时不添加加价备注', () => {
      const remark = buildRemark({
        discount: 0,
        extraReason: '深夜',
        customReason: '',
        extraAmount: 5,
        customRemark: '',
        type: 'gift'
      });
      
      expect(remark).toBe('');
    });
    
    it('应该正确处理自定义加价理由', () => {
      const remark = buildRemark({
        discount: 0,
        extraReason: 'custom',
        customReason: '心情好',
        extraAmount: 10,
        customRemark: '',
        type: 'pupai'
      });
      
      expect(remark).toBe('心情好+10');
    });
    
    it('应该在自定义理由为空时使用默认文字', () => {
      const remark = buildRemark({
        discount: 0,
        extraReason: 'custom',
        customReason: '',
        extraAmount: 10,
        customRemark: '',
        type: 'pupai'
      });
      
      expect(remark).toBe('加价+10');
    });
    
    it('应该在加价金额为0时不添加加价备注', () => {
      const remark = buildRemark({
        discount: 0,
        extraReason: '深夜',
        customReason: '',
        extraAmount: 0,
        customRemark: '',
        type: 'pupai'
      });
      
      expect(remark).toBe('');
    });
  });
  
  describe('组合备注', () => {
    
    it('应该正确组合折扣和加价备注', () => {
      const remark = buildRemark({
        discount: 9.4,
        extraReason: '深夜',
        customReason: '',
        extraAmount: 5,
        customRemark: '',
        type: 'pupai'
      });
      
      expect(remark).toBe('9.4折  深夜+5');
    });
    
    it('应该正确组合所有备注', () => {
      const remark = buildRemark({
        discount: 9.4,
        extraReason: 'custom',
        customReason: '心情好',
        extraAmount: 10,
        customRemark: '客户要求',
        type: 'pupai'
      });
      
      expect(remark).toBe('9.4折  心情好+10  客户要求');
    });
  });
});

describe('autoQuantityFromCompanion - 自动份数计算', () => {
  
  it('应该根据空格分割计算份数', () => {
    expect(autoQuantityFromCompanion('八戒 小竹')).toBe(2);
    expect(autoQuantityFromCompanion('八戒 小竹 小竹小竹')).toBe(3);
  });
  
  it('应该在无空格时返回1份', () => {
    expect(autoQuantityFromCompanion('八戒小竹')).toBe(1);
    expect(autoQuantityFromCompanion('八戒')).toBe(1);
  });
  
  it('应该在空字符串时返回0', () => {
    expect(autoQuantityFromCompanion('')).toBe(0);
    expect(autoQuantityFromCompanion('   ')).toBe(0);
  });
  
  it('应该在null或undefined时返回0', () => {
    expect(autoQuantityFromCompanion(null)).toBe(0);
    expect(autoQuantityFromCompanion(undefined)).toBe(0);
  });
  
  it('应该正确处理多个空格', () => {
    expect(autoQuantityFromCompanion('八戒  小竹')).toBe(2);
    expect(autoQuantityFromCompanion('八戒   小竹   小竹小竹')).toBe(3);
  });
  
  it('应该正确处理前后空格', () => {
    expect(autoQuantityFromCompanion('  八戒 小竹  ')).toBe(2);
  });
});

describe('边界条件和极端情况', () => {
  
  describe('零值和负值测试', () => {
    
    it('应该正确处理总价为0的情况', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 0,
        unitPrice: 0,
        inviter: ''
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
    });
    
    it('应该正确处理负总价（业务上不允许，但代码应处理）', () => {
      // 虽然业务上不应该出现负值，但测试代码的健壮性
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: -10,
        unitPrice: -5,
        inviter: ''
      });
      
      // 代码会计算负的抽成
      expect(result.groupCommission).toBe(-0.5);
      expect(result.receptionCommission).toBe(-1.5);
    });
  });
  
  describe('大数值测试', () => {
    
    it('应该正确处理大金额计算', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 10000,
        unitPrice: 5000,
        inviter: ''
      });
      
      expect(result.groupCommission).toBe(500);
      expect(result.receptionCommission).toBe(1500);
    });
    
    it('应该正确处理极大金额', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 999999.99,
        unitPrice: 500000,
        inviter: ''
      });
      
      // 999999.99 * 0.05 = 50000 (四舍五入到两位小数)
      expect(result.groupCommission).toBe(50000);
      expect(result.receptionCommission).toBe(150000);
    });
  });
  
  describe('特殊字符处理', () => {
    
    it('应该正确处理邀请人包含特殊字符', () => {
      const result = calculateCommission({
        type: 'pupai',
        finalPrice: 100,
        unitPrice: 50,
        inviter: '测试@邀请人#123'
      });
      
      expect(result.inviterCommission).toBe(7.5);
    });
    
    it('应该正确处理陪陪包含空格和特殊字符', () => {
      const quantity = autoQuantityFromCompanion('八戒(小竹) 小竹');
      
      expect(quantity).toBe(2);
    });
  });
  
  describe('并发和性能测试', () => {
    
    it('应该能够处理大量连续计算', () => {
      // 测试计算函数的性能和稳定性
      for (let i = 0; i < 100; i++) {
        const result = calculateCommission({
          type: 'pupai',
          finalPrice: 100 + i,
          unitPrice: 50,
          inviter: i % 2 === 0 ? '邀请人' : ''
        });
        
        expect(result.groupCommission).toBeCloseTo((100 + i) * 0.05, 2);
      }
    });
  });
});