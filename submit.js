/**
 * app.js — Multi-step Formspree helper
 * - Saves respondent info (name/email + a client UUID) in localStorage
 * - Injects hidden fields for correlation into every form
 * - Submits via fetch() and redirects to data-next or _redirect
 */
(function () {
  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c){
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15);
      const v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  function qs(s){return document.querySelector(s)}
  function qsa(s){return Array.from(document.querySelectorAll(s))}

  const KEY = "aa_formspree_train";
  const state = (()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}})();

  function save(){localStorage.setItem(KEY, JSON.stringify(state))}

  // Capture basics if present (Step 0)
  const nameEl = qs("#name");
  const emailEl = qs("#email");
  if (nameEl || emailEl) {
    const form = nameEl?.form || emailEl?.form;
    if (form) {
      form.addEventListener("submit", () => {
        state.name = nameEl?.value?.trim() || state.name || "";
        state.email = emailEl?.value?.trim() || state.email || "";
        state.respondentId = state.respondentId || uuid();
        save();
      });
    }
  }

  // For each form, inject hidden metadata and handle AJAX submission
  qsa("form[data-step]").forEach(function(form){
    const step = form.getAttribute("data-step") || "unknown";
    if (!state.respondentId) { state.respondentId = uuid(); save(); }

    [
      ["respondent_id", state.respondentId || ""],
      ["respondent_name", state.name || ""],
      ["respondent_email", state.email || ""],
      ["flow_name", "Aleutian Atlas Power Skills"],
      ["flow_step", step],
      ["user_agent", navigator.userAgent],
    ].forEach(([n,v])=>{
      const input = document.createElement("input");
      input.type = "hidden"; input.name = n; input.value = v;
      form.appendChild(input);
    });

    const nextUrl = form.getAttribute("data-next");
    form.addEventListener("submit", async function(e){
      e.preventDefault();
      const fd = new FormData(form);
      if (nextUrl && !fd.has("_redirect")) fd.append("_redirect", nextUrl);
      const endpoint = form.getAttribute("action");
      const btn = form.querySelector('button[type="submit"],input[type="submit"]');
      if (btn) btn.disabled = true;

      try {
        const res = await fetch(endpoint, { method:"POST", body:fd, headers:{Accept:"application/json"} });
        if (res.ok) {
          window.location.href = nextUrl || fd.get("_redirect") || "thanks.html";
        } else {
          const data = await res.json().catch(()=> ({}));
          alert((data.errors||[]).map(e=>e.message).join("\n") || "Submission failed. Please try again.");
        }
      } catch(err){
        console.error(err); alert("Network error while submitting. Please try again.");
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  });
})();
