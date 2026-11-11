/**
 * Deol Weekly Shop — backend for the family voting app.
 * Bound to the "Deol Weekly Shop" Google Sheet. Stores everyone's picks and Pam's approval.
 *
 * Setup (once):
 *  1. Extensions → Apps Script in the sheet, paste this file in as Code.gs.
 *  2. Project Settings → Script properties → add PAM_PIN = Pam's chosen PIN.
 *  3. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
 *  4. Copy the /exec URL into config.js in the GitHub repo.
 */

const VOTES = 'Votes';
const APPROVALS = 'Approvals';

function sheet_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.setFrozenRows(1);
  }
  return sh;
}

function votesSheet_() { return sheet_(VOTES, ['Timestamp', 'Week', 'Name', 'Picks (JSON)', 'Comment']); }
function approvalsSheet_() { return sheet_(APPROVALS, ['Timestamp', 'Week', 'Decisions (JSON)', 'Note']); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

function validWeek_(w) { return /^\d{4}-\d{2}-\d{2}$/.test(String(w || '')); }

function readWeek_(week) {
  const votes = [];
  const latest = {};
  const vRows = votesSheet_().getDataRange().getValues().slice(1);
  vRows.forEach(r => {
    if (String(r[1]) !== week) return;
    const key = String(r[2]).toLowerCase();
    let picks = {};
    try { picks = JSON.parse(r[3] || '{}'); } catch (e) {}
    latest[key] = { ts: new Date(r[0]).toISOString(), name: String(r[2]), picks: picks, comment: String(r[4] || '') };
  });
  Object.keys(latest).forEach(k => votes.push(latest[k]));

  let approval = null;
  const aRows = approvalsSheet_().getDataRange().getValues().slice(1);
  aRows.forEach(r => {
    if (String(r[1]) !== week) return;
    let d = {};
    try { d = JSON.parse(r[2] || '{}'); } catch (e) {}
    approval = { ts: new Date(r[0]).toISOString(), decisions: d, note: String(r[3] || '') };
  });
  return { votes: votes, approval: approval };
}

function doGet(e) {
  const week = (e && e.parameter && e.parameter.week) || '';
  if (!validWeek_(week)) return json_({ votes: [], approval: null });
  return json_(readWeek_(week));
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let body;
    try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'Bad request' }); }
    const week = String(body.week || '');
    if (!validWeek_(week)) return json_({ ok: false, error: 'Unknown week' });

    if (body.action === 'vote') {
      const name = clean_(body.name, 40);
      if (!name) return json_({ ok: false, error: 'Name needed' });
      const picks = {};
      Object.keys(body.picks || {}).slice(0, 10).forEach(k => {
        const v = String(body.picks[k]);
        if (['A', 'B', 'both', 'none'].indexOf(v) >= 0) picks[clean_(k, 30)] = v;
      });
      votesSheet_().appendRow([new Date(), week, name, JSON.stringify(picks), clean_(body.comment, 500)]);
      return json_({ ok: true });
    }

    if (body.action === 'approve') {
      const pin = PropertiesService.getScriptProperties().getProperty('PAM_PIN');
      if (!pin) return json_({ ok: false, error: 'PIN not set up yet' });
      if (String(body.pin || '') !== String(pin)) {
        Utilities.sleep(1500);
        return json_({ ok: false, error: 'Wrong PIN' });
      }
      const decisions = {};
      Object.keys(body.decisions || {}).slice(0, 10).forEach(k => {
        const v = String(body.decisions[k]);
        if (['A', 'B', 'both', 'none'].indexOf(v) >= 0) decisions[clean_(k, 30)] = v;
      });
      approvalsSheet_().appendRow([new Date(), week, JSON.stringify(decisions), clean_(body.note, 500)]);
      return json_({ ok: true });
    }

    return json_({ ok: false, error: 'Unknown action' });
  } finally {
    lock.releaseLock();
  }
}
