
// ==================== CONFIG ======================
const BAND_PASS  = "band2026";
const PROD_PASS  = "prod2026";
const ADMIN_PASS = "expenditure"; // updated admin password

// ⚠️ Replace with your deployed Google Apps Script URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbwOqlCiL6lkesL0vHaU8mTTrUytbBxoTTIdTe-TZ3x2M9pu87FNmSVQQwjvrF85aks/exec";

// ⚠️ Replace these with your real WhatsApp group invite links
const WHATSAPP_LINKS = {
  band:       "https://chat.whatsapp.com/GgfdCO9gXytGIT69W4foB1?mode=gi_t",
  audience:   "https://chat.whatsapp.com/GgfdCO9gXytGIT69W4foB1?mode=gi_t",
  production: "https://chat.whatsapp.com/Lxru3Jver31LqSskrUoiXY?mode=gi_t"
};

// ==================== GLOBAL ======================
let currentSection = "";

// ==================== TAB & MODAL =================
window.openSection = function(section) {
  if (section === "band" || section === "production") {
    currentSection = section;
    document.getElementById("passwordModal").style.display = "flex";
    document.getElementById("passInput").value = "";
    document.getElementById("passError").innerText = "";
    setTimeout(() => document.getElementById("passInput").focus(), 100);
  } else {
    showSection(section);
  }
};

window.verifyPassword = function() {
  const val    = document.getElementById("passInput").value.trim();
  const errorEl = document.getElementById("passError");

  if (currentSection === "band" && val === BAND_PASS) {
    document.getElementById("passwordModal").style.display = "none";
    showSection("band");
  } else if (currentSection === "production" && val === PROD_PASS) {
    document.getElementById("passwordModal").style.display = "none";
    showSection("production");
  } else {
    errorEl.innerText = "⛔ Incorrect code. Try again.";
    document.getElementById("passInput").value = "";
    document.getElementById("passInput").focus();
    return;
  }
  currentSection = "";
};

function showSection(id) {
  document.querySelectorAll(".form").forEach(f => f.classList.add("hidden"));
  const targetForm = document.getElementById(id);
  if (targetForm) targetForm.classList.remove("hidden");

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => {
    if (b.getAttribute("onclick") && b.getAttribute("onclick").includes(`'${id}'`)) {
      b.classList.add("active");
    }
  });
  targetForm && targetForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ==================== ROLE DROPDOWN =================
window.updateRoles = function() {
  const rolesMap = {
    instrumentalist: ["Acoustic Guitar", "Keyboardist", "Aux Keys", "Drummer", "Bass Guitar", "Violin", "Lead Guitar"],
    vocals:          ["Lead Vocals", "Tenor", "Soprano", "Alto"]
  };
  const cat        = document.getElementById("roleCategory").value;
  const roleSelect = document.getElementById("roleOptions");
  roleSelect.innerHTML = "";

  if (!cat) {
    roleSelect.innerHTML = '<option value="">– choose category first –</option>';
    return;
  }

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "– select role –";
  roleSelect.appendChild(defaultOpt);

  rolesMap[cat].forEach(r => {
    const opt = document.createElement("option");
    opt.textContent = r;
    opt.value = r;
    roleSelect.appendChild(opt);
  });
};

// ==================== FORM VALIDATION ===============
function validateForm(form) {
  let valid = true;
  form.querySelectorAll(".validation-error").forEach(e => e.style.display = "none");
  form.querySelectorAll(".input-error").forEach(e => e.classList.remove("input-error"));

  form.querySelectorAll("[required]").forEach(inp => {
    if (!inp.value.trim()) {
      inp.classList.add("input-error");
      const errDiv = form.querySelector(`.validation-error[data-for="${inp.name}"]`);
      if (errDiv) errDiv.style.display = "block";
      valid = false;
    }
  });

  const emailField = form.querySelector('input[type="email"]');
  if (emailField && emailField.value.trim()) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(emailField.value.trim())) {
      emailField.classList.add("input-error");
      const err = form.querySelector('.validation-error[data-for="email"]');
      if (err) { err.style.display = "block"; err.innerText = "Invalid email format"; }
      valid = false;
    }
  }

  const phoneField = form.querySelector('input[type="tel"]');
  if (phoneField && phoneField.value.trim()) {
    if (!phoneField.value.trim().match(/^[\d\s+\-()\[\]]{7,20}$/)) {
      phoneField.classList.add("input-error");
      const err = form.querySelector('.validation-error[data-for="phone"]');
      if (err) { err.style.display = "block"; err.innerText = "Enter a valid phone number"; }
      valid = false;
    }
  }

  const type = form.dataset.type;
  if (type === "band") {
    const cat  = document.getElementById("roleCategory").value;
    const role = document.getElementById("roleOptions").value;
    if (!cat)  { document.getElementById("roleCategory").classList.add("input-error"); valid = false; }
    if (!role) { document.getElementById("roleOptions").classList.add("input-error");  valid = false; }
  }

  return valid;
}

// ==================== SEND TO GOOGLE SHEETS =========
async function postToSheet(data) {
  try {
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data)
    });
    return true;
  } catch (err) {
    console.error("Sheet POST error:", err);
    return false;
  }
}

// ==================== EMAIL CONFIRMATION ============
async function sendEmailConfirmation(email, name, type) {
  try {
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ action: "sendEmail", email, name, type })
    });
  } catch (e) {
    console.warn("Email notification failed (non-critical):", e);
  }
}

// ==================== FORM SUBMIT HANDLER ===========
document.querySelectorAll("form").forEach(form => {
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    if (!validateForm(this)) return;

    const type     = this.dataset.type;
    const formData = new FormData(this);
    const data     = {};
    formData.forEach((value, key) => { data[key] = value; });

    data.formType  = type;
    data.timestamp = new Date().toISOString();

    if (type === "band")       data.accessCode = BAND_PASS;
    if (type === "production") data.accessCode = PROD_PASS;

    if (type === "band") {
      data.roleCategory = document.getElementById("roleCategory").value;
      data.specificRole  = document.getElementById("roleOptions").value;
    }

    const btn          = this.querySelector("button[type='submit']");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';
    btn.disabled  = true;

    await postToSheet(data);

    const name = (data.fullName || "Worshiper").trim();
    await sendEmailConfirmation(data.email, name, type);

    document.getElementById("successName").innerText = `✨ ${name}`;
    document.getElementById("whatsappLink").href = WHATSAPP_LINKS[type] || "#";

    const container = document.querySelector(".container");
    container.style.opacity    = "0";
    container.style.transition = "opacity 0.4s ease";
    setTimeout(() => {
      container.style.display = "none";
      document.getElementById("successPage").classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 400);

    btn.innerHTML = originalText;
    btn.disabled  = false;
  });
});

// ==================== ADMIN DASHBOARD ===============
window.toggleAdmin = function() {
  const panel = document.getElementById("adminPanel");
  panel.classList.toggle("hidden");
  // Reset to login view when reopening
  if (!panel.classList.contains("hidden")) {
    document.getElementById("adminLoginArea").classList.remove("hidden");
    document.getElementById("adminExpenseArea").classList.add("hidden");
    document.getElementById("adminPass").value = "";
  }
};

window.unlockAdmin = async function() {
  const pass = document.getElementById("adminPass").value.trim();
  if (pass !== ADMIN_PASS) {
    document.getElementById("adminPassError").innerText = "⛔ Wrong password. Try again.";
    document.getElementById("adminPass").value = "";
    document.getElementById("adminPass").focus();
    return;
  }
  document.getElementById("adminPassError").innerText = "";
  document.getElementById("adminLoginArea").classList.add("hidden");
  document.getElementById("adminExpenseArea").classList.remove("hidden");
  await loadExpenditures();
};

// ==================== EXPENDITURE: ADD ===============
window.addExpenditure = async function() {
  const date        = document.getElementById("expDate").value.trim();
  const description = document.getElementById("expDesc").value.trim();
  const qty         = document.getElementById("expQty").value.trim();
  const unit        = document.getElementById("expUnit").value.trim();
  const amount      = document.getElementById("expAmount").value.trim();

  // Validate
  const fields = [
    { el: document.getElementById("expDate"),   val: date,        msg: "Date is required" },
    { el: document.getElementById("expDesc"),   val: description, msg: "Description is required" },
    { el: document.getElementById("expQty"),    val: qty,         msg: "Qty is required" },
    { el: document.getElementById("expUnit"),   val: unit,        msg: "Unit is required" },
    { el: document.getElementById("expAmount"), val: amount,      msg: "Amount is required" },
  ];

  let ok = true;
  fields.forEach(f => {
    f.el.classList.remove("input-error");
    if (!f.val) { f.el.classList.add("input-error"); ok = false; }
  });
  if (!ok) return;

  if (isNaN(parseFloat(amount))) {
    document.getElementById("expAmount").classList.add("input-error");
    return;
  }

  const addBtn = document.getElementById("addExpBtn");
  addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  addBtn.disabled = true;

  await postToSheet({
    action: "addExpenditure",
    accessCode: ADMIN_PASS,
    date, description, qty, unit,
    amount: parseFloat(amount).toFixed(2)
  });

  // Clear inputs
  ["expDate","expDesc","expQty","expUnit","expAmount"].forEach(id => {
    document.getElementById(id).value = "";
    document.getElementById(id).classList.remove("input-error");
  });

  addBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
  addBtn.disabled = false;

  await loadExpenditures();
};

// ==================== EXPENDITURE: LOAD =============
async function loadExpenditures() {
  const tbody  = document.getElementById("expTableBody");
  const totEl  = document.getElementById("expTotal");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-dim);"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;

  try {
    const res  = await fetch(GAS_URL + "?action=getExpenditures");
    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="exp-empty">No expenditures recorded yet.</td></tr>`;
      totEl.innerText = "₦ 0.00";
      return;
    }

    let total = 0;
    tbody.innerHTML = rows.map((r, i) => {
      const amt = parseFloat(r.amount) || 0;
      total += amt;
      return `<tr>
        <td>${r.date || ''}</td>
        <td>${r.description || ''}</td>
        <td style="text-align:center">${r.qty || ''}</td>
        <td style="text-align:center">${r.unit || ''}</td>
        <td class="exp-amount-cell">₦ ${amt.toLocaleString('en-NG', {minimumFractionDigits:2})}</td>
      </tr>`;
    }).join('');

    totEl.innerText = `₦ ${total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:#f88;text-align:center;padding:1rem;">Error loading data: ${err.message}</td></tr>`;
  }
}

// ==================== MODAL CLOSE ON BACKDROP CLICK =
window.addEventListener("click", (e) => {
  const modal = document.getElementById("passwordModal");
  if (e.target === modal) {
    modal.style.display = "none";
    currentSection = "";
  }
});

// ==================== INIT ==========================
document.addEventListener("DOMContentLoaded", () => {
  const roleSel = document.getElementById("roleOptions");
  if (roleSel) roleSel.innerHTML = '<option value="">– choose category first –</option>';

  document.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("input", function() {
      this.classList.remove("input-error");
      const errDiv = this.closest("form")?.querySelector(`.validation-error[data-for="${this.name}"]`);
      if (errDiv) errDiv.style.display = "none";
    });
    el.addEventListener("change", function() {
      this.classList.remove("input-error");
    });
  });
});
