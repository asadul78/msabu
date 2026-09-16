import {
  auth, db, doc, getDocs, getDoc, setDoc, deleteDoc, writeBatch, collection,
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  CERT_COLLECTION, buildValidationUrl
} from "./firebase-init.js";

/* ---------------------------------------------------------
   Small DOM helpers
--------------------------------------------------------- */
const $ = (id) => document.getElementById(id);
function show(node){ node.classList.remove("hidden"); }
function hide(node){ node.classList.add("hidden"); }
function setStatus(node, text, ok){
  node.textContent = text;
  node.className = `status-msg ${ok ? "ok" : "err"}`;
  show(node);
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function qrDataUrl(text){
  return await window.QRCode.toDataURL(text, {
    width: 320,
    margin: 1,
    color: { dark: "#16213A", light: "#FFFFFF" }
  });
}

/* ---------------------------------------------------------
   Auth
--------------------------------------------------------- */
const loginWrap = $("login-wrap");
const dash = $("dash");
const logoutBtn = $("logout-btn");

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("login-email").value.trim();
  const password = $("login-password").value;
  const err = $("login-error");
  hide(err);
  try{
    await signInWithEmailAndPassword(auth, email, password);
  }catch(ex){
    err.textContent = "Sign-in failed — check the email and password.";
    show(err);
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user){
    hide(loginWrap); show(dash); show(logoutBtn);
    loadRecords();
  }else{
    show(loginWrap); hide(dash); hide(logoutBtn);
  }
});

/* ---------------------------------------------------------
   Tabs
--------------------------------------------------------- */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    $(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

/* ---------------------------------------------------------
   QR modal
--------------------------------------------------------- */
const qrModal = $("qr-modal");
$("qr-modal-close").addEventListener("click", () => hide(qrModal));

async function openQrModal(serialNumber, title){
  const url = buildValidationUrl(serialNumber);
  const dataUrl = await qrDataUrl(url);
  $("qr-modal-title").textContent = title || "Certificate QR code";
  $("qr-modal-img").src = dataUrl;
  $("qr-modal-url").textContent = url;
  const dl = $("qr-modal-download");
  dl.href = dataUrl;
  dl.setAttribute("download", `${serialNumber}.png`);
  show(qrModal);
}

/* ---------------------------------------------------------
   Add single certificate
--------------------------------------------------------- */
$("add-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = $("add-status");
  const serialNumber = $("f-serial").value.trim();

  if (!serialNumber){
    setStatus(status, "Serial number is required.", false);
    return;
  }

  const record = {
    eventName: $("f-event").value.trim(),
    participantName: $("f-participant").value.trim(),
    session: $("f-session").value.trim(),
    serialNumber,
    studentId: $("f-studentid").value.trim(),
    authenticity: document.querySelector('input[name="auth"]:checked').value,
    createdAt: new Date().toISOString()
  };

  try{
    await setDoc(doc(db, CERT_COLLECTION, serialNumber), record, { merge: true });
    setStatus(status, "Saved. Generating QR code…", true);
    await openQrModal(serialNumber, record.participantName || serialNumber);
    e.target.reset();
    document.querySelector('input[name="auth"][value="Valid"]').checked = true;
    setStatus(status, "Certificate saved.", true);
    loadRecords();
  }catch(ex){
    console.error(ex);
    setStatus(status, "Could not save this record. Check your Firestore rules and connection.", false);
  }
});

/* ---------------------------------------------------------
   CSV template download
--------------------------------------------------------- */
$("template-link").addEventListener("click", (e) => {
  e.preventDefault();
  const csv = "Event Name,Participant Name,Session,Serial Number,Student ID,Authenticity\n" +
    "Data Analytics Workshop 2026,Rafiul Islam,Batch 3 / Morning,MSA-2025-2XVPZ,BU-MGT-2201,Valid\n";
  downloadBlob(new Blob([csv], { type: "text/csv" }), "certificate-template.csv");
});

/* ---------------------------------------------------------
   CSV bulk upload
--------------------------------------------------------- */
const HEADER_MAP = {
  "eventname": "eventName",
  "participantname": "participantName",
  "session": "session",
  "serialnumber": "serialNumber",
  "studentid": "studentId",
  "authenticity": "authenticity"
};

function normalizeHeader(h){
  return String(h || "").trim().toLowerCase().replace(/[^a-z]/g, "");
}

let parsedRows = [];

$("csv-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const result = window.Papa.parse(reader.result, { header: true, skipEmptyLines: true });
    const rows = result.data.map((raw) => {
      const row = {};
      Object.keys(raw).forEach((key) => {
        const mapped = HEADER_MAP[normalizeHeader(key)];
        if (mapped) row[mapped] = String(raw[key] || "").trim();
      });
      return row;
    }).filter((r) => r.serialNumber);

    parsedRows = rows;
    renderCsvPreview(rows);
  };
  reader.readAsText(file);
});

function renderCsvPreview(rows){
  const wrap = $("csv-preview-wrap");
  const table = $("csv-preview-table");
  const countEl = $("csv-count");

  if (!rows.length){
    countEl.textContent = "No valid rows found — check that your CSV has the expected column headers.";
    table.innerHTML = "";
    show(wrap);
    return;
  }

  countEl.textContent = `${rows.length} row(s) ready to upload. Showing the first 8 below.`;
  const cols = ["eventName", "participantName", "session", "serialNumber", "studentId", "authenticity"];
  const labels = ["Event", "Participant", "Session", "Serial", "Student ID", "Authenticity"];

  let html = "<thead><tr>" + labels.map((l) => `<th>${l}</th>`).join("") + "</tr></thead><tbody>";
  rows.slice(0, 8).forEach((r) => {
    html += "<tr>" + cols.map((c) => `<td>${r[c] || ""}</td>`).join("") + "</tr>";
  });
  html += "</tbody>";
  table.innerHTML = html;
  show(wrap);
}

$("csv-upload-btn").addEventListener("click", async () => {
  const status = $("csv-status");
  if (!parsedRows.length){
    setStatus(status, "Nothing to upload yet.", false);
    return;
  }

  const CHUNK = 400; // stay under Firestore's 500-write batch limit
  let done = 0;

  try{
    for (let i = 0; i < parsedRows.length; i += CHUNK){
      const chunk = parsedRows.slice(i, i + CHUNK);
      const batch = writeBatch(db);
      chunk.forEach((row) => {
        const ref = doc(db, CERT_COLLECTION, row.serialNumber);
        batch.set(ref, { ...row, authenticity: row.authenticity || "Valid", createdAt: new Date().toISOString() }, { merge: true });
      });
      await batch.commit();
      done += chunk.length;
      setStatus(status, `Uploaded ${done} of ${parsedRows.length}…`, true);
    }
    setStatus(status, `Done — ${done} record(s) uploaded.`, true);
    parsedRows = [];
    $("csv-input").value = "";
    loadRecords();
  }catch(ex){
    console.error(ex);
    setStatus(status, "Upload stopped early — check your connection and Firestore rules, then retry.", false);
  }
});

/* ---------------------------------------------------------
   Manage records
--------------------------------------------------------- */
let allRecords = [];

async function loadRecords(){
  const status = $("manage-status");
  setStatus(status, "Loading records…", true);
  try{
    const snap = await getDocs(collection(db, CERT_COLLECTION));
    allRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderManageTable(allRecords);
    hide(status);
  }catch(ex){
    console.error(ex);
    setStatus(status, "Could not load records.", false);
  }
}

function renderManageTable(records){
  const tbody = $("manage-tbody");
  tbody.innerHTML = "";

  records.forEach((r) => {
    const tr = document.createElement("tr");
    const isValid = String(r.authenticity || "").toLowerCase() === "valid";
    tr.innerHTML = `
      <td class="mono">${r.serialNumber || r.id}</td>
      <td>${r.participantName || ""}</td>
      <td>${r.eventName || ""}</td>
      <td>${r.session || ""}</td>
      <td><span class="badge ${isValid ? "badge-valid" : "badge-invalid"}">${isValid ? "Valid" : "Invalid"}</span></td>
      <td><button class="btn btn-outline qr-btn" style="padding:6px 12px;">QR</button></td>
      <td><button class="btn btn-danger del-btn" style="padding:6px 12px;">Delete</button></td>
    `;
    tr.querySelector(".qr-btn").addEventListener("click", () => openQrModal(r.serialNumber || r.id, r.participantName));
    tr.querySelector(".del-btn").addEventListener("click", () => deleteRecord(r.id));
    tbody.appendChild(tr);
  });
}

async function deleteRecord(id){
  if (!confirm(`Delete certificate "${id}"? This cannot be undone.`)) return;
  try{
    await deleteDoc(doc(db, CERT_COLLECTION, id));
    allRecords = allRecords.filter((r) => r.id !== id);
    renderManageTable(allRecords);
  }catch(ex){
    console.error(ex);
    alert("Could not delete this record.");
  }
}

$("refresh-btn").addEventListener("click", loadRecords);

$("manage-search").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q){ renderManageTable(allRecords); return; }
  const filtered = allRecords.filter((r) =>
    [r.serialNumber, r.participantName, r.eventName, r.studentId, r.session]
      .some((v) => String(v || "").toLowerCase().includes(q))
  );
  renderManageTable(filtered);
});

$("zip-all-btn").addEventListener("click", async () => {
  const status = $("manage-status");
  if (!allRecords.length){
    setStatus(status, "No records to export yet.", false);
    return;
  }
  setStatus(status, "Building ZIP of QR codes…", true);
  try{
    const zip = new window.JSZip();
    for (const r of allRecords){
      const serial = r.serialNumber || r.id;
      const dataUrl = await qrDataUrl(buildValidationUrl(serial));
      const base64 = dataUrl.split(",")[1];
      zip.file(`${serial}.png`, base64, { base64: true });
    }
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "certificate-qr-codes.zip");
    setStatus(status, "ZIP downloaded.", true);
  }catch(ex){
    console.error(ex);
    setStatus(status, "Could not build the ZIP file.", false);
  }
});
