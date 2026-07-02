const { runAllTests: runCommissionTests } = require('./test-commission');
const { runAllTests: runPriceTests } = require('./test-price');
const { runAllTests: runHelperTests } = require('./test-helpers');

console.log('========================================');
console.log('  MCS 多级抽成分账系统 - 测试套件');
console.log('========================================');

runCommissionTests();
runPriceTests();
runHelperTests();

console.log('\n========================================');
console.log('  测试完成');
console.log('========================================');