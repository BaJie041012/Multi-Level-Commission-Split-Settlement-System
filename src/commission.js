/**
 * @file commission.js
 * @description MCS (Multi-Level Commission Split Settlement System) - 抽成计算核心逻辑
 * @author 戒者有八
 * @version 2.13
 * @date 2026-06-17
 */

/**
 * 计算抽成金额
 * 
 * 普陪规则：
 *  - 无论总价多少都计算抽成
 *  - 团抽5%
 *  - 有邀请人：接抽、派抽、邀请人各7.5%
 *  - 无邀请人：接抽15%
 * 
 * 礼物/选送规则：
 *  - 单价 >= 10时计算抽成
 *  - 团抽10%
 *  - 有邀请人：邀请人和接待各5%
 *  - 无邀请人：接抽10%
 * 
 * @param {Object} params - 计算参数
 * @param {string} params.type - 派单类型：'pupai' 或 'gift'
 * @param {number} params.finalPrice - 最终价格（折后总价）
 * @param {number} params.unitPrice - 单价（礼物/选送类型需要）
 * @param {string} params.inviter - 邀请人（可选）
 * @returns {Object} 抽成金额对象
 */
export function calculateCommission(params) {
  const { type, finalPrice, unitPrice, inviter } = params;
  
  let groupCommission = 0;        // 团抽
  let dispatchCommission = 0;     // 派抽
  let receptionCommission = 0;    // 接抽
  let inviterCommission = 0;      // 邀请人抽
  
  if (type === 'pupai') {
    // 普陪：无论总价多少都计算抽成（修复：移除价格阈值）
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
  
  // 保留两位小数，避免浮点数精度问题
  return {
    groupCommission: Math.round(groupCommission * 100) / 100,
    dispatchCommission: Math.round(dispatchCommission * 100) / 100,
    receptionCommission: Math.round(receptionCommission * 100) / 100,
    inviterCommission: Math.round(inviterCommission * 100) / 100
  };
}

/**
 * 计算到手价
 * 
 * 普陪：总价 - 所有抽成
 * 礼物/选送无抽成：到手价 = 单价
 * 礼物/选送有抽成：到手价 = 抽后总价 ÷ 份数
 * 
 * @param {Object} params - 计算参数
 * @param {string} params.type - 派单类型
 * @param {number} params.finalPrice - 最终价格
 * @param {number} params.unitPrice - 单价
 * @param {number} params.quantity - 份数（礼物/选送类型需要）
 * @param {Object} params.commission - 抽成金额对象
 * @param {string} params.companion - 陪陪人员
 * @param {string} params.inviter - 邀请人
 * @returns {number} 到手价
 */
export function calculateNetAmount(params) {
  const { type, finalPrice, unitPrice, quantity, commission, companion, inviter } = params;
  
  const finalPriceVal = Math.round(finalPrice * 100) / 100;
  const groupVal = commission.groupCommission;
  const dispatchVal = commission.dispatchCommission;
  const receptionVal = commission.receptionCommission;
  const inviterVal = commission.inviterCommission;
  
  // 计算净金额（到手价基础值）
  const netAmount = Math.round((finalPriceVal - groupVal - dispatchVal - receptionVal - inviterVal) * 100) / 100;
  
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
    const hasCommission = commission.groupCommission > 0 || 
                          commission.dispatchCommission > 0 || 
                          commission.receptionCommission > 0 || 
                          commission.inviterCommission > 0;
    if (!hasCommission) {
      // 无抽成：到手价 = 单价
      displayNet = unitPrice;
    } else {
      // 有抽成：到手价 = 抽后总价 ÷ 份数
      displayNet = Math.round((actualNetAmount / quantity) * 100) / 100;
    }
  }
  
  return displayNet;
}

/**
 * 计算总价
 * 
 * 普陪类型：
 *   - 整数时长：总价 = 时长 × 单价
 *   - x.5时长：总价 = 整数部分 × 单价 + 单价÷2 + 2
 * 
 * 礼物/选送类型：
 *   - 总价 = 份数 × 单价
 * 
 * @param {Object} params - 计算参数
 * @param {string} params.type - 派单类型
 * @param {number} params.duration - 时长（普陪类型）
 * @param {number} params.unitPrice - 单价
 * @param {number} params.quantity - 份数（礼物/选送类型）
 * @returns {number} 总价
 */
export function calculateTotalPrice(params) {
  const { type, duration, unitPrice, quantity } = params;
  
  let total = 0;
  
  if (type === 'pupai') {
    // 普陪：基于时长计算
    if (duration > 0 && unitPrice > 0) {
      const integerPart = Math.floor(duration);
      const decimalPart = duration - integerPart;
      
      if (decimalPart === 0) {
        // 整数时长
        total = integerPart * unitPrice;
      } else if (decimalPart === 0.5) {
        // x.5时长：加收2元
        total = integerPart * unitPrice + unitPrice / 2 + 2;
      }
    }
  } else {
    // 礼物/选送：基于份数计算
    if (quantity > 0 && unitPrice > 0) {
      total = quantity * unitPrice;
    }
  }
  
  return Math.round(total * 100) / 100;
}

/**
 * 验证并修正时长输入
 * 只接受整数或.x格式（如 1, 2.5, 3.5）
 * 小数部分非0或0.5时自动修正
 * 
 * @param {number} duration - 输入的时长值
 * @returns {number|null} 修正后的时长值，或null表示无效
 */
export function validateDuration(duration) {
  if (!duration && duration !== 0) return null;
  
  const num = parseFloat(duration);
  if (isNaN(num)) return null;
  
  if (num < 0) return null;
  
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
 * 构建备注字符串
 * 
 * @param {Object} params - 备注参数
 * @param {number|null} params.discount - 折扣值
 * @param {string} params.extraReason - 加价理由
 * @param {string} params.customReason - 自定义加价理由
 * @param {number} params.extraAmount - 加价金额
 * @param {string} params.customRemark - 自定义备注
 * @param {string} params.type - 派单类型（仅普陪有加价）
 * @returns {string} 备注字符串
 */
export function buildRemark(params) {
  const { discount, extraReason, customReason, extraAmount, customRemark, type } = params;
  
  let remark = '';
  
  if (discount !== null && !isNaN(discount) && discount > 0) {
    remark += discount.toFixed(1) + '折';
  }
  
  // 仅普陪类型有加价备注
  if (type === 'pupai' && extraReason && extraAmount > 0) {
    if (remark) remark += '  ';
    let reasonText = extraReason === 'custom' ? (customReason || '加价') : extraReason;
    remark += reasonText + '+' + extraAmount.toFixed(0);
  }
  
  if (customRemark && customRemark.trim()) {
    if (remark) remark += '  ';
    remark += customRemark.trim();
  }
  
  return remark;
}

/**
 * 从陪陪字段自动读取份数
 * 礼物/选送类型专用
 * 以空格分割陪陪名称，数量即为份数
 * 
 * @param {string} companion - 陪陪字段值
 * @returns {number} 份数
 */
export function autoQuantityFromCompanion(companion) {
  if (!companion || !companion.trim()) return 0;
  
  const names = companion.trim().split(/\s+/);
  return names.length;
}