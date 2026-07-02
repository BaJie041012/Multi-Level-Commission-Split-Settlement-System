function calculateCommission(input) {
  const {
    type,
    totalPrice,
    unitPrice,
    inviter,
    discount,
    companion
  } = input;

  let finalPrice = totalPrice;
  if (discount !== null && !isNaN(discount) && discount > 0) {
    finalPrice = finalPrice * (discount / 10);
  }

  let groupCommission = 0;
  let dispatchCommission = 0;
  let receptionCommission = 0;
  let inviterCommission = 0;

  if (type === 'pupai') {
    groupCommission = finalPrice * 0.05;
    if (inviter && inviter.trim()) {
      receptionCommission = finalPrice * 0.075;
      inviterCommission = finalPrice * 0.075;
      dispatchCommission = finalPrice * 0.075;
    } else {
      receptionCommission = finalPrice * 0.15;
    }
  } else {
    if (unitPrice >= 10) {
      groupCommission = finalPrice * 0.1;
      if (inviter && inviter.trim()) {
        receptionCommission = finalPrice * 0.05;
        inviterCommission = finalPrice * 0.05;
        dispatchCommission = 0;
      } else {
        receptionCommission = finalPrice * 0.1;
      }
    }
  }

  const finalPriceVal = Math.round(finalPrice * 100) / 100;
  const groupVal = Math.round(groupCommission * 100) / 100;
  const dispatchVal = Math.round(dispatchCommission * 100) / 100;
  const receptionVal = Math.round(receptionCommission * 100) / 100;
  const inviterVal = Math.round(inviterCommission * 100) / 100;

  const netAmount = Math.round((finalPriceVal - groupVal - dispatchVal - receptionVal - inviterVal) * 100) / 100;

  const isCompanionInviter = companion && inviter && companion.trim() === inviter.trim();
  let actualNetAmount = netAmount;
  if (isCompanionInviter) {
    actualNetAmount = Math.round((netAmount + inviterVal) * 100) / 100;
  }

  return {
    finalPrice: finalPriceVal,
    groupCommission: groupVal,
    dispatchCommission: dispatchVal,
    receptionCommission: receptionVal,
    inviterCommission: inviterVal,
    netAmount: actualNetAmount
  };
}

function calculateDisplayNet(input, commissionResult) {
  const { type, quantity, unitPrice } = input;
  const { netAmount, groupCommission, dispatchCommission, receptionCommission, inviterCommission } = commissionResult;

  if (type !== 'pupai') {
    const hasCommission = groupCommission > 0 || dispatchCommission > 0 || receptionCommission > 0 || inviterCommission > 0;
    if (!hasCommission) {
      return unitPrice;
    } else {
      return Math.round((netAmount / quantity) * 100) / 100;
    }
  }
  return netAmount;
}

function calculateTotalPrice(input) {
  const { type, duration, quantity, unitPrice } = input;

  if (type === 'pupai') {
    if (duration > 0 && unitPrice > 0) {
      const integerPart = Math.floor(duration);
      const decimalPart = duration - integerPart;

      if (decimalPart === 0) {
        return integerPart * unitPrice;
      } else if (decimalPart === 0.5) {
        return integerPart * unitPrice + unitPrice / 2 + 2;
      }
    }
  } else {
    if (quantity > 0 && unitPrice > 0) {
      return quantity * unitPrice;
    }
  }
  return 0;
}

function validateDuration(value) {
  if (!value) return null;

  const num = parseFloat(value);
  if (isNaN(num)) return null;

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

function autoQuantityFromCompanion(companion) {
  if (!companion || !companion.trim()) return 0;
  const names = companion.trim().split(/\s+/);
  return names.length;
}

function buildRemark(input) {
  const { discount, type, extraReason, customReason, extraAmount, customRemark } = input;
  
  let remark = '';
  if (discount !== null && !isNaN(discount) && discount > 0) {
    remark += discount.toFixed(1) + '折';
  }
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

function formatResultForCopy(input, commissionResult, displayNet, remark) {
  const { type, duration, receptionist, companion, boss } = input;
  const { finalPrice, groupCommission, dispatchCommission, receptionCommission, inviterCommission } = commissionResult;
  
  let result = `派单：\n`;
  result += `接待：${receptionist || ''}\n`;
  result += `陪陪：${companion || ''}\n`;
  result += `老板：${boss || ''}\n`;
  result += `类型：${type === 'pupai' ? '普陪' : '礼物/选送'}\n`;
  
  if (type !== 'gift') {
    result += `时长：${(duration || 0).toFixed(1)}h\n`;
  }
  
  result += `总价：${finalPrice.toFixed(2)}\n`;
  result += `团抽：${groupCommission > 0 ? groupCommission.toFixed(2) : ''}\n`;
  result += `派抽：${dispatchCommission > 0 ? dispatchCommission.toFixed(2) : ''}\n`;
  result += `接抽：${receptionCommission > 0 ? receptionCommission.toFixed(2) : ''}\n`;
  result += `邀请人：${input.inviter || ''}\n`;
  result += `邀请人抽：${inviterCommission > 0 ? inviterCommission.toFixed(2) : ''}\n`;
  result += `到手：${displayNet.toFixed(2)}\n`;
  result += `备注：${remark}\n`;
  
  return result;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateCommission,
    calculateDisplayNet,
    calculateTotalPrice,
    validateDuration,
    autoQuantityFromCompanion,
    buildRemark,
    formatResultForCopy
  };
}