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
    if (user.status === "禁用") throw new Error("当前账号已禁用，请联系系统管理员");
    const session = {
      token: `mock-token-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      expiresAt: Date.now() + (remember ? 7 : 1) * 24 * 60 * 60 * 1000
    };
    this.clearSession();
    (remember ? localStorage : sessionStorage).setItem(this.storageKey, JSON.stringify(session));
    this.syncCurrentUser();
    return session;
  },
  // 根据会话 userId 同步 CRM_MOCK.currentUser，使各页面读取到的是当前登录用户而非 mock 默认值
  syncCurrentUser() {
    const session = this.readSession();
    if (!session || !window.CRM_MOCK) return;
    const user = (CRM_MOCK.users || []).find(item => item.id === session.userId);
    if (!user) return;
    const roleCodeMap = { "运营专员": "supervisor", "业务员": "sales", "协同人": "regional", "系统管理员": "admin" };
    const avatar = (user.name || user.account || "?").trim().slice(0, 2).toUpperCase();
    CRM_MOCK.currentUser = {
      id: user.id,
      name: user.name,
      role: user.role,
      roleCode: roleCodeMap[user.role] || user.role,
      avatar,
      sites: user.siteIds || []
    };
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
