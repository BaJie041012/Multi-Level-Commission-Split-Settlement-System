/**
 * @file calculator.js
 * @description MCS 核心计算逻辑模块 - 多级抽成分账计算
 * @author 戒者有八
 * @version 2.13
 * @date 2026-06-17
 */

/**
 * 计算抽成金额和到手价
 * 
 * 抽成规则：
 *  - 普陪：团抽5%，接抽/派抽15%（有邀请人时各7.5%）
 *  - 礼物/选送：单价>=10时团抽10%，接抽/派抽10%（有邀请人时各5%）
 * 
 * 到手价规则：
 *  - 普陪：总价 - 所有抽成
 *  - 礼物/选送无抽成：到手价 = 单价
 *  - 礼物/选送有抽成：到手价 = 抽后总价 ÷ 份数
 * 
 * @param {Object} params - 计算参数
 * @param {string} params.type - 派单类型 'pupai' 或 'gift'
 * @param {number} params.totalPrice - 总价
 * @param {number} params.unitPrice - 单价
 * @param {number} params.quantity - 份数（礼物/选送类型）
 * @param {string} params.inviter - 邀请人
 * @param {string} params.companion - 陪陪
 * @returns {Object} 计算结果
 */
function calculate(params) {
  const { type, totalPrice, unitPrice, quantity, inviter, companion } = params;
  
  const finalPrice = totalPrice || 0;
  const finalUnitPrice = unitPrice || 0;
  const finalQuantity = quantity || 0;

  // 初始化抽成金额
  let groupCommission = 0;        // 团抽
  let dispatchCommission = 0;     // 派抽
  let receptionCommission = 0;    // 接抽
  let inviterCommission = 0;      // 邀请人抽

  // 根据类型计算抽成
  if (type === 'pupai') {
    // 普陪：无论总价多少都计算抽成（v2.13修复：移除价格阈值）
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
  } else if (type === 'gift') {
    // 礼物/选送：单价 >= 10 时计算抽成
    if (finalUnitPrice >= 10) {
      groupCommission = finalPrice * 0.1;   // 团抽10%
      if (inviter && inviter.trim()) {
        // 有邀请人：邀请人和接待各5%（原接抽10%拆分，共20%）
        receptionCommission = finalPrice * 0.05;
        inviterCommission = finalPrice * 0.05;
        dispatchCommission = 0;
      } else {
        // 无邀请人：接抽10%（共20%）
        receptionCommission = finalPrice * 0.1;
      }
    }
  }

  // 保留两位小数
  const groupVal = Math.round(groupCommission * 100) / 100;
  const dispatchVal = Math.round(dispatchCommission * 100) / 100;
  const receptionVal = Math.round(receptionCommission * 100) / 100;
  const inviterVal = Math.round(inviterCommission * 100) / 100;
  
  // 计算净金额（到手价基础值）
  const netAmount = Math.round((finalPrice - groupVal - dispatchVal - receptionVal - inviterVal) * 100) / 100;
  
  // 如果陪陪就是邀请人，合并抽成
  const isCompanionInviter = companion && inviter && companion.trim() === inviter.trim();
  let actualNetAmount = netAmount;
  if (isCompanionInviter) {
    actualNetAmount = Math.round((netAmount + inviterVal) * 100) / 100;
  }

  // 计算显示的到手价
  let displayNet = actualNetAmount;
  if (type !== 'pupai') {
    // 礼物/选送类型特殊处理
    const hasCommission = groupCommission > 0 || dispatchCommission > 0 || 
                          receptionCommission > 0 || inviterCommission > 0;
    if (!hasCommission) {
      // 无抽成：到手价 = 单价
      displayNet = finalUnitPrice;
    } else if (finalQuantity > 0) {
      // 有抽成：到手价 = 抽后总价 ÷ 份数
      displayNet = Math.round((actualNetAmount / finalQuantity) * 100) / 100;
    }
  }

  return {
    groupCommission: groupVal,
    dispatchCommission: dispatchVal,
    receptionCommission: receptionVal,
    inviterCommission: inviterVal,
    netAmount: displayNet,
    hasCommission: type === 'pupai' || (finalUnitPrice >= 10)
  };
}

/**
 * 验证并修正时长输入
 * 只接受整数或.x格式（如 1, 2.5, 3.5）
 * 小数部分非0或0.5时自动修正
 * 
 * @param {number|string} duration - 时长输入
 * @returns {number} 修正后的时长
 */
function validateDuration(duration) {
  if (!duration) return 0;
  
  const num = parseFloat(duration);
  if (isNaN(num)) return 0;
  
  const decimalPart = num - Math.floor(num);
  if (decimalPart !== 0 && decimalPart !== 0.5) {
    if (decimalPart < 0.5) {
      return Math.floor(num);
    } else {
      return Math.floor(num) + 0.5;
    }
  }
  
  return num;
}

/**
 * 自动计算总价
 * 
 * 普陪类型：根据时长和单价自动计算
 *   - 整数时长：总价 = 时长 × 单价
 *   - x.5时长：总价 = 整数部分 × 单价 + 单价÷2 + 2
 * 
 * 礼物/选送类型：根据份数和单价自动计算
 *   - 总价 = 份数 × 单价
 * 
 * @param {Object} params - 计算参数
 * @param {string} params.type - 派单类型 'pupai' 或 'gift'
 * @param {number} params.duration - 时长（普陪类型）
 * @param {number} params.quantity - 份数（礼物/选送类型）
 * @param {number} params.unitPrice - 单价
 * @returns {number} 计算的总价
 */
function calculateTotalPrice(params) {
  const { type, duration, quantity, unitPrice } = params;
  
  const finalUnitPrice = unitPrice || 0;
  if (finalUnitPrice <= 0) return 0;

  if (type === 'pupai') {
    // 普陪：基于时长计算
    const finalDuration = validateDuration(duration);
    if (finalDuration <= 0) return 0;
    
    const integerPart = Math.floor(finalDuration);
    const decimalPart = finalDuration - integerPart;
    
    if (decimalPart === 0) {
      // 整数时长
      return integerPart * finalUnitPrice;
    } else if (decimalPart === 0.5) {
      // x.5时长：加收2元
      return integerPart * finalUnitPrice + finalUnitPrice / 2 + 2;
    }
  } else if (type === 'gift') {
    // 礼物/选送：基于份数计算
    const finalQuantity = quantity || 0;
    if (finalQuantity <= 0) return 0;
    
    return finalQuantity * finalUnitPrice;
  }
  
  return 0;
}

/**
 * 从陪陪字段自动读取份数
 * 以空格分割陪陪名称，数量即为份数
 * 例如：
 *   "八戒 小竹" → 2份
 *   "八戒小竹" → 1份
 *   "八戒 小竹 小竹小竹" → 3份
 * 
 * @param {string} companion - 陪陪字段内容
 * @returns {number} 份数
 */
function calculateQuantityFromCompanion(companion) {
  if (!companion || !companion.trim()) return 0;
  
  const names = companion.trim().split(/\s+/);
  return names.length;
}

module.exports = {
  calculate,
  validateDuration,
  calculateTotalPrice,
  calculateQuantityFromCompanion
};