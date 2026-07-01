/**
 * @file mcs-calculator.js
 * @description MCS抽成计算核心逻辑模块
 * @author 戒者有八
 * @version 2.13
 * @date 2026-06-17
 * 
 * 该模块提取了抽成计算的核心算法，支持：
 * - 普陪模块抽成计算（v2.13修复：移除价格阈值）
 * - 礼物/选送模块抽成计算
 * - 邀请人抽成逻辑
 */

/**
 * 计算抽成金额的核心函数
 * @param {Object} params - 计算参数
 * @param {string} params.type - 派单类型: 'pupai' 或 'gift'
 * @param {number} params.totalPrice - 总价
 * @param {number} params.unitPrice - 单价（礼物/选送专用）
 * @param {number} params.quantity - 份数（礼物/选送专用）
 * @param {string} params.inviter - 邀请人
 * @param {string} params.companion - 陪陪
 * @param {number} params.discount - 折扣（可选）
 * @returns {Object} 计算结果
 */
export function calculateCommission(params) {
  const {
    type,
    totalPrice,
    unitPrice = 0,
    quantity = 1,
    inviter = '',
    companion = '',
    discount = null
  } = params;

  // 计算折后总价
  let finalPrice = totalPrice;
  if (discount !== null && !isNaN(discount) && discount > 0) {
    finalPrice = finalPrice * (discount / 10);
  }

  // 初始化抽成金额
  let groupCommission = 0;        // 团抽
  let dispatchCommission = 0;     // 派抽
  let receptionCommission = 0;    // 接抽
  let inviterCommission = 0;      // 邀请人抽

  // 根据类型计算抽成
  if (type === 'pupai') {
    /**
     * 普陪抽成规则：
     * v2.13修复 - 移除价格阈值，无论总价多少都计算抽成
     * 修复前：仅总价>10时才计算抽成
     * 修复后：普陪无论总价多少都计算抽成
     */
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
    /**
     * 礼物/选送抽成规则：
     * 单价 >= 10 时计算抽成
     */
    if (unitPrice >= 10) {
      groupCommission = finalPrice * 0.1;   // 团抽10%
      
      if (inviter && inviter.trim()) {
        // v2.12修复：有邀请人时，邀请人和接待各5%（无派抽）
        receptionCommission = finalPrice * 0.05;
        inviterCommission = finalPrice * 0.05;
        dispatchCommission = 0;
      } else {
        // 无邀请人：接抽10%
        receptionCommission = finalPrice * 0.1;
      }
    }
  }

  // 保留两位小数，避免浮点数精度问题
  const finalPriceVal = Math.round(finalPrice * 100) / 100;
  const groupVal = Math.round(groupCommission * 100) / 100;
  const dispatchVal = Math.round(dispatchCommission * 100) / 100;
  const receptionVal = Math.round(receptionCommission * 100) / 100;
  const inviterVal = Math.round(inviterCommission * 100) / 100;

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
  if (type === 'gift') {
    // 礼物/选送类型特殊处理
    const hasCommission = groupCommission > 0 || dispatchCommission > 0 || receptionCommission > 0 || inviterCommission > 0;
    
    if (!hasCommission) {
      // 无抽成：到手价 = 单价
      displayNet = unitPrice;
    } else {
      // 有抽成：到手价 = 抽后总价 ÷ 份数
      displayNet = Math.round((actualNetAmount / quantity) * 100) / 100;
    }
  }

  return {
    finalPrice: finalPriceVal,
    groupCommission: groupVal,
    dispatchCommission: dispatchVal,
    receptionCommission: receptionVal,
    inviterCommission: inviterVal,
    netAmount: actualNetAmount,
    displayNet: displayNet,
    isCompanionInviter: isCompanionInviter,
    hasCommission: type === 'pupai' || (type === 'gift' && unitPrice >= 10)
  };
}

/**
 * 验证时长输入格式
 * 只接受整数或.5格式（如 1, 2.5, 3.5）
 * @param {number} duration - 时长值
 * @returns {number|null} 验证并修正后的时长值，无效返回null
 */
export function validateDuration(duration) {
  if (duration === null || duration === undefined || isNaN(duration)) {
    return null;
  }

  const num = parseFloat(duration);
  if (isNaN(num) || num < 0) {
    return null;
  }

  const decimalPart = num - Math.floor(num);
  
  if (decimalPart === 0) {
    return num;  // 整数
  } else if (decimalPart === 0.5) {
    return num;  // .5格式
  } else {
    // 修正为最接近的有效值
    if (decimalPart < 0.5) {
      return Math.floor(num);
    } else {
      return Math.floor(num) + 0.5;
    }
  }
}

/**
 * 计算普陪总价
 * @param {number} duration - 时长
 * @param {number} unitPrice - 单价
 * @returns {number} 总价
 */
export function calculatePupaiPrice(duration, unitPrice) {
  const validatedDuration = validateDuration(duration);
  if (validatedDuration === null || validatedDuration <= 0 || unitPrice <= 0) {
    return 0;
  }

  const integerPart = Math.floor(validatedDuration);
  const decimalPart = validatedDuration - integerPart;

  let totalPrice = 0;
  if (decimalPart === 0) {
    // 整数时长
    totalPrice = integerPart * unitPrice;
  } else if (decimalPart === 0.5) {
    // x.5时长：加收2元
    totalPrice = integerPart * unitPrice + unitPrice / 2 + 2;
  }

  return Math.round(totalPrice * 100) / 100;
}

/**
 * 计算礼物/选送总价
 * @param {number} quantity - 份数
 * @param {number} unitPrice - 单价
 * @returns {number} 总价
 */
export function calculateGiftPrice(quantity, unitPrice) {
  if (!quantity || quantity <= 0 || !unitPrice || unitPrice <= 0) {
    return 0;
  }

  const totalPrice = quantity * unitPrice;
  return Math.round(totalPrice * 100) / 100;
}

/**
 * 构建备注字符串
 * @param {Object} params - 备注参数
 * @param {number} params.discount - 折扣
 * @param {string} params.type - 派单类型
 * @param {string} params.extraReason - 加价理由
 * @param {string} params.customReason - 自定义加价理由
 * @param {number} params.extraAmount - 加价金额
 * @param {string} params.customRemark - 自定义备注
 * @returns {string} 备注字符串
 */
export function buildRemark(params) {
  const {
    discount = null,
    type = '',
    extraReason = '',
    customReason = '',
    extraAmount = 0,
    customRemark = ''
  } = params;

  let remark = '';

  // 折扣备注
  if (discount !== null && !isNaN(discount) && discount > 0) {
    remark += discount.toFixed(1) + '折';
  }

  // 仅普陪类型有加价备注
  if (type === 'pupai' && extraReason && extraAmount > 0) {
    if (remark) remark += '  ';
    const reasonText = extraReason === 'custom' ? (customReason || '加价') : extraReason;
    remark += reasonText + '+' + extraAmount.toFixed(0);
  }

  // 自定义备注
  if (customRemark && customRemark.trim()) {
    if (remark) remark += '  ';
    remark += customRemark.trim();
  }

  return remark;
}

/**
 * 从陪陪字段自动读取份数
 * 以空格分割陪陪名称，数量即为份数
 * @param {string} companion - 陪陪字段内容
 * @returns {number} 份数
 */
export function autoQuantityFromCompanion(companion) {
  if (!companion || !companion.trim()) {
    return 0;
  }

  const names = companion.trim().split(/\s+/);
  return names.length;
}