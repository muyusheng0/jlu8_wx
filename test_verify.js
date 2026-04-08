#!/usr/bin/env node
/**
 * 小程序基本验证脚本
 * 检测常见问题：空状态、样式一致性、文件完整性等
 */

const fs = require('fs');
const path = require('path');

const miniprogramRoot = '/home/ubuntu/jlu8/miniprogram';
const issues = [];

function checkFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    issues.push(`文件缺失: ${filePath}`);
    return false;
  }
  return true;
}

function checkEmptyState(filePath, pageName) {
  const content = fs.readFileSync(filePath, 'utf8');

  // 检查是否有空状态
  if (!content.includes('empty-state') && !content.includes('empty-icon')) {
    // 有些页面不需要空状态（如bind页面），所以这只是提示
    console.log(`[提示] ${pageName}: 未检查到空状态组件`);
  }

  // 检查空状态emoji
  const emptyMatch = content.match(/empty-icon.*?>(.*?)</);
  if (emptyMatch) {
    const emoji = emptyMatch[1].trim();
    if (!emoji || emoji === '') {
      issues.push(`[警告] ${pageName}: 空状态图标为空`);
    }
  }
}

function checkWxmlSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 检查基本的WXML结构问题
    const openTags = (content.match(/<view/g) || []).length;
    const closeTags = (content.match(/<\/view>/g) || []).length;
    if (openTags !== closeTags) {
      issues.push(`[语法错误] ${filePath}: view标签不匹配 (打开${openTags}, 关闭${closeTags})`);
    }

    const blockOpen = (content.match(/<block/g) || []).length;
    const blockClose = (content.match(/<\/block>/g) || []).length;
    if (blockOpen !== blockClose) {
      issues.push(`[语法错误] ${filePath}: block标签不匹配`);
    }

  } catch (e) {
    issues.push(`[错误] 读取文件失败 ${filePath}: ${e.message}`);
  }
}

function checkWxssSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 检查基本的CSS结构问题
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`[语法错误] ${filePath}: CSS大括号不匹配 (打开${openBraces}, 关闭${closeBraces})`);
    }

  } catch (e) {
    issues.push(`[错误] 读取文件失败 ${filePath}: ${e.message}`);
  }
}

function checkPageFiles(pageDir, pageName) {
  const wxmlPath = path.join(pageDir, `${pageName}.wxml`);
  const wxssPath = path.join(pageDir, `${pageName}.wxss`);
  const jsPath = path.join(pageDir, `${pageName}.js`);

  if (checkFileExists(wxmlPath)) {
    checkEmptyState(wxmlPath, pageName);
    checkWxmlSyntax(wxmlPath);
  }

  if (fs.existsSync(wxssPath)) {
    checkWxssSyntax(wxssPath);
  }

  if (!fs.existsSync(jsPath)) {
    issues.push(`[警告] ${pageName}.js 不存在`);
  }
}

console.log('=== 小程序基本验证开始 ===\n');

const pagesDir = path.join(miniprogramRoot, 'pages');
const pages = fs.readdirSync(pagesDir);

pages.forEach(page => {
  const pageDir = path.join(pagesDir, page);
  if (fs.statSync(pageDir).isDirectory()) {
    checkPageFiles(pageDir, page);
  }
});

// 检查app.json配置
const appJsonPath = path.join(miniprogramRoot, 'app.json');
if (checkFileExists(appJsonPath)) {
  try {
    JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    console.log('[OK] app.json 解析正常');
  } catch (e) {
    issues.push(`[语法错误] app.json 解析失败: ${e.message}`);
  }
}

// 检查package.json
const packageJsonPath = path.join(miniprogramRoot, 'package.json');
if (checkFileExists(packageJsonPath)) {
  try {
    JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('[OK] package.json 解析正常');
  } catch (e) {
    issues.push(`[语法错误] package.json 解析失败: ${e.message}`);
  }
}

console.log('\n=== 验证结果 ===');
if (issues.length === 0) {
  console.log('✓ 未发现问题');
  process.exit(0);
} else {
  console.log(`发现 ${issues.length} 个问题:`);
  issues.forEach(issue => console.log(`  - ${issue}`));
  process.exit(1);
}
