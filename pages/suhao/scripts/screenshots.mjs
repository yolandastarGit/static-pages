import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "http://127.0.0.1:5173";
const OUTPUT_DIR = resolve(
  "/private/tmp/screenshots"
);

const PAGES = [
  // --- 公开页面 ---
  { name: "登录", path: "/login" },
  { name: "忘记密码", path: "/forgot-password" },
  { name: "首次登录修改密码", path: "/first-login-password" },
  { name: "会话已过期", path: "/session-expired" },
  { name: "无权限", path: "/403" },
  { name: "系统异常", path: "/500" },
  { name: "网络异常", path: "/network-error" },
  { name: "系统加载中", path: "/loading" },
  // --- 后台页面 ---
  { name: "工作台", path: "/dashboard" },
  { name: "邮件", path: "/communication/mail" },
  { name: "WhatsApp", path: "/communication/whatsapp" },
  { name: "线索列表", path: "/leads" },
  { name: "公海池", path: "/leads/public-pool" },
  { name: "跟进日志", path: "/leads/follow-logs" },
  { name: "线索详情", path: "/leads/lead-001" },
  { name: "客户列表", path: "/customers" },
  { name: "客户详情", path: "/customers/cus-001" },
  { name: "合同中心", path: "/contracts" },
  { name: "合同详情", path: "/contracts/con-001" },
  { name: "销售经营", path: "/analytics/sales" },
  { name: "获客分析", path: "/analytics/acquisition" },
  { name: "客户经营", path: "/analytics/customers" },
  { name: "站点管理", path: "/sites" },
  { name: "站点详情", path: "/sites/global-shop" },
  { name: "站点配置", path: "/sites/global-shop/config" },
  { name: "我的资料", path: "/user/profile" },
  { name: "账号绑定", path: "/user/bindings" },
  { name: "修改密码", path: "/user/password" },
  { name: "登录安全", path: "/user/security" },
  { name: "用户管理", path: "/system/users" },
  { name: "角色权限", path: "/system/roles" },
  { name: "系统日志", path: "/system/logs" },
  { name: "系统参数", path: "/system/params" },
  { name: "页面不存在", path: "/404" },
];

async function capturePage(page, { name, path }) {
  const url = `${BASE_URL}/#${path}`;
  const filename = `${name}.png`;
  const filepath = `${OUTPUT_DIR}/${filename}`;

  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
    // Wait for app to render
    await page.waitForSelector("#app", { timeout: 10000 }).catch(() => {});
    // Extra wait for async rendering
    await new Promise((r) => setTimeout(r, 2000));

    // Take full page screenshot
    await page.screenshot({
      path: filepath,
      fullPage: true,
      type: "png",
    });

    console.log(`  ✅ ${filename}`);
    return true;
  } catch (err) {
    console.error(`  ❌ ${filename}: ${err.message}`);
    try {
      await page.screenshot({ path: filepath, fullPage: true, type: "png" });
      console.log(`  → Partial capture saved for ${filename}`);
      return true;
    } catch {
      return false;
    }
  }
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browserURL = "http://127.0.0.1:9222";

  // Wait for Chrome to be ready
  for (let i = 0; i < 30; i++) {
    try {
      const resp = await fetch(`${browserURL}/json/version`);
      if (resp.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }

  const browser = await puppeteer.connect({
    browserURL,
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  let success = 0;
  let fail = 0;

  for (const p of PAGES) {
    const ok = await capturePage(page, p);
    if (ok) success++;
    else fail++;
  }

  await page.close();
  await browser.disconnect();

  console.log(`\n=== 截图完成 ===`);
  console.log(`成功: ${success} / ${PAGES.length}`);
  console.log(`失败: ${fail}`);
  console.log(`输出目录: ${OUTPUT_DIR}`);
}

main().catch(console.error);
