window.CRMLoginPage = {
  render() {
    if (CRMAuth.isAuthenticated()) {
      window.location.href = CRMAuth.redirectAfterLogin();
      return;
    }
    document.getElementById("app").innerHTML = `
      <main class="login-shell">
        <section class="login-brand">
          <div class="brand-mark">AI</div>
          <div>
            <h1>智能 CRM</h1>
            <p>统一管理线索、客户、沟通与 AI 能力，让业务团队更快响应每一次机会。</p>
          </div>
        </section>
        <section class="login-panel">
          <div class="login-title">
            <h2>登录系统</h2>
            <p class="muted">请输入账号信息进入后台</p>
          </div>
          <form id="loginForm" class="login-form">
            <div class="form-field full"><label>用户名 / 邮箱</label><input name="account" autocomplete="username" placeholder="admin 或 demo@example.com"></div>
            <div class="form-field full login-password"><label>密码</label><input name="password" type="password" autocomplete="current-password" placeholder="请输入密码"><button class="btn" type="button" id="togglePassword">显示</button></div>
            <div class="login-options">
              <label class="login-check"><input type="checkbox" name="remember"> 记住登录</label>
              <button class="link-btn" type="button" id="forgotPassword">忘记密码</button>
            </div>
            <button class="btn primary login-submit" type="submit">登录</button>
          </form>
        </section>
      </main>
      <div class="toast" id="toast"></div>
    `;
    const form = document.getElementById("loginForm");
    const password = form.querySelector("input[name='password']");
    document.getElementById("togglePassword").addEventListener("click", e => {
      const showing = password.type === "text";
      password.type = showing ? "password" : "text";
      e.currentTarget.textContent = showing ? "显示" : "隐藏";
    });
    document.getElementById("forgotPassword").addEventListener("click", () => CRMUI.toast("请联系系统管理员重置密码"));
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
