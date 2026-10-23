'use strict';

// 极简测试运行器：node test/run.js [文件名关键字]
const fs = require('fs');
const path = require('path');

const tests = [];
global.test = (name, fn) => tests.push({ name, fn });

const filter = process.argv[2];
const files = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith('.test.js'))
  .filter((f) => !filter || f.includes(filter))
  .sort();

for (const f of files) {
  require(path.join(__dirname, f));
}

(async () => {
  let pass = 0;
  let fail = 0;
  for (const t of tests) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      fail++;
      console.log(`  ✗ ${t.name}\n      ${e && e.message}`);
    }
  }
  console.log(`\n${pass} 通过，${fail} 失败`);
  process.exitCode = fail ? 1 : 0;
})();
