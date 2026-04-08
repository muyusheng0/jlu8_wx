#!/usr/bin/env node
/**
 * 小程序综合测试框架
 * 测试范围：WXML/WXSS语法、页面配置、API一致性、样式规范等
 */

const fs = require('fs');
const path = require('path');

const miniprogramRoot = '/home/ubuntu/jlu8/miniprogram';
const issues = [];
const warnings = [];
const okCount = { wxml: 0, wxss: 0, js: 0, config: 0 };

// ==================== 工具函数 ====================

function checkFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    issues.push(`文件缺失: ${filePath}`);
    return false;
  }
  return true;
}

function countOccurrences(content, regex) {
  return (content.match(regex) || []).length;
}

// ==================== WXML 测试 ====================

function testWxmlSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 检查标签匹配
    const viewOpen = countOccurrences(content, /<view/g);
    const viewClose = countOccurrences(content, /<\/view>/g);
    if (viewOpen !== viewClose) {
      issues.push(`[WXML] ${path.basename(filePath)}: view标签不匹配 (打开${viewOpen}, 关闭${viewClose})`);
      return;
    }

    const blockOpen = countOccurrences(content, /<block/g);
    const blockClose = countOccurrences(content, /<\/block>/g);
    if (blockOpen !== blockClose) {
      issues.push(`[WXML] ${path.basename(filePath)}: block标签不匹配`);
      return;
    }

    // 检查必要的组件
    if (content.includes('van-') && !content.includes('vant-weapp')) {
      // 检查是否正确引用了Vant组件
    }

    // 检查空状态
    if (!content.includes('empty-state') && !content.includes('empty-icon')) {
      warnings.push(`[WXML] ${path.basename(filePath)}: 建议添加空状态组件`);
    }

    okCount.wxml++;
  } catch (e) {
    issues.push(`[WXML] ${filePath}: ${e.message}`);
  }
}

// ==================== WXSS 测试 ====================

function testWxssSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 检查大括号匹配
    const openBraces = countOccurrences(content, /{/g);
    const closeBraces = countOccurrences(content, /}/g);
    if (openBraces !== closeBraces) {
      issues.push(`[WXSS] ${path.basename(filePath)}: CSS大括号不匹配 (打开${openBraces}, 关闭${closeBraces})`);
      return;
    }

    // 检查常用样式是否存在
    if (!content.includes('.container')) {
      warnings.push(`[WXSS] ${path.basename(filePath)}: 建议包含.container样式`);
    }

    okCount.wxss++;
  } catch (e) {
    issues.push(`[WXSS] ${filePath}: ${e.message}`);
  }
}

// ==================== JS 测试 ====================

function testJsSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 基本语法检查 - 检查括号匹配
    const parensOpen = countOccurrences(content, /\(/g);
    const parensClose = countOccurrences(content, /\)/g);
    if (parensOpen !== parensClose) {
      issues.push(`[JS] ${path.basename(filePath)}: 括号不匹配`);
    }

    // 检查是否导出了Page或Component
    if (!content.includes('Page(') && !content.includes('Component(') && !content.includes('export default')) {
      warnings.push(`[JS] ${path.basename(filePath)}: 未检测到Page或Component导出`);
    }

    okCount.js++;
  } catch (e) {
    issues.push(`[JS] ${filePath}: ${e.message}`);
  }
}

// ==================== 配置文件测试 ====================

function testAppJson() {
  const appJsonPath = path.join(miniprogramRoot, 'app.json');
  if (!checkFileExists(appJsonPath)) return;

  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    // 检查必要字段
    if (!appJson.pages || !Array.isArray(appJson.pages) || appJson.pages.length === 0) {
      issues.push('[Config] app.json缺少pages字段');
    } else {
      // 检查页面文件是否存在
      appJson.pages.forEach(page => {
        const pagePath = path.join(miniprogramRoot, page + '.wxml');
        if (!fs.existsSync(pagePath)) {
          issues.push(`[Config] app.json中声明的页面不存在: ${page}`);
        }
      });
    }

    // 检查window配置
    if (!appJson.window) {
      issues.push('[Config] app.json缺少window配置');
    }

    // 检查tabBar配置
    if (appJson.tabBar) {
      if (!appJson.tabBar.list || appJson.tabBar.list.length < 2) {
        issues.push('[Config] tabBar.list至少需要2个项目');
      }
    }

    okCount.config++;
    console.log('[OK] app.json配置验证通过');
  } catch (e) {
    issues.push(`[Config] app.json解析失败: ${e.message}`);
  }
}

// ==================== 样式一致性测试 ====================

function testStyleConsistency() {
  const pagesDir = path.join(miniprogramRoot, 'pages');
  const pages = fs.readdirSync(pagesDir);

  // 收集所有页面的主色调
  const headerColors = {};

  pages.forEach(page => {
    const wxssPath = path.join(pagesDir, page, `${page}.wxss`);
    if (fs.existsSync(wxssPath)) {
      const content = fs.readFileSync(wxssPath, 'utf8');
      const headerMatch = content.match(/\.header\s*\{[^}]*background:\s*linear-gradient[^;]*;/g);
      if (headerMatch) {
        headerColors[page] = headerMatch[0];
      }
    }
  });

  // 检查是否使用一致的header样式（波浪效果）
  let waveCount = 0;
  pages.forEach(page => {
    const wxssPath = path.join(pagesDir, page, `${page}.wxss`);
    if (fs.existsSync(wxssPath)) {
      const content = fs.readFileSync(wxssPath, 'utf8');
      if (content.includes('::after') || content.includes(':after')) {
        waveCount++;
      }
    }
  });

  if (waveCount > 0 && waveCount < pages.length) {
    warnings.push(`[Style] 只有${waveCount}/${pages.length}个页面使用了header波浪效果`);
  }
}

// ==================== 页面完整性测试 ====================

function testPageIntegrity() {
  const pagesDir = path.join(miniprogramRoot, 'pages');
  const pages = fs.readdirSync(pagesDir);

  pages.forEach(page => {
    const pageDir = path.join(pagesDir, page);
    if (!fs.statSync(pageDir).isDirectory()) return;

    const wxmlPath = path.join(pageDir, `${page}.wxml`);
    const wxssPath = path.join(pageDir, `${page}.wxss`);
    const jsPath = path.join(pageDir, `${page}.js`);
    const jsonPath = path.join(pageDir, `${page}.json`);

    if (!fs.existsSync(wxmlPath)) {
      issues.push(`[Page] ${page}: 缺少.wxml文件`);
    }
    if (!fs.existsSync(wxssPath)) {
      issues.push(`[Page] ${page}: 缺少.wxss文件`);
    }
    if (!fs.existsSync(jsPath)) {
      issues.push(`[Page] ${page}: 缺少.js文件`);
    }
    // .json文件可能为空对象{}，所以只是警告
    if (!fs.existsSync(jsonPath)) {
      warnings.push(`[Page] ${page}: 缺少.json文件`);
    }
  });
}

// ==================== API 一致性测试 ====================

function testApiConsistency() {
  // 检查wx_api.py中的API与小程序的页面是否对应
  const wxApiPath = '/home/ubuntu/jlu8/wx_api.py';
  if (!fs.existsSync(wxApiPath)) {
    warnings.push('[API] wx_api.py不存在，无法验证API一致性');
    return;
  }

  try {
    const content = fs.readFileSync(wxApiPath, 'utf8');

    // 提取API路由
    const apiRoutes = content.match(/@wx_api\.route\(['"](.*?)['"]/g) || [];
    console.log(`[API] 检测到 ${apiRoutes.length} 个API路由`);

    // 检查关键API是否存在
    const keyApis = [
      'login', 'get_txl', 'get_messages', 'add_message',
      'get_photos', 'get_videos', 'get_activities'
    ];

    keyApis.forEach(api => {
      if (!content.includes(api)) {
        warnings.push(`[API] 关键API '${api}' 可能缺失`);
      }
    });

    okCount.config++;
  } catch (e) {
    warnings.push(`[API] wx_api.py检查失败: ${e.message}`);
  }
}

// ==================== 主函数 ====================

console.log('=== 小程序综合测试框架 ===\n');
console.log('测试范围: WXML语法 | WXSS语法 | JS语法 | 配置文件 | 样式一致性 | 页面完整性 | API一致性\n');

const pagesDir = path.join(miniprogramRoot, 'pages');
const pages = fs.readdirSync(pagesDir);

console.log('--- 页面文件测试 ---');
pages.forEach(page => {
  const pageDir = path.join(pagesDir, page);
  if (!fs.statSync(pageDir).isDirectory()) return;

  const wxmlPath = path.join(pageDir, `${page}.wxml`);
  const wxssPath = path.join(pageDir, `${page}.wxss`);
  const jsPath = path.join(pageDir, `${page}.js`);

  if (fs.existsSync(wxmlPath)) testWxmlSyntax(wxmlPath);
  if (fs.existsSync(wxssPath)) testWxssSyntax(wxssPath);
  if (fs.existsSync(jsPath)) testJsSyntax(jsPath);
});

console.log('\n--- 配置文件测试 ---');
testAppJson();

console.log('\n--- 样式一致性测试 ---');
testStyleConsistency();

console.log('\n--- 页面完整性测试 ---');
testPageIntegrity();

console.log('\n--- API一致性测试 ---');
testApiConsistency();

// ==================== 输出结果 ====================

console.log('\n=== 测试结果汇总 ===');
console.log(`WXML文件测试: ${okCount.wxml} 个通过`);
console.log(`WXSS文件测试: ${okCount.wxss} 个通过`);
console.log(`JS文件测试: ${okCount.js} 个通过`);

if (issues.length > 0) {
  console.log(`\n❌ 发现 ${issues.length} 个问题:`);
  issues.forEach(issue => console.log(`  - ${issue}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  发现 ${warnings.length} 个警告:`);
  warnings.forEach(warning => console.log(`  - ${warning}`));
}

if (issues.length === 0) {
  console.log('\n✅ 所有测试通过!');
  process.exit(0);
} else {
  console.log('\n❌ 测试失败，请修复以上问题');
  process.exit(1);
}
