/**
 * MCS 抽成计算模块
 * Multi-Level Commission Split Settlement System - 多级抽成分账系统
 *
 * 抽成规则：
 * - 普陪：团抽5%，接抽/派抽15%（有邀请人时各7.5%）
 * - 礼物/选送：单价>=10时团抽10%，接抽/派抽10%（有邀请人时各5%）
 *
 * @version 2.13
 */

/**
 * 计算总价（自动计算）
 * 普陪类型：根据时长和单价自动计算
 *   - 整数时长：总价 = 时长 × 单价
 *   - x.5时长：总价 = 整数部分 × 单价 + 单价÷2 + 2
 * 礼物/选送类型：根据份数和单价自动计算
 *   - 总价 = 份数 × 单价
 *
 * @param {string} type - 'pupai' 或 'gift'
 * @param {number} duration - 时长（仅普陪类型使用）
 * @param {number} unitPrice - 单价
 * @param {number} quantity - 份数（仅礼物/选送类型使用）
 * @returns {number} 自动计算的总价
 */
export function calculateAutoTotalPrice(type, duration, unitPrice, quantity) {
  if (type === 'pupai') {
    // 普陪：基于时长计算
    if (duration > 0 && unitPrice > 0) {
      const integerPart = Math.floor(duration);
      const decimalPart = duration - integerPart;

      if (decimalPart === 0) {
        // 整数时长
        return integerPart * unitPrice;
      } else if (decimalPart === 0.5) {
        // x.5时长：加收2元
        return integerPart * unitPrice + unitPrice / 2 + 2;
      }
    }
  } else {
    // 礼物/选送：基于份数计算
    if (quantity > 0 && unitPrice > 0) {
      return quantity * unitPrice;
    }
  }
  return 0;
}

/**
 * 验证并修正时长输入
 * 只接受整数或.x5格式（如 1, 2.5, 3.5）
 *
 * @param {number} duration - 输入的时长值
 * @returns {{valid: boolean, value: number}} 验证结果和修正后的值
 */
export function validateDuration(duration) {
  if (duration === null || duration === undefined || duration === '') {
    return { valid: true, value: 0 };
  }

  const num = parseFloat(duration);
  if (isNaN(num)) {
    return { valid: false, value: 0 };
  }

  if (num < 0) {
    return { valid: false, value: 0 };
  }

  const decimalPart = num - Math.floor(num);
  let correctedValue = num;

  if (decimalPart !== 0 && decimalPart !== 0.5) {
    // 自动修正为最接近的有效值
    if (decimalPart < 0.5) {
      correctedValue = Math.floor(num);
    } else {
      correctedValue = Math.floor(num) + 0.5;
    }
  }

  return { valid: true, value: correctedValue };
}

/**
 * 计算折后总价
 *
 * @param {number} totalPrice - 原始总价
 * @param {number} discount - 折扣（0.1-9.9）
 * @returns {number} 折后总价
 */
export function applyDiscount(totalPrice, discount) {
  if (discount !== null && !isNaN(discount) && discount > 0) {
    return totalPrice * (discount / 10);
  }
  return totalPrice;
}

/**
 * 计算抽成金额
 *
 * 普陪抽成规则（v2.13修复：无价格门槛）：
 *   - 团抽：5%（无论总价多少）
 *   - 无邀请人：接抽 15%
 *   - 有邀请人：接抽 7.5%、派抽 7.5%、邀请人抽 7.5%
 *
 * 礼物/选送抽成规则：
 *   - 单价 >= 10 时计算抽成
 *   - 团抽：10%
 *   - 无邀请人：接抽 10%
 *   - 有邀请人：接抽 5%、邀请人抽 5%、派抽 0
 *
 * @param {string} type - 'pupai' 或 'gift'
 * @param {number} finalPrice - 折后总价
 * @param {number} unitPrice - 单价（礼物/选送类型用于判断是否有抽成）
 * @param {string} inviter - 邀请人姓名
 * @param {number} quantity - 份数（礼物/选送类型用于计算到手价）
 * @returns {Object} 抽成计算结果
 */
export function calculateCommission(type, finalPrice, unitPrice, inviter, quantity = 1) {
  // 初始化抽成金额
  let groupCommission = 0;        // 团抽
  let dispatchCommission = 0;     // 派抽
  let receptionCommission = 0;    // 接抽
  let inviterCommission = 0;      // 邀请人抽

  if (type === 'pupai') {
    // 普陪：无论总价多少都计算抽成（v2.13修复：移除价格门槛）
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

  // 保留两位小数
  const groupVal = Math.round(groupCommission * 100) / 100;
  const dispatchVal = Math.round(dispatchCommission * 100) / 100;
  const receptionVal = Math.round(receptionCommission * 100) / 100;
  const inviterVal = Math.round(inviterCommission * 100) / 100;

  // 计算净金额
  const netAmount = Math.round((finalPrice - groupVal - dispatchVal - receptionVal - inviterVal) * 100) / 100;

  return {
    groupCommission: groupVal,
    dispatchCommission: dispatchVal,
    receptionCommission: receptionVal,
    inviterCommission: inviterVal,
    netAmount,
    hasCommission: groupVal > 0 || dispatchVal > 0 || receptionVal > 0 || inviterVal > 0
  };
}

/**
 * 计算到手价
 *
 * @param {string} type - 'pupai' 或 'gift'
 * @param {number} netAmount - 净金额（扣除所有抽成后）
 * @param {number} unitPrice - 单价（礼物/选送无抽成时使用）
 * @param {number} quantity - 份数（礼物/选送有抽成时使用）
 * @param {boolean} hasCommission - 是否有抽成
 * @returns {number} 到手价
 */
export function calculateNetDisplay(type, netAmount, unitPrice, quantity, hasCommission) {
  if (type === 'pupai') {
    // 普陪：到手价 = 净金额
    return netAmount;
  } else {
    // 礼物/选送类型特殊处理
    if (!hasCommission) {
      // 无抽成：到手价 = 单价
      return unitPrice;
    } else {
      // 有抽成：到手价 = 抽后总价 ÷ 份数
      return Math.round((netAmount / quantity) * 100) / 100;
    }
  }
}

/**
 * 完整的抽成计算入口
 *
 * @param {Object} params - 计算参数
 * @param {string} params.type - 'pupai' 或 'gift'
 * @param {number} params.totalPrice - 原始总价
 * @param {number} params.unitPrice - 单价
 * @param {string} params.inviter - 邀请人
 * @param {string} params.companion - 陪陪
 * @param {number} params.discount - 折扣
 * @param {number} params.duration - 时长（普陪）
 * @param {number} params.quantity - 份数（礼物/选送）
 * @returns {Object} 完整计算结果
 */
export function calculate({
  type,
  totalPrice,
  unitPrice,
  inviter = '',
  companion = '',
  discount = null,
  duration = 0,
  quantity = 1
}) {
  // 计算折后总价
  const finalPrice = applyDiscount(totalPrice, discount);

  // 计算抽成
  const commission = calculateCommission(type, finalPrice, unitPrice, inviter, quantity);

  // 处理陪陪就是邀请人的情况
  const isCompanionInviter = companion && inviter && companion.trim() === inviter.trim();
  let actualNetAmount = commission.netAmount;
  if (isCompanionInviter) {
    actualNetAmount = Math.round((actualNetAmount + commission.inviterCommission) * 100) / 100;
  }

  // 计算显示的到手价
  const displayNet = calculateNetDisplay(
    type,
    actualNetAmount,
    unitPrice,
    quantity,
    commission.hasCommission
  );

  return {
    finalPrice: Math.round(finalPrice * 100) / 100,
    groupCommission: commission.groupCommission,
    dispatchCommission: commission.dispatchCommission,
    receptionCommission: commission.receptionCommission,
    inviterCommission: commission.inviterCommission,
    netAmount: actualNetAmount,
    displayNet,
    hasCommission: commission.hasCommission
  };
}
