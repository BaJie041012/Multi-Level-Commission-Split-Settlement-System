/**
 * @file mcs-calc.js
 * @description MCS 核心计算逻辑 - 纯函数模块，可独立测试
 *              抽离自 index.html 的业务逻辑，与 DOM 操作完全解耦
 * @version 2.13
 * @date 2026-06-17
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MCSCalc = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const PUPAI_RATES = {
    group: 0.05,
    receptionNoInviter: 0.15,
    receptionWithInviter: 0.075,
    dispatchWithInviter: 0.075,
    inviter: 0.075
  };

  const GIFT_RATES = {
    group: 0.10,
    receptionNoInviter: 0.10,
    receptionWithInviter: 0.05,
    inviter: 0.05,
    priceThreshold: 10
  };

  function round2(num) {
    return Math.round(num * 100) / 100;
  }

  function calcTotalPriceByDuration(duration, unitPrice) {
    if (duration <= 0 || unitPrice <= 0) return 0;
    const integerPart = Math.floor(duration);
    const decimalPart = duration - integerPart;
    if (decimalPart === 0) {
      return round2(integerPart * unitPrice);
    } else if (decimalPart === 0.5) {
      return round2(integerPart * unitPrice + unitPrice / 2 + 2);
    }
    return 0;
  }

  function calcTotalPriceByQuantity(quantity, unitPrice) {
    if (quantity <= 0 || unitPrice <= 0) return 0;
    return round2(quantity * unitPrice);
  }

  function applyDiscount(totalPrice, discount) {
    if (discount === null || discount === undefined || isNaN(discount) || discount <= 0) {
      return round2(totalPrice);
    }
    return round2(totalPrice * (discount / 10));
  }

  function validateDuration(value) {
    if (!value && value !== 0) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    if (num <= 0) return '';
    const decimalPart = num - Math.floor(num);
    if (decimalPart === 0 || decimalPart === 0.5) {
      return num.toString();
    }
    if (decimalPart < 0.5) {
      return Math.floor(num).toString();
    } else {
      return (Math.floor(num) + 0.5).toString();
    }
  }

  function autoQuantityFromCompanion(companion) {
    if (!companion || !companion.trim()) return 0;
    const names = companion.trim().split(/\s+/);
    return names.length;
  }

  function buildRemark(params) {
    const {
      discount,
      currentType = 'pupai',
      extraReason = '',
      extraAmount = 0,
      customReason = '',
      customRemark = ''
    } = params;

    let remark = '';

    if (discount !== null && discount !== undefined && !isNaN(discount) && discount > 0) {
      remark += discount.toFixed(1) + '折';
    }

    if (currentType === 'pupai' && extraReason && extraAmount > 0) {
      if (remark) remark += '  ';
      const reasonText = extraReason === 'custom' ? (customReason || '加价') : extraReason;
      remark += reasonText + '+' + extraAmount.toFixed(0);
    }

    if (customRemark && customRemark.trim()) {
      if (remark) remark += '  ';
      remark += customRemark.trim();
    }

    return remark;
  }

  function calcPupai(params) {
    const { totalPrice, inviter = '', companion = '' } = params;
    const finalPrice = round2(totalPrice);
    const hasInviter = Boolean(inviter && inviter.trim().length > 0);

    let groupCommission = finalPrice * PUPAI_RATES.group;
    let receptionCommission = 0;
    let dispatchCommission = 0;
    let inviterCommission = 0;

    if (hasInviter) {
      receptionCommission = finalPrice * PUPAI_RATES.receptionWithInviter;
      dispatchCommission = finalPrice * PUPAI_RATES.dispatchWithInviter;
      inviterCommission = finalPrice * PUPAI_RATES.inviter;
    } else {
      receptionCommission = finalPrice * PUPAI_RATES.receptionNoInviter;
    }

    const groupVal = round2(groupCommission);
    const receptionVal = round2(receptionCommission);
    const dispatchVal = round2(dispatchCommission);
    const inviterVal = round2(inviterCommission);

    const netAmount = round2(finalPrice - groupVal - dispatchVal - receptionVal - inviterVal);

    const isCompanionInviter = Boolean(companion && inviter &&
      companion.trim() === inviter.trim());
    let actualNetAmount = netAmount;
    if (isCompanionInviter) {
      actualNetAmount = round2(netAmount + inviterVal);
    }

    return {
      finalPrice: round2(finalPrice),
      groupCommission: groupVal,
      receptionCommission: receptionVal,
      dispatchCommission: dispatchVal,
      inviterCommission: inviterVal,
      netAmount: actualNetAmount,
      displayNet: actualNetAmount,
      hasInviter: hasInviter,
      isCompanionInviter: isCompanionInviter
    };
  }

  function calcGift(params) {
    const { totalPrice, unitPrice, quantity, inviter = '', companion = '' } = params;
    const finalPrice = round2(totalPrice);
    const hasInviter = Boolean(inviter && inviter.trim().length > 0);
    const hasCommission = unitPrice >= GIFT_RATES.priceThreshold;

    let groupCommission = 0;
    let receptionCommission = 0;
    let dispatchCommission = 0;
    let inviterCommission = 0;

    if (hasCommission) {
      groupCommission = finalPrice * GIFT_RATES.group;
      if (hasInviter) {
        receptionCommission = finalPrice * GIFT_RATES.receptionWithInviter;
        inviterCommission = finalPrice * GIFT_RATES.inviter;
        dispatchCommission = 0;
      } else {
        receptionCommission = finalPrice * GIFT_RATES.receptionNoInviter;
      }
    }

    const groupVal = round2(groupCommission);
    const receptionVal = round2(receptionCommission);
    const dispatchVal = round2(dispatchCommission);
    const inviterVal = round2(inviterCommission);

    const netAmount = round2(finalPrice - groupVal - dispatchVal - receptionVal - inviterVal);

    const isCompanionInviter = Boolean(companion && inviter &&
      companion.trim() === inviter.trim());
    let actualNetAmount = netAmount;
    if (isCompanionInviter) {
      actualNetAmount = round2(netAmount + inviterVal);
    }

    let displayNet;
    if (!hasCommission) {
      displayNet = unitPrice;
    } else {
      displayNet = quantity > 0 ? round2(actualNetAmount / quantity) : 0;
    }

    return {
      finalPrice: round2(finalPrice),
      groupCommission: groupVal,
      receptionCommission: receptionVal,
      dispatchCommission: dispatchVal,
      inviterCommission: inviterVal,
      netAmount: actualNetAmount,
      displayNet: displayNet,
      hasInviter: hasInviter,
      isCompanionInviter: isCompanionInviter,
      hasCommission: hasCommission
    };
  }

  function calculate(type, params) {
    if (type === 'pupai') {
      return calcPupai(params);
    } else {
      return calcGift(params);
    }
  }

  return {
    PUPAI_RATES: PUPAI_RATES,
    GIFT_RATES: GIFT_RATES,
    round2: round2,
    calcTotalPriceByDuration: calcTotalPriceByDuration,
    calcTotalPriceByQuantity: calcTotalPriceByQuantity,
    applyDiscount: applyDiscount,
    validateDuration: validateDuration,
    autoQuantityFromCompanion: autoQuantityFromCompanion,
    buildRemark: buildRemark,
    calcPupai: calcPupai,
    calcGift: calcGift,
    calculate: calculate
  };
}));
