window.CRMLoginPage = {
  render() {
    if (CRMAuth.isAuthenticated()) {
      window.location.href = CRMAuth.redirectAfterLogin();
      return;
    }
    document.getElementById("app").innerHTML = `
      <main class="login-shell login-ai-shell">
        <section class="login-main">
          <div class="login-brand">
            <div class="brand-mark">AI</div>
            <div>
              <h1>智能 CRM</h1>
              <p>统一管理线索、客户、沟通与 AI 能力，让业务团队更快响应每一次机会。</p>
            </div>
          </div>
          <section class="login-panel">
            <div class="login-title">
              <h2>登录系统</h2>
              <p class="muted">请选择登录方式进入后台</p>
            </div>
            <div class="login-method-tabs">
              <button class="active" type="button" data-login-method="password">账号密码登录</button>
              <button type="button" data-login-method="dingtalk">钉钉扫码登录</button>
            </div>
            <form id="loginForm" class="login-form">
              <div class="form-field full"><label>用户名 / 邮箱</label><input name="account" autocomplete="username" placeholder="admin / chenhao / mialiu / alexxu"></div>
              <div class="form-field full login-password"><label>密码</label><input name="password" type="password" autocomplete="current-password" placeholder="请输入密码"><button class="btn" type="button" id="togglePassword">显示</button></div>
              <div class="login-options">
                <label class="login-check"><input type="checkbox" name="remember"> 记住登录</label>
                <button class="link-btn" type="button" id="forgotPassword">忘记密码</button>
              </div>
              <button class="btn primary login-submit" type="submit">登录</button>
              <p class="muted small" style="margin-top:8px">演示账号统一密码 <code>123456</code>：admin（运营专员）/ chenhao（业务员）/ mialiu（业务员）/ alexxu（协同人）</p>
            </form>
            <div class="ding-login-panel" id="dingLoginPanel" hidden>
              <div class="ding-qr-box"><span>钉</span></div>
              <div class="ding-login-copy">
                <strong>钉钉扫码登录</strong>
                <p class="muted">使用钉钉扫描二维码完成授权登录，后续可接入 DingTalk OAuth / 扫码登录接口。</p>
                <button class="btn" type="button" id="refreshDingQr">刷新二维码</button>
              </div>
            </div>
          </section>
        </section>
        <section class="login-hero" aria-label="AI CRM 智能主视觉">
          <div class="hero-copy">
            <span class="hero-kicker">AI CRM Platform</span>
            <h2>AI 驱动企业客户增长</h2>
            <p>智能连接客户触达、线索识别、销售跟进与经营分析。</p>
          </div>
          <div class="hero-network" aria-hidden="true">
            <span class="hero-line line-a"></span>
            <span class="hero-line line-b"></span>
            <span class="hero-line line-c"></span>
            <span class="hero-node node-a"></span>
            <span class="hero-node node-b"></span>
            <span class="hero-node node-c"></span>
            <span class="hero-node node-d"></span>
            <div class="hero-core">
              <span>AI</span>
              <strong>Customer Intelligence</strong>
            </div>
            <div class="hero-card hero-card-a">
              <small>Lead Score</small>
              <strong>92</strong>
              <span>High intent</span>
            </div>
            <div class="hero-card hero-card-b">
              <small>Next Action</small>
              <strong>Follow up</strong>
              <span>Email · WhatsApp</span>
            </div>
            <div class="hero-card hero-card-c">
              <small>Risk Level</small>
              <strong>Low</strong>
              <span>Company verified</span>
            </div>
          </div>
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
