document.addEventListener("DOMContentLoaded", () => {
  if (!CRMAuth.requireAuth()) return;
  const page = document.body.dataset.page || "workbench";
  const pageMap = {
    workbench: CRMWorkbenchPage,
    analytics: CRMAnalyticsPage,
    email: window.CRMCommunicationPage,
    whatsapp: window.CRMCommunicationPage,
    leads: window.CRMCrmPage,
    customers: window.CRMCrmPage,
    ai: window.CRMAdminPage
  };
  const initialRoute = CRMRouter.routeFromLocation(page);
  CRMLayout.mount(initialRoute.key);
  CRMWorkspace.init(initialRoute, pageMap);
});
