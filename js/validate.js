import { db, doc, getDoc, CERT_COLLECTION } from "./firebase-init.js";

// Works whether the visitor arrived at /verify/SERIAL (via the
// GitHub Pages 404 fallback trick) or at validate.html?id=SERIAL.
function getIdFromLocation(){
  const params = new URLSearchParams(window.location.search);
  if (params.get("id")) return params.get("id").trim();

  const segments = window.location.pathname.split("/").filter(Boolean);
  const last = segments.pop();
  if (!last || last.toLowerCase() === "verify" || last.toLowerCase().endsWith(".html")){
    return null;
  }
  return decodeURIComponent(last);
}

function el(tag, className, text){
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderRow(container, label, value, mono){
  const row = el("div", "ledger-row");
  row.appendChild(el("span", "k", label));
  row.appendChild(el("span", `v${mono ? " mono" : ""}`, value));
  container.appendChild(row);
}

async function renderResult(){
  const root = document.getElementById("result-root");
  if (!root) return;

  const id = getIdFromLocation();

  if (!id){
    root.innerHTML = "";
    root.appendChild(el("p", "state-msg", "No certificate ID was provided in the link."));
    return;
  }

  root.innerHTML = "";
  root.appendChild(el("p", "state-msg", "Looking up certificate…"));

  try{
    const snap = await getDoc(doc(db, CERT_COLLECTION, id));
    root.innerHTML = "";

    if (!snap.exists()){
      const wrap = el("div", "ledger panel");
      const head = el("div", "ledger-head");
      head.appendChild(el("h2", null, "Not found"));
      head.appendChild((() => { const b = el("span", "badge badge-invalid", "Not valid"); return b; })());
      wrap.appendChild(head);
      wrap.appendChild(el("p", null, `No certificate matches the ID “${id}”. Check the link and try again, or contact the issuing course.`));
      root.appendChild(wrap);
      return;
    }

    const data = snap.data();
    const isValid = String(data.authenticity || "").toLowerCase() === "valid";

    const wrap = el("div", "ledger panel");
    const head = el("div", "ledger-head");
    head.appendChild(el("h2", null, data.eventName || "Certificate record"));
    head.appendChild(el("span", `badge ${isValid ? "badge-valid" : "badge-invalid"}`, isValid ? "Authentic" : "Not valid"));
    wrap.appendChild(head);

    renderRow(wrap, "Participant", data.participantName || "—");
    renderRow(wrap, "Session", data.session || "—");
    renderRow(wrap, "Serial number", data.serialNumber || id, true);
    renderRow(wrap, "Student ID", data.studentId || "—", true);
    renderRow(wrap, "Authenticity", isValid ? "Valid" : "Invalid");

    root.appendChild(wrap);
  }catch(err){
    console.error(err);
    root.innerHTML = "";
    root.appendChild(el("p", "state-msg", "Something went wrong while checking this certificate. Please try again shortly."));
  }
}

renderResult();
