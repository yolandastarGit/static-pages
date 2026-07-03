window.CRMAuth = {
  storageKey: "suhao_crm_auth",
  loginPage: "login.html",
  homePage: "workbench.html",
  readSession() {
    const raw = localStorage.getItem(this.storageKey) || sessionStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      if (!session.expiresAt || session.expiresAt < Date.now()) {
        this.clearSession();
        return null;
      }
      return session;
    } catch (error) {
      this.clearSession();
      return null;
    }
  },
  isAuthenticated() {
    return Boolean(this.readSession());
  },
  clearSession() {
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);
  },
  currentReturnPath() {
    return `${window.location.pathname.split("/").pop()}${window.location.search}${window.location.hash}`;
  },
  requireAuth() {
    if (this.isAuthenticated()) return true;
    const redirect = encodeURIComponent(this.currentReturnPath());
    window.location.href = `${this.loginPage}?redirect=${redirect}`;
    return false;
  },
  async login({ account, password, remember }) {
    const username = account.trim().toLowerCase();
    if (!username) throw new Error("请输入用户名或邮箱");
    if (!password) throw new Error("请输入密码");
    if (username === "network") throw new Error("网络异常，请检查网络连接");
    if (username === "timeout") {
      await new Promise((_, reject) => setTimeout(() => reject(new Error("登录超时，请稍后重试")), 900));
    }
    if (username === "error") throw new Error("登录接口异常，请稍后重试");
    await new Promise(resolve => setTimeout(resolve, 240));
    const authUser = (CRM_MOCK.authUsers || []).find(user => (user.username.toLowerCase() === username || user.email.toLowerCase() === username) && user.password === password);
    if (!authUser) throw new Error("用户名或密码错误");
    const user = CRM_MOCK.users.find(item => item.id === authUser.userId) || CRM_MOCK.currentUser;
    const session = {
      token: `mock-token-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      expiresAt: Date.now() + (remember ? 7 : 1) * 24 * 60 * 60 * 1000
    };
    this.clearSession();
    (remember ? localStorage : sessionStorage).setItem(this.storageKey, JSON.stringify(session));
    return session;
  },
  logout() {
    this.clearSession();
    const redirect = encodeURIComponent(this.currentReturnPath());
    window.location.href = `${this.loginPage}?redirect=${redirect}`;
  },
  redirectAfterLogin() {
    const query = new URLSearchParams(window.location.search);
    const redirect = query.get("redirect");
    if (!redirect || redirect.includes(this.loginPage)) return this.homePage;
    return redirect;
  }
};
