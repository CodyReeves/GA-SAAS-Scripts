// How To Use
// 1. Start a new Google Sheet
// 2. Enable Google Analytic connection under Add-ons
// 3. Go to tools > script editor and start a new script project
// 4. In the project go to Advanced Google Services and enable Google Analytic API
// 5. Paste the code below in the code.gs
// 6. Update the Google Analytic View ID.
// 7. And Run it! Data should populate in the sheet.
// 8. Connect the sheet to Data Studio.
// 9. Create your DAU/MAU graph & your done!

function pullData() {
  try {
    var googleAnalyticsView = 00000000; // Set your GA View ID here
    var results = getReportDataForProfile(
      googleAnalyticsView,
      "ga:sessions,ga:1dayUsers"
    );
    var secondaryResults = getReportDataForProfile(
      googleAnalyticsView,
      "ga:sessions,ga:28dayUsers"
    );

    outputToSpreadsheet(results, secondaryResults);
  } catch (error) {
    Browser.msgBox(error.message);
  }
}

function getReportDataForProfile(googleAnalyticsView, metricsList) {
  var profileId = googleAnalyticsView;
  var tableId = "ga:" + profileId;
  var startDate = getLastNdays(31);
  var endDate = getLastNdays(1);

  var optArgs = {
    dimensions: "ga:date",
    sort: "-ga:date",
    "start-index": "1",
    "max-results": "250"
  };

  var results = Analytics.Data.Ga.get(
    tableId,
    startDate,
    endDate,
    metricsList,
    optArgs
  );

  if (results.getRows()) {
    return results;
  } else {
    throw new Error("GA view was not found, please check View ID");
  }
}

function getLastNdays(nDaysAgo) {
  var today = new Date();
  var before = new Date();
  before.setDate(today.getDate() - nDaysAgo);
  return Utilities.formatDate(before, "GMT", "yyyy-MM-dd");
}

function outputToSpreadsheet(results, secondaryResults) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var headerNames = [];
  for (var i = 0, header; (header = results.getColumnHeaders()[i]); ++i) {
    headerNames.push(header.getName());
  }
  sheet.getRange(1, 1, 1, headerNames.length).setValues([headerNames]);

  sheet
    .getRange(2, 1, results.getRows().length, headerNames.length)
    .setValues(results.getRows());

  var secondaryHeaderNames = [];
  for (
    var i = 0, header;
    (header = secondaryResults.getColumnHeaders()[i]);
    ++i
  ) {
    secondaryHeaderNames.push(header.getName());
  }
  sheet
    .getRange(1, headerNames.length + 1, 1, secondaryHeaderNames.length)
    .setValues([secondaryHeaderNames]);
  sheet
    .getRange(
      2,
      headerNames.length + 1,
      results.getRows().length,
      secondaryHeaderNames.length
    )
    .setValues(secondaryResults.getRows());

  sheet.deleteColumns(4, 2);
  sheet.getRange(1, 5, 1, 1).setValue("DAU/MAU ratio");
  for (var i = 2; i < secondaryResults.getRows().length + 2; ++i) {
    if (sheet.getRange(i, 4, 1, 1).getValue() !== 0) {
      value =
        sheet.getRange(i, 3, 1, 1).getValue() /
        sheet.getRange(i, 4, 1, 1).getValue();
    } else {
      value = 0;
    }
    sheet.getRange(i, 5, 1, 1).setValue(value);
  }
}
