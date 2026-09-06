var FmsReport = (function () {
  "use strict";

  var NUMERIC_TESTS = [
    ["toe_touch", "Toe Touch"],
    ["shoulder_mobility", "Shoulder Mobility"],
    ["rotation", "Rotation"],
    ["balance", "Balance"],
    ["squat", "Squat"],
  ];

  function generateReportData(clientId) {
    var profile = FmsServices.getClientProfile(clientId, false);
    if (!profile.assessments.length) throw new Error("Klient nie ma badań do raportu.");
    var assessments = profile.assessments.slice().sort(function (a, b) {
      return a.assessmentDate.localeCompare(b.assessmentDate);
    });
    var changes = [];
    for (var i = 1; i < assessments.length; i += 1) {
      NUMERIC_TESTS.forEach(function (test) {
        var before = assessments[i - 1].finalScores[test[0]];
        var after = assessments[i].finalScores[test[0]];
        if (before !== after) changes.push({
          fromDate: assessments[i - 1].assessmentDate,
          toDate: assessments[i].assessmentDate,
          label: test[1], from: before, to: after,
        });
      });
    }
    var index = FmsCore.indexSeed(FMS_SEED);
    var statusTestCodes = ["cervical_flexion", "cervical_rotation_extension", "shoulder_clearing", "spine_extension_clearing"];
    var statusTests = statusTestCodes.map(function (testCode) {
      var test = FMS_SEED.tests.filter(function (item) { return item.code === testCode; })[0];
      var screenTest = FMS_SEED.screenTests.filter(function (item) { return item.testId === test.testId; })[0];
      var fields = FMS_SEED.testFields.filter(function (field) { return field.screenTestId === screenTest.screenTestId; });
      return {
        code: testCode, name: test.name,
        values: assessments.map(function (assessment) {
          return assessment.statuses.filter(function (status) {
            return fields.some(function (field) { return field.testFieldId === status.testFieldId; });
          }).map(function (status) {
            var field = index.fieldsById[status.testFieldId];
            var option = index.optionsById[status.answerOptionId];
            var side = status.side === "left" ? "L" : status.side === "right" ? "P" : "";
            return (side ? side + ": " : "") + field.labelPl + " - " + option.labelPl;
          }).join("; ");
        }),
      };
    });
    return {
      generatedAt: FmsRepository.nowIso(),
      client: profile.client,
      latest: assessments[assessments.length - 1],
      assessments: assessments,
      history: profile.history,
      changes: changes,
      numericTests: NUMERIC_TESTS.map(function (test) { return { code: test[0], name: test[1] }; }),
      statusTests: statusTests,
    };
  }

  function escapeHtml_(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function reportHtml_(data) {
    var matrixHead = data.assessments.map(function (a) { return "<th>" + escapeHtml_(a.assessmentDate) + "</th>"; }).join("");
    var numericRows = data.numericTests.map(function (test) {
      return "<tr><th>" + escapeHtml_(test.name) + "</th>" + data.assessments.map(function (a) {
        var raw = a.rawScores[test.code] || {};
        var rawText = Object.keys(raw).length > 1 ? "L " + raw.left + " / P " + raw.right + " → " : "";
        return "<td>" + rawText + "<b>" + a.finalScores[test.code] + "</b></td>";
      }).join("") + "</tr>";
    }).join("");
    var statusRows = data.statusTests.map(function (test) {
      return "<tr><th>" + escapeHtml_(test.name) + "</th>" + test.values.map(function (value) {
        return "<td>" + escapeHtml_(value) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    var matrixRows = numericRows + statusRows;
    var effectRows = data.latest.appliedEffects.length ? data.latest.appliedEffects.map(function (effect) {
      return "<li>" + escapeHtml_(effect.reasonPl) + ": " + effect.beforeScore + " → " + effect.afterScore + "</li>";
    }).join("") : "<li>Brak nadpisania wyniku przez clearing test.</li>";
    var changes = data.changes.length ? data.changes.map(function (change) {
      return "<li>" + escapeHtml_(change.toDate) + " · " + escapeHtml_(change.label) + ": " + change.from + " → " + change.to + "</li>";
    }).join("") : "<li>Brak danych historycznych.</li>";
    return "<!doctype html><html><head><meta charset='utf-8'><style>" +
      "@page{size:A4;margin:18mm}body{font-family:Arial,sans-serif;color:#142b35;font-size:10pt}" +
      "h1{font-size:25pt;margin:0 0 4mm}h2{font-size:14pt;margin:9mm 0 3mm}.meta{color:#52656c}" +
      ".score{font-size:34pt;font-weight:700;color:#ef5b49;margin:5mm 0}.grid{display:flex;gap:4mm;flex-wrap:wrap}" +
      ".card{border:1px solid #ccd7d9;border-radius:4mm;padding:4mm;min-width:27mm}.card b{font-size:16pt;display:block}" +
      "table{border-collapse:collapse;width:100%;page-break-inside:auto}th,td{border:1px solid #ccd7d9;padding:2.5mm;text-align:left}" +
      "thead{background:#142b35;color:white}tr{page-break-inside:avoid}.note{background:#f4f0e6;padding:4mm;border-radius:3mm}" +
      "footer{margin-top:10mm;color:#6b7c82;font-size:8pt}</style></head><body>" +
      "<h1>FMS Quick Screen</h1><div class='meta'>Raport wyników · " + escapeHtml_(data.client.firstName + " " + data.client.lastName) +
      " · badanie " + escapeHtml_(data.latest.assessmentDate) + "</div>" +
      "<div class='score'>" + data.latest.totalScreenScore + " / 15</div><div class='meta'>Total Screen Score</div>" +
      "<h2>Bieżące wyniki</h2><div class='grid'>" + data.numericTests.map(function (test) {
        return "<div class='card'>" + escapeHtml_(test.name) + "<b>" + data.latest.finalScores[test.code] + "</b></div>";
      }).join("") + "</div><h2>Clearing tests</h2><ul>" + effectRows + "</ul>" +
      "<h2>Historia</h2><div class='note'><ul>" + changes + "</ul></div>" +
      "<h2>Macierz wyników</h2><table><thead><tr><th>Test</th>" + matrixHead + "</tr></thead><tbody>" + matrixRows + "</tbody></table>" +
      "<footer>Raport opisuje zapisane wyniki screeningu. Nie stanowi diagnozy ani zalecenia terapeutycznego. Wygenerowano " +
      escapeHtml_(data.generatedAt.slice(0, 10)) + ".</footer></body></html>";
  }

  function downloadReportPdf(clientId) {
    var data = generateReportData(clientId);
    var filename = "FMS_Quick_Screen_" + data.client.lastName.replace(/[^a-zA-Z0-9_-]/g, "_") + "_" + data.latest.assessmentDate + ".pdf";
    var blob = Utilities.newBlob(reportHtml_(data), "text/html", "report.html")
      .getAs(MimeType.PDF).setName(filename);
    return { filename: filename, base64: Utilities.base64Encode(blob.getBytes()) };
  }

  function createEmailDraft(input) {
    input = input || {};
    var recipients = String(input.recipients || "").split(/[,;]/).map(function (value) { return value.trim(); }).filter(Boolean);
    if (!recipients.length) throw new Error("Podaj co najmniej jednego odbiorcę szkicu.");
    recipients.forEach(function (email) { FmsCore.normalizeEmail(email); });
    var data = generateReportData(input.clientId);
    var pdf = downloadReportPdf(input.clientId);
    var attachment = Utilities.newBlob(Utilities.base64Decode(pdf.base64), MimeType.PDF, pdf.filename);
    var subject = "FMS Quick Screen - " + data.client.firstName + " " + data.client.lastName + " - " + data.latest.assessmentDate;
    var body = "Dzień dobry,\n\nw załączniku znajduje się raport FMS Quick Screen.\n\nRaport opisuje zapisane wyniki i nie stanowi diagnozy ani zalecenia terapeutycznego.\n";
    var draft = GmailApp.createDraft(recipients.join(","), subject, body, { attachments: [attachment] });
    return { draftId: draft.getId(), subject: subject, recipients: recipients };
  }

  return {
    generateReportData: generateReportData,
    downloadReportPdf: downloadReportPdf,
    createEmailDraft: createEmailDraft,
  };
})();

if (typeof module === "object" && module.exports) module.exports = FmsReport;
