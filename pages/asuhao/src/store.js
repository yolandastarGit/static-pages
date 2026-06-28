import {
  cloneData,
  contracts,
  currentUser,
  customers,
  followLogs,
  leads,
  mails,
  notifications,
  conversations,
  roles,
  sites,
  systemLogs,
  systemParams,
  users
} from "./data.js";

const subscribers = new Set();

export const state = {
  user: cloneData(currentUser),
  auth: {
    loggedIn: true,
    expired: false,
    firstLogin: false
  },
  data: {
    roles: cloneData(roles),
    users: cloneData(users),
    sites: cloneData(sites),
    leads: cloneData(leads),
    customers: cloneData(customers),
    contracts: cloneData(contracts),
    followLogs: cloneData(followLogs),
    mails: cloneData(mails),
    notifications: cloneData(notifications),
    conversations: cloneData(conversations),
    systemLogs: cloneData(systemLogs),
    systemParams: cloneData(systemParams)
  },
  ui: {
    drawer: null,
    modal: null,
    toast: null,
    loading: false,
    sidebarCollapsed: false,
    selectedRows: []
  }
};

export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function notify() {
  subscribers.forEach((callback) => callback(state));
}

export function setUser(userId) {
  const nextUser = state.data.users.find((user) => user.id === userId);
  if (!nextUser) return;
  state.user = cloneData(nextUser);
  toast(`已切换为 ${state.user.name}`);
  notify();
}

export function loginAs(userId = "u-admin") {
  const nextUser = state.data.users.find((user) => user.id === userId) || state.data.users[0];
  state.user = cloneData(nextUser);
  state.auth.loggedIn = true;
  state.auth.expired = false;
  state.auth.firstLogin = false;
  toast(`欢迎回来，${state.user.name}`);
  notify();
}

export function logout(expired = false) {
  state.auth.loggedIn = false;
  state.auth.expired = expired;
  notify();
}

export function openDrawer(drawer) {
  state.ui.drawer = drawer;
  notify();
}

export function closeDrawer() {
  state.ui.drawer = null;
  notify();
}

export function openModal(modal) {
  state.ui.modal = modal;
  notify();
}

export function closeModal() {
  state.ui.modal = null;
  notify();
}

export function clearPageState() {
  state.ui.drawer = null;
  state.ui.modal = null;
  state.ui.selectedRows = [];
  state.ui.loading = false;
}

export function toast(message, type = "success") {
  state.ui.toast = { message, type, id: Date.now() };
  notify();
  window.setTimeout(() => {
    if (state.ui.toast?.message === message) {
      state.ui.toast = null;
      notify();
    }
  }, 2600);
}

export function setSelectedRows(ids) {
  state.ui.selectedRows = ids;
  notify();
}

export function markNotificationRead(notificationId) {
  const notification = state.data.notifications.find((item) => item.id === notificationId);
  if (notification) notification.read = true;
  notify();
}

export function markAllNotificationsRead() {
  state.data.notifications.forEach((notification) => {
    notification.read = true;
  });
  notify();
}

export function removeNotification(notificationId) {
  state.data.notifications = state.data.notifications.filter((notification) => notification.id !== notificationId);
  notify();
}

export function resetSelection() {
  state.ui.selectedRows = [];
}

export function canAccess(pageId) {
  const role = state.user.roleId;
  if (role === "admin") return true;
  const blockedForSales = new Set(["site-management", "user-management", "role-permissions", "system-logs", "system-params", "public-pool"]);
  const blockedForManager = new Set(["site-management", "user-management", "role-permissions", "system-logs", "system-params"]);
  const blockedForRegional = new Set(["user-management", "role-permissions", "system-logs", "system-params"]);
  if (role === "sales") return !blockedForSales.has(pageId);
  if (role === "manager") return !blockedForManager.has(pageId);
  if (role === "regional") return !blockedForRegional.has(pageId);
  return false;
}

export function canOperate(operation) {
  const role = state.user.roleId;
  if (role === "admin") return true;
  const managerOps = new Set([
    "export",
    "assign",
    "recycle",
    "transfer",
    "edit",
    "create-contract",
    "create-customer",
    "status-change",
    "tag",
    "follow"
  ]);
  const salesOps = new Set(["edit", "create-contract", "create-customer", "tag", "follow", "export"]);
  if (role === "manager" || role === "regional") return managerOps.has(operation);
  if (role === "sales") return salesOps.has(operation);
  return false;
}

export function scoped(records, key = "ownerId") {
  const role = state.user.roleId;
  if (role === "admin" || role === "regional") return records;
  if (role === "manager") {
    const teamUserIds = state.data.users.filter((user) => user.team === state.user.team).map((user) => user.id);
    return records.filter((record) => !record[key] || teamUserIds.includes(record[key]));
  }
  return records.filter((record) => !record[key] || record[key] === state.user.id);
}

export function mutate(mutator, message) {
  mutator(state.data);
  resetSelection();
  if (message) toast(message);
  notify();
}
