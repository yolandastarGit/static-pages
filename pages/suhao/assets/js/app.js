document.addEventListener("DOMContentLoaded", () => {
  if (!CRMAuth.requireAuth()) return;
  const page = document.body.dataset.page || "workbench";
  const routeKey = CRMRouter.currentKey(page);
  const root = CRMLayout.mount(routeKey);
  const pageMap = {
    workbench: CRMWorkbenchPage,
    analytics: CRMAnalyticsPage,
    email: window.CRMCommunicationPage,
    whatsapp: window.CRMCommunicationPage,
    leads: window.CRMCrmPage,
    customers: window.CRMCrmPage,
    ai: window.CRMAdminPage
  };
  pageMap[page].render(root, page, routeKey);
});
