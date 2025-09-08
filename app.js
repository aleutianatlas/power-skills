// ...existing app.js top stuff...

  qsa("form[data-step]").forEach(function(form){
    const step = form.getAttribute("data-step") || "unknown";
    if (!state.respondentId) { state.respondentId = uuid(); save(); }

    // (existing hidden meta injection...)
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

      // ✅ NEW: capture responses into localStorage for the report
      try {
        state.responses = state.responses || {};
        const stepKey = `step_${step}`;
        const current = {};
        // Radios & textareas
        form.querySelectorAll("input[type=radio]:checked, textarea, input[type=text], input[type=email]").forEach(el=>{
          if (!el.name) return;
          current[el.name] = el.value;
        });
        state.responses[stepKey] = current;
        // Timestamp last submit
        state.lastSubmittedAt = new Date().toISOString();
        save();
      } catch (err) {
        console.warn("Could not store step responses:", err);
      }
      // ✅ END NEW

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
// ...existing app.js bottom stuff...
