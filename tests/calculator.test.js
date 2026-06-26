/**
 * @file calculator.test.js
 * @description MCS 核心计算逻辑测试 - 多级抽成分账系统
 * @author 戒者有八
 * @version 2.13
 * @date 2026-06-17
 */

import { describe, it, expect } from 'vitest';
import {
  calculate,
  validateDuration,
  calculateTotalPrice,
  calculateQuantityFromCompanion
} from '../src/calculator.js';

/**
 * 核心计算函数测试
 * 重点测试抽成规则、边界条件和历史bug修复验证
 */
describe('calculate - 核心抽成计算', () => {
  
  describe('普陪模块（pupai）', () => {
    
    /**
     * v2.13关键修复：移除总价>10的抽成条件判断
     * 普陪无论多少钱都计算抽成
     */
    it('【v2.13修复验证】普陪总价<=10时仍应计算抽成', () => {
      const result = calculate({
        type: 'pupai',
        totalPrice: 5,
        unitPrice: 5,
        quantity: 0,
        inviter: '',
        companion: '八戒'
      });
      
      // 验证团抽5%存在
      expect(result.groupCommission).toBe(0.25); // 5 * 0.05 = 0.25
      // 验证接抽15%存在
      expect(result.receptionCommission).toBe(0.75); // 5 * 0.15 = 0.75
      // 验证派抽为0
      expect(result.dispatchCommission).toBe(0);
      // 验证邀请人抽为0
      expect(result.inviterCommission).toBe(0);
      // 验证到手价 = 总价 - 团抽 - 接抽 = 5 - 0.25 - 0.75 = 4
      expect(result.netAmount).toBe(4);
      // 验证有抽成标记
      expect(result.hasCommission).toBe(true);
    });

    it('普陪总价为10时应正确计算抽成', () => {
      const result = calculate({
        type: 'pupai',
        totalPrice: 10,
        unitPrice: 10,
        quantity: 0,
        inviter: '',
        companion: '八戒'
      });
      
      expect(result.groupCommission).toBe(0.5); // 10 * 0.05
      expect(result.receptionCommission).toBe(1.5); // 10 * 0.15
      expect(result.netAmount).toBe(8); // 10 - 0.5 - 1.5
    });

    it('普陪总价>10时应正确计算抽成', () => {
      const result = calculate({
        type: 'pupai',
        totalPrice: 50,
        unitPrice: 50,
        quantity: 0,
        inviter: '',
        companion: '八戒'
      });
      
      expect(result.groupCommission).toBe(2.5); // 50 * 0.05
      expect(result.receptionCommission).toBe(7.5); // 50 * 0.15
      expect(result.netAmount).toBe(40); // 50 - 2.5 - 7.5
    });

    /**
     * 邀请人抽成逻辑：接抽、派抽、邀请人各7.5%
     */
    it('普陪有邀请人时抽成分配（各7.5%）', () => {
      const result = calculate({
        type: 'pupai',
        totalPrice: 100,
        unitPrice: 100,
        quantity: 0,
        inviter: '小竹',
        companion: '八戒'
      });
      
      expect(result.groupCommission).toBe(5); // 100 * 0.05
      expect(result.receptionCommission).toBe(7.5); // 100 * 0.075
      expect(result.dispatchCommission).toBe(7.5); // 100 * 0.075
      expect(result.inviterCommission).toBe(7.5); // 100 * 0.075
      // 总抽成 = 5 + 7.5 + 7.5 + 7.5 = 27.5，到手价 = 100 - 27.5 = 72.5
      expect(result.netAmount).toBe(72.5);
    });

    /**
     * 陪陪=邀请人时合并抽成
     */
    it('普陪陪陪即为邀请人时应合并抽成', () => {
      const result = calculate({
        type: 'pupai',
        totalPrice: 100,
        unitPrice: 100,
        quantity: 0,
        inviter: '八戒',
        companion: '八戒'
      });
      
      expect(result.inviterCommission).toBe(7.5);
      // 基础到手价72.5 + 邀请人抽成7.5 = 80
      expect(result.netAmount).toBe(80);
    });

    it('普陪边界条件：总价为0', () => {
      const result = calculate({
        type: 'pupai',
        totalPrice: 0,
        unitPrice: 0,
        quantity: 0,
        inviter: '',
        companion: ''
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
      expect(result.netAmount).toBe(0);
    });

    it('普陪边界条件：浮点数精度处理', () => {
      const result = calculate({
        type: 'pupai',
        totalPrice: 99.99,
        unitPrice: 99.99,
        quantity: 0,
        inviter: '',
        companion: '八戒'
      });
      
      // 验证保留两位小数
      expect(result.groupCommission).toBeCloseTo(5, 1); // 约5.00
      expect(result.receptionCommission).toBeCloseTo(15, 1); // 约15.00
      expect(result.netAmount).toBeCloseTo(80, 1); // 约80.00
    });
  });

  describe('礼物/选送模块（gift）', () => {
    
    /**
     * v2.10修复验证：单价 >= 10 时有抽成
     */
    it('【v2.10修复验证】礼物单价>=10时应计算抽成', () => {
      const result = calculate({
        type: 'gift',
        totalPrice: 20,
        unitPrice: 10,
        quantity: 2,
        inviter: '',
        companion: '八戒'
      });
      
      expect(result.groupCommission).toBe(2); // 20 * 0.10
      expect(result.receptionCommission).toBe(2); // 20 * 0.10
      expect(result.dispatchCommission).toBe(0);
      expect(result.inviterCommission).toBe(0);
      // 到手价 = (总价 - 抽成) / 份数 = (20 - 4) / 2 = 8
      expect(result.netAmount).toBe(8);
      expect(result.hasCommission).toBe(true);
    });

    it('礼物单价<10时无抽成，到手价=单价', () => {
      const result = calculate({
        type: 'gift',
        totalPrice: 18,
        unitPrice: 9,
        quantity: 2,
        inviter: '',
        companion: '八戒'
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
      expect(result.dispatchCommission).toBe(0);
      expect(result.inviterCommission).toBe(0);
      // 无抽成时到手价 = 单价
      expect(result.netAmount).toBe(9);
      expect(result.hasCommission).toBe(false);
    });

    /**
     * v2.12修复验证：有邀请人时邀请人和接待各5%
     */
    it('【v2.12修复验证】礼物有邀请人时邀请人和接待各5%', () => {
      const result = calculate({
        type: 'gift',
        totalPrice: 20,
        unitPrice: 10,
        quantity: 2,
        inviter: '小竹',
        companion: '八戒'
      });
      
      expect(result.groupCommission).toBe(2); // 20 * 0.10
      expect(result.receptionCommission).toBe(1); // 20 * 0.05
      expect(result.inviterCommission).toBe(1); // 20 * 0.05
      expect(result.dispatchCommission).toBe(0);
      // 到手价 = (20 - 2 - 1 - 1) / 2 = 8
      expect(result.netAmount).toBe(8);
    });

    it('礼物单价=10时边界条件（临界值）', () => {
      const result = calculate({
        type: 'gift',
        totalPrice: 10,
        unitPrice: 10,
        quantity: 1,
        inviter: '',
        companion: '八戒'
      });
      
      expect(result.groupCommission).toBe(1); // 10 * 0.10
      expect(result.receptionCommission).toBe(1); // 10 * 0.10
      expect(result.netAmount).toBe(8); // (10 - 2) / 1
      expect(result.hasCommission).toBe(true);
    });

    it('礼物单价=9.99时无抽成', () => {
      const result = calculate({
        type: 'gift',
        totalPrice: 9.99,
        unitPrice: 9.99,
        quantity: 1,
        inviter: '',
        companion: '八戒'
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
      expect(result.netAmount).toBe(9.99);
      expect(result.hasCommission).toBe(false);
    });

    it('礼物份数为0时的边界条件', () => {
      const result = calculate({
        type: 'gift',
        totalPrice: 20,
        unitPrice: 10,
        quantity: 0,
        inviter: '',
        companion: '八戒'
      });
      
      expect(result.groupCommission).toBe(2);
      expect(result.receptionCommission).toBe(2);
      // 份数为0时，到手价应为基础净金额，不应除以0
      expect(result.netAmount).toBe(16); // 20 - 2 - 2
    });

    it('礼物多份数时的正确计算', () => {
      const result = calculate({
        type: 'gift',
        totalPrice: 50,
        unitPrice: 10,
        quantity: 5,
        inviter: '',
        companion: '八戒 小竹 小张 小李 小王'
      });
      
      expect(result.groupCommission).toBe(5); // 50 * 0.10
      expect(result.receptionCommission).toBe(5); // 50 * 0.10
      expect(result.netAmount).toBe(8); // (50 - 10) / 5
    });

    it('礼物有邀请人但单价<10时邀请人抽为0', () => {
      const result = calculate({
        type: 'gift',
        totalPrice: 18,
        unitPrice: 9,
        quantity: 2,
        inviter: '小竹',
        companion: '八戒'
      });
      
      expect(result.groupCommission).toBe(0);
      expect(result.inviterCommission).toBe(0);
      expect(result.receptionCommission).toBe(0);
      expect(result.netAmount).toBe(9); // 单价
    });
  });
});

/**
 * 时长验证和修正测试
 */
describe('validateDuration - 时长验证', () => {
  
  it('整数时长应保持不变', () => {
    expect(validateDuration(1)).toBe(1);
    expect(validateDuration(2)).toBe(2);
    expect(validateDuration(3)).toBe(3);
  });

  it('x.5时长应保持不变', () => {
    expect(validateDuration(1.5)).toBe(1.5);
    expect(validateDuration(2.5)).toBe(2.5);
    expect(validateDuration(3.5)).toBe(3.5);
  });

  /**
   * v1.2修复验证：时长输入验证和自动修正
   */
  it('【v1.2修复验证】小数部分<0.5时向下修正', () => {
    expect(validateDuration(1.2)).toBe(1);
    expect(validateDuration(2.3)).toBe(2);
    expect(validateDuration(3.4)).toBe(3);
  });

  it('【v1.2修复验证】小数部分>0.5时向上修正为x.5', () => {
    expect(validateDuration(1.6)).toBe(1.5);
    expect(validateDuration(2.7)).toBe(2.5);
    expect(validateDuration(3.9)).toBe(3.5);
  });

  it('空值或NaN应返回0', () => {
    expect(validateDuration(null)).toBe(0);
    expect(validateDuration(undefined)).toBe(0);
    expect(validateDuration('')).toBe(0);
    expect(validateDuration('abc')).toBe(0);
  });

  it('负数时长应正确处理', () => {
    expect(validateDuration(-1)).toBe(-1);
    expect(validateDuration(-1.5)).toBe(-1.5);
  });

  it('字符串形式的时长应正确解析', () => {
    expect(validateDuration('2')).toBe(2);
    expect(validateDuration('2.5')).toBe(2.5);
    expect(validateDuration('2.8')).toBe(2.5);
  });
});

/**
 * 总价计算测试
 */
describe('calculateTotalPrice - 总价自动计算', () => {
  
  describe('普陪类型', () => {
    
    /**
     * v1.3修复验证：整数时长计算规则
     */
    it('【v1.3修复验证】整数时长总价 = 时长 × 单价', () => {
      const result = calculateTotalPrice({
        type: 'pupai',
        duration: 2,
        unitPrice: 30
      });
      
      expect(result).toBe(60); // 2 * 30
    });

    /**
     * v1.3修复验证：x.5时长计算规则
     */
    it('【v1.3修复验证】x.5时长总价 = 整数×单价 + 单价÷2 + 2', () => {
      const result = calculateTotalPrice({
        type: 'pupai',
        duration: 1.5,
        unitPrice: 30
      });
      
      expect(result).toBe(47); // 1*30 + 30/2 + 2 = 30 + 15 + 2
    });

    it('x.5时长另一示例', () => {
      const result = calculateTotalPrice({
        type: 'pupai',
        duration: 2.5,
        unitPrice: 40
      });
      
      expect(result).toBe(102); // 2*40 + 40/2 + 2 = 80 + 20 + 2 = 102
    });

    it('时长为0时总价应为0', () => {
      const result = calculateTotalPrice({
        type: 'pupai',
        duration: 0,
        unitPrice: 30
      });
      
      expect(result).toBe(0);
    });

    it('单价为0时总价应为0', () => {
      const result = calculateTotalPrice({
        type: 'pupai',
        duration: 2,
        unitPrice: 0
      });
      
      expect(result).toBe(0);
    });
  });

  describe('礼物/选送类型', () => {
    
    it('总价 = 份数 × 单价', () => {
      const result = calculateTotalPrice({
        type: 'gift',
        quantity: 3,
        unitPrice: 10
      });
      
      expect(result).toBe(30); // 3 * 10
    });

    it('份数为0时总价应为0', () => {
      const result = calculateTotalPrice({
        type: 'gift',
        quantity: 0,
        unitPrice: 10
      });
      
      expect(result).toBe(0);
    });

    it('单价为0时总价应为0', () => {
      const result = calculateTotalPrice({
        type: 'gift',
        quantity: 3,
        unitPrice: 0
      });
      
      expect(result).toBe(0);
    });

    it('多份数示例', () => {
      const result = calculateTotalPrice({
        type: 'gift',
        quantity: 5,
        unitPrice: 15
      });
      
      expect(result).toBe(75); // 5 * 15
    });
  });
});

/**
 * 陪陪字段自动读取份数测试
 */
describe('calculateQuantityFromCompanion - 从陪陪字段读取份数', () => {
  
  it('单个陪陪名字应为1份', () => {
    expect(calculateQuantityFromCompanion('八戒')).toBe(1);
  });

  it('两个名字空格分隔应为2份', () => {
    expect(calculateQuantityFromCompanion('八戒 小竹')).toBe(2);
  });

  it('多个名字空格分隔应正确计数', () => {
    expect(calculateQuantityFromCompanion('八戒 小竹 小张')).toBe(3);
    expect(calculateQuantityFromCompanion('八戒 小竹 小张 小李')).toBe(4);
    expect(calculateQuantityFromCompanion('八戒 小竹 小张 小李 小王')).toBe(5);
  });

  it('名字间多个空格应正确处理', () => {
    expect(calculateQuantityFromCompanion('八戒  小竹')).toBe(2);
    expect(calculateQuantityFromCompanion('八戒   小竹   小张')).toBe(3);
  });

  it('空字段应返回0', () => {
    expect(calculateQuantityFromCompanion('')).toBe(0);
    expect(calculateQuantityFromCompanion(null)).toBe(0);
    expect(calculateQuantityFromCompanion(undefined)).toBe(0);
    expect(calculateQuantityFromCompanion('   ')).toBe(0);
  });

  /**
   * v2.5新增功能：份数自动从陪陪字段读取
   */
  it('【v2.5功能验证】真实业务场景示例', () => {
    expect(calculateQuantityFromCompanion('八戒 小竹 小竹小竹')).toBe(3);
  });
});

/**
 * 边界条件和极端情况测试
 */
describe('边界条件和极端情况', () => {
  
  it('普陪极大总价时的精度处理', () => {
    const result = calculate({
      type: 'pupai',
      totalPrice: 9999.99,
      unitPrice: 9999.99,
      quantity: 0,
      inviter: '',
      companion: '八戒'
    });
    
    expect(result.groupCommission).toBeCloseTo(500, 0);
    expect(result.receptionCommission).toBeCloseTo(1500, 0);
    // 浮点数精度问题，使用更大的容差
    expect(result.netAmount).toBeCloseTo(7999.99, 2);
  });

  it('礼物极大总价和份数时的精度处理', () => {
    const result = calculate({
      type: 'gift',
      totalPrice: 1000,
      unitPrice: 10,
      quantity: 100,
      inviter: '',
      companion: '八戒'
    });
    
    expect(result.groupCommission).toBe(100);
    expect(result.receptionCommission).toBe(100);
    expect(result.netAmount).toBe(8); // (1000 - 200) / 100
  });

  it('未知类型时应返回空抽成', () => {
    const result = calculate({
      type: 'unknown',
      totalPrice: 100,
      unitPrice: 10,
      quantity: 0,
      inviter: '',
      companion: '八戒'
    });
    
    expect(result.groupCommission).toBe(0);
    expect(result.receptionCommission).toBe(0);
    expect(result.dispatchCommission).toBe(0);
    expect(result.inviterCommission).toBe(0);
  });

  it('所有字段为空时的默认值处理', () => {
    const result = calculate({});
    
    expect(result.groupCommission).toBe(0);
    expect(result.receptionCommission).toBe(0);
    expect(result.dispatchCommission).toBe(0);
    expect(result.inviterCommission).toBe(0);
    expect(result.netAmount).toBe(0);
  });
});