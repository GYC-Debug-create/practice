// JS（Node）ACM 起手模板：一次读完全部输入，再按 token 或按行取

const data = require('fs').readFileSync(0, 'utf8');

// 按 token 读（不关心换行时用）
const tokens = data.split(/\s+/).filter(s => s.length > 0);
let pos = 0;
function next() { return pos < tokens.length ? tokens[pos++] : null; }
function nextInt() { return Number(next()); }

// 按行读（要读整行字符串时用）
const lines = data.split(/\r?\n/);

const out = [];

// 在这里写题；结果 push 进 out

console.log(out.join('\n'));

// 注意：超过 2^53 的整数要用 BigInt，例如 BigInt(next())
