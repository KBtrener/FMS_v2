function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet() {
  try {
    FmsDriveGuard.assertOwner();
    return HtmlService.createTemplateFromFile("Index").evaluate()
      .setTitle(FMS_SETTINGS.applicationName)
      .addMetaTag("viewport", "width=device-width, initial-scale=1, viewport-fit=cover")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  } catch (error) {
    return HtmlService.createHtmlOutput("<main style='font-family:sans-serif;padding:40px'><h1>Brak dostępu</h1><p>" +
      String(error.message).replace(/[&<>]/g, "") + "</p></main>").setTitle("Brak dostępu");
  }
}

function initializeApplication() { return FmsServices.initializeApplication(); }
function getInitialConfiguration() { return FmsServices.getInitialConfiguration(); }
function searchClients(query, includeArchived) { return FmsServices.searchClients(query, includeArchived); }
function createClient(input) { return FmsServices.createClient(input); }
function updateClient(clientId, input) { return FmsServices.updateClient(clientId, input); }
function archiveClient(clientId) { return FmsServices.archiveClient(clientId); }
function restoreClient(clientId) { return FmsServices.restoreClient(clientId); }
function startAssessment(clientId) { return FmsServices.startAssessment(clientId); }
function saveAssessment(input) { return FmsServices.saveAssessment(input); }
function getClientProfile(clientId, includeArchived) { return FmsServices.getClientProfile(clientId, includeArchived); }
function updateAssessment(assessmentId, input) { return FmsServices.updateAssessment(assessmentId, input); }
function archiveAssessment(assessmentId) { return FmsServices.archiveAssessment(assessmentId); }
function restoreAssessment(assessmentId) { return FmsServices.restoreAssessment(assessmentId); }
function getAdminConfiguration() { return FmsServices.getAdminConfiguration(); }
function setEffectRuleActive(effectRuleId, active) { return FmsServices.setEffectRuleActive(effectRuleId, active); }
function generateReportData(clientId) { return FmsReport.generateReportData(clientId); }
function downloadReportPdf(clientId) { return FmsReport.downloadReportPdf(clientId); }
function createEmailDraft(input) { return FmsReport.createEmailDraft(input); }
