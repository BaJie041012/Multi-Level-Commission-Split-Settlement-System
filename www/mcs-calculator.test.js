/**
 * @file mcs-calculator.test.js
 * @description MCS抽成计算核心逻辑测试 - 针对关键业务逻辑和回归风险
 * @author 自动化测试缺口分析工具
 * @version 1.0.0
 * @date 2026-07-01
 *
 * 测试覆盖重点：
 * - v2.13修复：普陪模块移除价格阈值（最关键的回归风险）
 * - 核心抽成计算逻辑（业务关键路径）
 * - 边界条件和极端情况
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCommission,
  validateDuration,
  calculatePupaiPrice,
  calculateGiftPrice,
  buildRemark,
  autoQuantityFromCompanion
} from './mcs-calculator.js';

describe('MCS抽成计算核心逻辑测试', () => {
  /**
   * 测试组1: v2.13修复验证 - 普陪模块价格阈值移除
   * 这是本次修复的核心，必须确保不会回归到"仅总价>10才计算抽成"的逻辑
   */
  describe('v2.13修复验证 - 普陪模块价格阈值移除', () => {
    /**
     * 测试场景1: 小额总价（明显小于10元）
     * 修复前：这类场景不计算抽成
     * 修复后：必须计算抽成
     */
    it('应该对小额总价(5元)计算抽成 - 验证v2.13核心修复', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 5,
        inviter: '',
        companion: '测试陪陪'
      });

      // 验证抽成已计算（这是v2.13修复的核心验证）
      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBeCloseTo(0.25, 2);   // 团抽5%: 5 * 0.05
      expect(result.receptionCommission).toBeCloseTo(0.75, 2); // 接抽15%: 5 * 0.15
      expect(result.dispatchCommission).toBeCloseTo(0, 2);     // 无邀请人，派抽为0
      
      // 验证到手价计算正确
      expect(result.netAmount).toBeCloseTo(4, 2); // 5 - 0.25 - 0.75 = 4
    });

    /**
     * 测试场景2: 极小金额（1元）
     * 确保即使金额极小，也计算抽成
     */
    it('应该对极小金额(1元)计算抽成 - 极端边界验证', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 1,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBeCloseTo(0.05, 2);  // 1 * 0.05
      expect(result.receptionCommission).toBeCloseTo(0.15, 2); // 1 * 0.15
      expect(result.netAmount).toBeCloseTo(0.80, 2); // 1 - 0.05 - 0.15 = 0.80
    });

    /**
     * 测试场景3: 价格阈值临界值（10元）
     * 确保阈值临界值处理正确
     */
    it('应该对阈值临界值(10元)正确计算抽成', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 10,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBeCloseTo(0.50, 2);  // 10 * 0.05
      expect(result.receptionCommission).toBeCloseTo(1.50, 2); // 10 * 0.15
      expect(result.netAmount).toBeCloseTo(8, 2); // 10 - 0.5 - 1.5 = 8
    });

    /**
     * 测试场景4: 大额总价
     * 确保修复不影响原有正常场景
     */
    it('应该对大额总价(100元)正确计算抽成 - 确保修复不影响正常场景', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 100,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBeCloseTo(5, 2);   // 100 * 0.05
      expect(result.receptionCommission).toBeCloseTo(15, 2); // 100 * 0.15
      expect(result.netAmount).toBeCloseTo(80, 2); // 100 - 5 - 15 = 80
    });

    /**
     * 测试场景5: 有邀请人的小额总价
     * 确保邀请人拆分逻辑在小额场景也正确
     */
    it('有邀请人时小额总价应正确拆分抽成', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 5,
        inviter: '测试邀请人',
        companion: '测试陪陪'
      });

      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBeCloseTo(0.25, 2);   // 团抽5%
      
      // 注意：Math.round保留两位小数会导致精度变化
      // 5 * 0.075 = 0.375，保留两位小数后为0.38
      expect(result.receptionCommission).toBeCloseTo(0.38, 2); // 接抽7.5%
      expect(result.inviterCommission).toBeCloseTo(0.38, 2); // 邀请人抽7.5%
      expect(result.dispatchCommission).toBeCloseTo(0.38, 2); // 派抽7.5%
      
      // 验证总和：总价5 - 团抽0.25 - 接抽0.38 - 派抽0.38 - 邀请人抽0.38 = 3.61
      expect(result.netAmount).toBeCloseTo(3.61, 2);
    });
  });

  /**
   * 测试组2: 普陪模块核心抽成规则
   * 覆盖无邀请人和有邀请人两种场景
   */
  describe('普陪模块核心抽成规则', () => {
    it('无邀请人时应按15%计算接抽', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 50,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.receptionCommission).toBeCloseTo(7.5, 2); // 50 * 0.15
      expect(result.inviterCommission).toBeCloseTo(0, 2);
      expect(result.dispatchCommission).toBeCloseTo(0, 2);
    });

    it('有邀请人时应拆分为接抽、派抽、邀请人各7.5%', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 50,
        inviter: '测试邀请人',
        companion: '测试陪陪'
      });

      expect(result.receptionCommission).toBeCloseTo(3.75, 2); // 50 * 0.075
      expect(result.inviterCommission).toBeCloseTo(3.75, 2);
      expect(result.dispatchCommission).toBeCloseTo(3.75, 2);
    });

    it('陪陪就是邀请人时应合并抽成', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 50,
        inviter: '小明',
        companion: '小明'
      });

      expect(result.isCompanionInviter).toBe(true);
      
      // 陪陪=邀请人，到手价应加上邀请人抽成
      // 计算：总价50 - 团抽2.5 - 接抽3.75 - 派抽3.75 - 邀请人抽3.75 = 36.25
      // 但陪陪是邀请人，所以到手 = 36.25 + 3.75 = 40
      expect(result.netAmount).toBeCloseTo(40, 2);
    });

    it('折扣应正确计算并影响抽成', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 100,
        discount: 9.5,
        inviter: '',
        companion: '测试陪陪'
      });

      // 折后总价 = 100 * 0.95 = 95
      expect(result.finalPrice).toBeCloseTo(95, 2);
      
      // 抽成基于折后总价计算
      expect(result.groupCommission).toBeCloseTo(4.75, 2); // 95 * 0.05
      expect(result.receptionCommission).toBeCloseTo(14.25, 2); // 95 * 0.15
    });
  });

  /**
   * 测试组3: 礼物/选送模块核心抽成规则
   * 覆盖单价阈值判断和不同抽成场景
   */
  describe('礼物/选送模块核心抽成规则', () => {
    /**
     * 测试场景1: 单价>=10，应计算抽成
     */
    it('单价>=10时应计算抽成', () => {
      const result = calculateCommission({
        type: 'gift',
        totalPrice: 30, // 15 * 2
        unitPrice: 15,
        quantity: 2,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBeCloseTo(3, 2);  // 30 * 0.1
      expect(result.receptionCommission).toBeCloseTo(3, 2); // 30 * 0.1
      
      // 到手价 = 抽后总价 ÷ 份数 = (30 - 3 - 3) / 2 = 12
      expect(result.displayNet).toBeCloseTo(12, 2);
    });

    /**
     * 测试场景2: 单价<10，无抽成
     */
    it('单价<10时应无抽成，到手价=单价', () => {
      const result = calculateCommission({
        type: 'gift',
        totalPrice: 24, // 8 * 3
        unitPrice: 8,
        quantity: 3,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.hasCommission).toBe(false);
      expect(result.groupCommission).toBeCloseTo(0, 2);
      expect(result.receptionCommission).toBeCloseTo(0, 2);
      
      // 到手价 = 单价
      expect(result.displayNet).toBeCloseTo(8, 2);
    });

    /**
     * 测试场景3: 单价边界值10元
     */
    it('单价边界值10元应触发抽成', () => {
      const result = calculateCommission({
        type: 'gift',
        totalPrice: 10,
        unitPrice: 10,
        quantity: 1,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBeCloseTo(1, 2);  // 10 * 0.1
      expect(result.receptionCommission).toBeCloseTo(1, 2); // 10 * 0.1
    });

    /**
     * 测试场景4: 有邀请人时的抽成分配
     * v2.12修复验证：邀请人和接待各5%，无派抽
     */
    it('有邀请人时邀请人和接待各5%，无派抽 - v2.12修复验证', () => {
      const result = calculateCommission({
        type: 'gift',
        totalPrice: 40,
        unitPrice: 20,
        quantity: 2,
        inviter: '测试邀请人',
        companion: '测试陪陪'
      });

      // 验证抽成分配：邀请人和接待各5%
      expect(result.receptionCommission).toBeCloseTo(2, 2); // 40 * 0.05
      expect(result.inviterCommission).toBeCloseTo(2, 2); // 40 * 0.05
      
      // 派抽应为0
      expect(result.dispatchCommission).toBeCloseTo(0, 2);
    });

    /**
     * 测试场景5: 单价>=10但无邀请人
     */
    it('单价>=10但无邀请人时接抽10%', () => {
      const result = calculateCommission({
        type: 'gift',
        totalPrice: 20,
        unitPrice: 20,
        quantity: 1,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.receptionCommission).toBeCloseTo(2, 2); // 20 * 0.1
      expect(result.inviterCommission).toBeCloseTo(0, 2);
    });
  });

  /**
   * 测试组4: 边界条件和极端情况
   * 覆盖零值、负数、极大金额、浮点精度等
   */
  describe('边界条件和极端情况', () => {
    it('零总价应正确处理', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 0,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.groupCommission).toBeCloseTo(0, 2);
      expect(result.receptionCommission).toBeCloseTo(0, 2);
      expect(result.netAmount).toBeCloseTo(0, 2);
    });

    it('负数总价应正确计算', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: -10,
        inviter: '',
        companion: '测试陪陪'
      });

      // 应能处理负数（虽然业务上不合理，但代码应能处理）
      expect(result.groupCommission).toBeCloseTo(-0.5, 2); // -10 * 0.05
      expect(result.receptionCommission).toBeCloseTo(-1.5, 2); // -10 * 0.15
    });

    it('极大金额应不溢出', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 999999,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.groupCommission).toBeCloseTo(49999.95, 2); // 999999 * 0.05
      expect(result.receptionCommission).toBeCloseTo(149999.85, 2); // 999999 * 0.15
      expect(result.netAmount).toBeGreaterThan(0);
    });

    it('浮点数精度应正确处理', () => {
      const result = calculateCommission({
        type: 'pupai',
        totalPrice: 33.33,
        inviter: '',
        companion: '测试陪陪'
      });

      // 验证浮点数计算精度
      expect(result.groupCommission).toBeCloseTo(1.67, 1); // 33.33 * 0.05 ≈ 1.67
      expect(result.receptionCommission).toBeCloseTo(5, 1); // 33.33 * 0.15 ≈ 5
    });

    it('礼物/选送极小单价应无抽成', () => {
      const result = calculateCommission({
        type: 'gift',
        totalPrice: 0.5,
        unitPrice: 0.5,
        quantity: 1,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.hasCommission).toBe(false);
      expect(result.displayNet).toBeCloseTo(0.5, 2);
    });

    it('礼物/选送极大单价应正确计算', () => {
      const result = calculateCommission({
        type: 'gift',
        totalPrice: 10000,
        unitPrice: 100,
        quantity: 100,
        inviter: '',
        companion: '测试陪陪'
      });

      expect(result.hasCommission).toBe(true);
      expect(result.groupCommission).toBeCloseTo(1000, 2); // 10000 * 0.1
      expect(result.receptionCommission).toBeCloseTo(1000, 2); // 10000 * 0.1
    });
  });

  /**
   * 测试组5: 输入验证函数
   */
  describe('输入验证函数', () => {
    describe('validateDuration', () => {
      it('整数时长应返回原值', () => {
        expect(validateDuration(3)).toBe(3);
      });

      it('.5格式时长应返回原值', () => {
        expect(validateDuration(2.5)).toBe(2.5);
      });

      it('其他小数应修正为最接近的有效值', () => {
        expect(validateDuration(2.3)).toBe(2);   // 修正为整数
        expect(validateDuration(2.7)).toBe(2.5); // 修正为.5
      });

      it('无效输入应返回null', () => {
        expect(validateDuration(null)).toBe(null);
        expect(validateDuration(undefined)).toBe(null);
        expect(validateDuration('abc')).toBe(null);
        expect(validateDuration(-1)).toBe(null);
      });
    });

    describe('calculatePupaiPrice', () => {
      it('整数时长总价应正确计算', () => {
        const price = calculatePupaiPrice(2, 50);
        expect(price).toBeCloseTo(100, 2); // 2 * 50
      });

      it('.5时长总价应加收2元', () => {
        const price = calculatePupaiPrice(2.5, 50);
        // x.5时长总价=整数部分×单价+单价÷2+2
        // 所以：2 * 50 + 50/2 + 2 = 100 + 25 + 2 = 127
        expect(price).toBeCloseTo(127, 2);
      });

      it('无效时长应返回0', () => {
        expect(calculatePupaiPrice(0, 50)).toBe(0);
        expect(calculatePupaiPrice(-1, 50)).toBe(0);
        expect(calculatePupaiPrice(2, 0)).toBe(0);
      });
    });

    describe('calculateGiftPrice', () => {
      it('礼物/选送总价应正确计算', () => {
        const price = calculateGiftPrice(3, 15);
        expect(price).toBeCloseTo(45, 2); // 3 * 15
      });

      it('无效输入应返回0', () => {
        expect(calculateGiftPrice(0, 15)).toBe(0);
        expect(calculateGiftPrice(3, 0)).toBe(0);
      });
    });

    describe('buildRemark', () => {
      it('折扣应正确构建备注', () => {
        const remark = buildRemark({ discount: 9.5 });
        expect(remark).toBe('9.5折');
      });

      it('普陪加价应正确构建备注', () => {
        const remark = buildRemark({
          type: 'pupai',
          extraReason: '深夜',
          extraAmount: 5
        });
        expect(remark).toBe('深夜+5');
      });

      it('多个备注应正确拼接', () => {
        const remark = buildRemark({
          discount: 9.5,
          type: 'pupai',
          extraReason: '深夜',
          extraAmount: 5,
          customRemark: '测试备注'
        });
        expect(remark).toBe('9.5折  深夜+5  测试备注');
      });

      it('空备注应返回空字符串', () => {
        const remark = buildRemark({});
        expect(remark).toBe('');
      });
    });

    describe('autoQuantityFromCompanion', () => {
      it('单人应返回1份', () => {
        expect(autoQuantityFromCompanion('八戒')).toBe(1);
      });

      it('多人空格分割应正确计数', () => {
        expect(autoQuantityFromCompanion('八戒 小竹')).toBe(2);
        expect(autoQuantityFromCompanion('八戒 小竹 小竹小竹')).toBe(3);
      });

      it('空字符串应返回0', () => {
        expect(autoQuantityFromCompanion('')).toBe(0);
        expect(autoQuantityFromCompanion('   ')).toBe(0);
      });
    });
  });
});