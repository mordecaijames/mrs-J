// ==================== CONFIG ======================
const BAND_PASS = "band2026";
const PROD_PASS = "prod2026";
const ADMIN_PASS = "admin123"; // change before going live

// ⚠️ Replace with your deployed Google Apps Script URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbyppFrFJbPN0kqnu1jvbnF8R7J2HEJtUrbGRZm3ZEDh7esSOA7TlvxdF9bz0Ro3OlFo/exec";

// ⚠️ Replace these with your real WhatsApp group invite links
const WHATSAPP_LINKS = {
  band:       "https://chat.whatsapp.com/GgfdCO9gXytGIT69W4foB1K",
  audience:   "https://chat.whatsapp.com/GgfdCO9gXytGIT69W4foB1",
  production: "https://chat.whatsapp.com/GgfdCO9gXytGIT69W4foB1"
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
    // Focus the input for quick typing
    setTimeout(() => document.getElementById("passInput").focus(), 100);
  } else {
    showSection(section);
  }
};

window.verifyPassword = function() {
  const val = document.getElementById("passInput").value.trim();
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

// FIX: showSection now correctly targets .tab-btn class
function showSection(id) {
  // Hide all forms
  document.querySelectorAll(".form").forEach(f => f.classList.add("hidden"));

  // Show the requested form
  const targetForm = document.getElementById(id);
  if (targetForm) targetForm.classList.remove("hidden");

  // Update active tab highlight
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  // Match button by its onclick attribute value
  document.querySelectorAll(".tab-btn").forEach(b => {
    if (b.getAttribute("onclick") && b.getAttribute("onclick").includes(`'${id}'`)) {
      b.classList.add("active");
    }
  });

  // Scroll to the form smoothly
  targetForm && targetForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ==================== ROLE DROPDOWN =================
window.updateRoles = function() {
  const rolesMap = {
    instrumentalist: ["Acoustic Guitar", "Keyboardist", "Aux Keys", "Drummer", "Bass Guitar", "Lead Guitar"],
    vocals:          ["Lead Vocals", "Tenor", "Soprano", "Alto"]
  };
  const cat = document.getElementById("roleCategory").value;
  const roleSelect = document.getElementById("roleOptions");
  roleSelect.innerHTML = "";

  if (!cat) {
    roleSelect.innerHTML = '<option value="">– choose category first –</option>';
    return;
  }

  // Add a blank default option
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

  // Clear all previous errors
  form.querySelectorAll(".validation-error").forEach(e => e.style.display = "none");
  form.querySelectorAll(".input-error").forEach(e => e.classList.remove("input-error"));

  // Check all required fields
  form.querySelectorAll("[required]").forEach(inp => {
    if (!inp.value.trim()) {
      inp.classList.add("input-error");
      // Show corresponding error message using data-for matching inp.name
      const errDiv = form.querySelector(`.validation-error[data-for="${inp.name}"]`);
      if (errDiv) errDiv.style.display = "block";
      valid = false;
    }
  });

  // Email format check
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

  // Phone format check (7–20 digits, optional +, spaces, dashes, parens)
  const phoneField = form.querySelector('input[type="tel"]');
  if (phoneField && phoneField.value.trim()) {
    if (!phoneField.value.trim().match(/^[\d\s+\-()\[\]]{7,20}$/)) {
      phoneField.classList.add("input-error");
      const err = form.querySelector('.validation-error[data-for="phone"]');
      if (err) { err.style.display = "block"; err.innerText = "Enter a valid phone number"; }
      valid = false;
    }
  }

  // Band-specific: require role category + specific role selection
  const type = form.dataset.type;
  if (type === "band") {
    const cat = document.getElementById("roleCategory").value;
    const role = document.getElementById("roleOptions").value;
    if (!cat) {
      document.getElementById("roleCategory").classList.add("input-error");
      valid = false;
    }
    if (!role) {
      document.getElementById("roleOptions").classList.add("input-error");
      valid = false;
    }
  }

  return valid;
}

// ==================== SEND TO GOOGLE SHEETS =========
async function postToSheet(data) {
  try {
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors", // Apps Script limitation — response can't be read
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data)
    });
    // With no-cors we can't read the response body, so we optimistically assume success
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

    const type = this.dataset.type;

    // FIX: Use FormData with named inputs — this now works because all inputs have name=""
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => { data[key] = value; });

    // Add metadata
    data.formType  = type;
    data.timestamp = new Date().toISOString();

    // FIX: Send the access code so GAS can verify it server-side
    if (type === "band")       data.accessCode = BAND_PASS;
    if (type === "production") data.accessCode = PROD_PASS;

    // Add any fields not captured by FormData (dropdowns already have name attrs now, but belt-and-suspenders)
    if (type === "band") {
      data.roleCategory = document.getElementById("roleCategory").value;
      data.specificRole  = document.getElementById("roleOptions").value;
    }

    // Show a loading state on the submit button
    const btn = this.querySelector("button[type='submit']");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';
    btn.disabled = true;

    // Submit to Google Sheets
    await postToSheet(data);

    // FIX: Extract name correctly from named field
    const name = (data.fullName || "Worshiper").trim();

    // Send email confirmation
    await sendEmailConfirmation(data.email, name, type);

    // Populate success page
    document.getElementById("successName").innerText = `✨ ${name}`;

    // FIX: Use real WhatsApp links from the config object
    document.getElementById("whatsappLink").href = WHATSAPP_LINKS[type] || "#";

    // Transition to success page
    const container = document.querySelector(".container");
    container.style.opacity = "0";
    container.style.transition = "opacity 0.4s ease";
    setTimeout(() => {
      container.style.display = "none";
      document.getElementById("successPage").classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 400);

    // Restore button (in case user goes back)
    btn.innerHTML = originalText;
    btn.disabled = false;
  });
});

// ==================== ADMIN DASHBOARD ===============
window.toggleAdmin = function() {
  document.getElementById("adminPanel").classList.toggle("hidden");
};

window.unlockAdmin = async function() {
  const pass = document.getElementById("adminPass").value;
  if (pass !== ADMIN_PASS) {
    alert("⛔ Wrong admin password");
    return;
  }

  document.getElementById("adminData").innerHTML = "<p style='color:white'>Loading registrations…</p>";

  try {
    const response = await fetch(GAS_URL + "?action=getAll");
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById("adminData").innerHTML = "<p style='color:white'>No registrations yet.</p>";
      return;
    }

    let html = `<table id='adminTable'>
      <tr>
        <th>Timestamp</th><th>Type</th><th>Name</th>
        <th>Email</th><th>Phone</th><th>Role / Details</th>
      </tr>`;

    data.forEach(row => {
      html += `<tr>
        <td>${row.timestamp || ''}</td>
        <td>${row.formType || ''}</td>
        <td>${row.fullName || row.name || ''}</td>
        <td>${row.email || ''}</td>
        <td>${row.phone || ''}</td>
        <td>${row.specificRole || row.role || row.address || ''}</td>
      </tr>`;
    });

    html += "</table>";
    document.getElementById("adminData").innerHTML = html;
  } catch (err) {
    document.getElementById("adminData").innerHTML =
      `<p style='color:#f88'>Error loading data. Make sure your GAS is deployed with "Anyone" access and CORS is handled. (${err.message})</p>`;
  }
};

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
  // Set initial role dropdown placeholder
  const roleSel = document.getElementById("roleOptions");
  if (roleSel) roleSel.innerHTML = '<option value="">– choose category first –</option>';

  // Live clear of error state as user types/selects
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
