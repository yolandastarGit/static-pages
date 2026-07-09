window.CRMLoginPage = {
  render() {
    if (CRMAuth.isAuthenticated()) {
      window.location.href = CRMAuth.redirectAfterLogin();
      return;
    }
    document.getElementById("app").innerHTML = `
      <main class="login-shell login-ai-shell soho-login-shell">
        <section class="login-hero soho-login-hero" aria-label="AI CRM 品牌主视觉">
          <div class="soho-login-logo">
            <img src="../assets/img/soho-eb2b-logo.jpg" alt="苏豪通 SOHO EB2B">
          </div>
          <div class="soho-globe-wrap" aria-hidden="true">
            <div class="soho-globe">
              <span class="globe-orbit orbit-a"></span>
              <span class="globe-orbit orbit-b"></span>
              <span class="globe-orbit orbit-c"></span>
              <span class="globe-land land-a"></span>
              <span class="globe-land land-b"></span>
              <span class="globe-land land-c"></span>
              <span class="globe-band"></span>
              <span class="globe-label">AI CRM</span>
            </div>
            <div class="soho-data-chip chip-a"><strong>Lead</strong><span>识别</span></div>
            <div class="soho-data-chip chip-b"><strong>Customer</strong><span>经营</span></div>
            <div class="soho-data-chip chip-c"><strong>Insight</strong><span>分析</span></div>
          </div>
          <div class="soho-hero-copy">
            <h1>智能连接客户 · 驱动业务增长</h1>
            <p>AI CRM 企业级客户管理平台</p>
          </div>
        </section>
        <section class="login-main soho-login-main">
          <section class="login-panel soho-login-panel">
            <div class="login-title soho-login-title">
              <span>AI CRM</span>
              <h2>登录系统</h2>
            </div>
            <div class="login-method-tabs">
              <button class="active" type="button" data-login-method="password">账号密码登录</button>
              <button type="button" data-login-method="dingtalk">钉钉扫码登录</button>
            </div>
            <form id="loginForm" class="login-form">
              <div class="form-field full"><label>登录账号</label><input name="account" autocomplete="username" placeholder="请输入登录账号"></div>
              <div class="form-field full login-password"><label>登录密码</label><input name="password" type="password" autocomplete="current-password" placeholder="请输入密码"><button class="btn" type="button" id="togglePassword">显示</button></div>
              <div class="login-options">
                <label class="login-check"><input type="checkbox" name="remember"> 记住账号</label>
                <button class="link-btn" type="button" id="forgotPassword">忘记密码</button>
              </div>
              <button class="btn primary login-submit" type="submit">登录</button>
            </form>
            <div class="ding-login-panel" id="dingLoginPanel" hidden>
              <div class="ding-qr-box"><span>钉</span></div>
              <div class="ding-login-copy">
                <strong>钉钉扫码登录</strong>
                <p class="muted">使用钉钉扫描二维码登录系统。</p>
                <button class="btn" type="button" id="refreshDingQr">刷新二维码</button>
              </div>
            </div>
            <p class="muted small soho-login-foot">© 2026 AI CRM. All rights reserved.</p>
          </section>
        </section>
      </main>
      <div class="toast" id="toast"></div>
    `;
    const form = document.getElementById("loginForm");
    const dingPanel = document.getElementById("dingLoginPanel");
    const password = form.querySelector("input[name='password']");
    document.querySelectorAll("[data-login-method]").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll("[data-login-method]").forEach(item => item.classList.remove("active"));
        tab.classList.add("active");
        const isDing = tab.dataset.loginMethod === "dingtalk";
        form.hidden = isDing;
        dingPanel.hidden = !isDing;
      });
    });
    document.getElementById("togglePassword").addEventListener("click", e => {
      const showing = password.type === "text";
      password.type = showing ? "password" : "text";
      e.currentTarget.textContent = showing ? "显示" : "隐藏";
    });
    document.getElementById("forgotPassword").addEventListener("click", () => CRMUI.toast("请联系系统管理员重置密码"));
    document.getElementById("refreshDingQr").addEventListener("click", () => CRMUI.toast("钉钉二维码已刷新"));
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = new FormData(form);
      const submit = form.querySelector("button[type='submit']");
      submit.disabled = true;
      submit.textContent = "登录中";
      try {
        await CRMAuth.login({ account: data.get("account") || "", password: data.get("password") || "", remember: data.get("remember") === "on" });
        CRMUI.toast("登录成功");
        setTimeout(() => window.location.href = CRMAuth.redirectAfterLogin(), 260);
      } catch (error) {
        CRMUI.toast(error.message || "登录失败，请稍后重试");
      } finally {
        submit.disabled = false;
        submit.textContent = "登录";
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => CRMLoginPage.render());
