/* Newsletterly — Newsletter Growth-Readiness Audit engine (client-side, zero cost)
 * Scores a newsletter on the six signals that separate growing newsletters from
 * stalled ones: subject-line strength, preview text, send cadence & consistency,
 * deliverability hygiene, CTA clarity, and niche fit / monetization potential.
 * Weights sum to 100. All logic runs in-browser; no network calls for scoring.
 */
(function () {
  "use strict";


  // ---- centralized audit counter (fire-and-forget) ----
  var COUNTER_NS = "newsletterly-ai";
  function trackAudit() {
    try {
      fetch("https://api.counterapi.dev/v1/" + COUNTER_NS + "/audit_completed/up", {
        method: "GET",
        mode: "cors",
        cache: "no-store"
      });
    } catch (e) {}
  }
  var form = document.getElementById("auditForm");
  var result = document.getElementById("auditResult");
  var heroScore = document.getElementById("heroScore");
  var heroGrade = document.getElementById("heroGrade");

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function gradeFor(score) {
    if (score >= 85) return { g: "A", color: "var(--good)" };
    if (score >= 70) return { g: "B", color: "var(--brand)" };
    if (score >= 55) return { g: "C", color: "var(--warn)" };
    return { g: "D", color: "var(--bad)" };
  }
  var SPAM = ["FREE", "ACT NOW", "GUARANTEED", "BUY NOW", "LIMITED", "URGENT", "100%", "CLICK HERE", "WIN", "OFFER"];

  // score a single subject line 0..1
  function scoreLine(line) {
    var s = 0.6; // neutral baseline
    var len = line.length;
    if (len >= 30 && len <= 62) s += 0.15;
    else if (len >= 20 && len <= 80) s += 0.05;
    else s -= 0.2; // too short or too long

    var upper = (line.match(/[A-Z]/g) || []).length;
    var letters = (line.match(/[A-Za-z]/g) || []).length || 1;
    if (upper / letters > 0.3) s -= 0.2; // ALL CAPS

    var bangs = (line.match(/!/g) || []).length;
    if (bangs >= 3) s -= 0.2;

    var up = line.toUpperCase();
    for (var i = 0; i < SPAM.length; i++) {
      if (up.indexOf(SPAM[i]) !== -1) { s -= 0.3; break; }
    }
    if (/\d/.test(line)) s += 0.08;
    if (/\?/.test(line)) s += 0.08;
    if (/\p{Extended_Pictographic}/u.test(line)) s += 0.04;
    if (/\b(how|why|this|what|the)\b/i.test(line)) s += 0.08; // curiosity gap
    return clamp(s, 0, 1);
  }

  // ---- scoring ----
  function scoreNewsletter(input) {
    var tips = [];
    var dims = {};

    // 1) Subject-line strength (17)
    var lines = input.subjects.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
    var sSub;
    if (lines.length === 0) {
      sSub = 4;
      tips.push("Paste your recent subject lines — we can't score what we can't see. Even 5 lines reveals your open-rate pattern.");
    } else {
      var sum = 0, spammy = 0;
      lines.forEach(function (l) {
        var v = scoreLine(l);
        sum += v;
        if (v < 0.5) spammy++;
      });
      var avg = sum / lines.length;
      sSub = Math.round(avg * 17);
      if (avg < 0.6) tips.push(spammy + " of your " + lines.length + " recent subject lines read as spammy or generic. Rewrite with a curiosity gap (a question or 'how/why' hook) and drop the ALL-CAPS + '!!!'.");
      else if (avg < 0.78) tips.push("Your subject lines are workable but safe. Add a number, a question, or a specific promise to lift open rates.");
    }
    dims["Subject lines"] = { score: sSub, max: 17 };

    // 2) Preview text (16)
    var sPrev;
    if (input.preview === "yes") { sPrev = 16; }
    else if (input.preview === "partial") { sPrev = 10; tips.push("Your preview text sometimes repeats the subject or stays empty. Write a second sentence that pulls readers past the subject line."); }
    else { sPrev = 5; tips.push("You're wasting the preview-text slot — most clients show it next to the subject. Write a real second hook."); }
    dims["Preview text"] = { score: sPrev, max: 16 };

    // 3) Send cadence & consistency (17)
    var sCad;
    if (input.cadence === "weekly") { sCad = 17; }
    else if (input.cadence === "biweekly") { sCad = 15; }
    else if (input.cadence === "daily") { sCad = 13; }
    else if (input.cadence === "monthly") { sCad = 10; tips.push("Monthly is too rare to build a reading habit. Move to biweekly or weekly to compound attention."); }
    else { sCad = 4; tips.push("Inconsistent sending kills momentum — pick a rhythm (weekly works for most niches) and stick to it."); }
    dims["Send cadence"] = { score: sCad, max: 17 };

    // 4) Deliverability hygiene (17)
    var sDel;
    if (input.deliver === "yes") { sDel = 17; }
    else if (input.deliver === "partial") { sDel = 11; tips.push("Finish your authentication (SPF/DKIM/DMARC) and a visible List-Unsubscribe header — partial setup still leaks to spam."); }
    else { sDel = 5; tips.push("Missing authentication (SPF/DKIM/DMARC) or a List-Unsubscribe header tanks inbox placement. Fix this before scaling sends."); }
    dims["Deliverability"] = { score: sDel, max: 17 };

    // 5) CTA clarity (16)
    var sCta;
    if (input.cta === "yes") { sCta = 16; }
    else if (input.cta === "sometimes") { sCta = 10; tips.push("Only some issues have a clear ask. Give every issue one job (reply / read / buy) so readers know what to do."); }
    else { sCta = 5; tips.push("Every issue needs one clear CTA. Vague newsletters don't convert readers into paid subscribers."); }
    dims["CTA clarity"] = { score: sCta, max: 16 };

    // 6) Niche fit & monetization potential (17)
    var sNic;
    if (input.niche === "finance" || input.niche === "aitech" || input.niche === "b2b") {
      sNic = 17; tips.push("You're in a high-CPM niche ($50–150+ CPM). Even a small list monetizes well — push toward paid subscriptions or sponsorships early.");
    } else if (input.niche === "career" || input.niche === "health" || input.niche === "news") {
      sNic = 14; tips.push("Solid monetization niche. Pair paid subscriptions with a light sponsorship strategy as the list grows.");
    } else if (input.niche === "lifestyle") {
      sNic = 11; tips.push("Lifestyle has lower CPMs — you'll need a larger list or strong paid subscriptions to monetize. Lean into a sharp sub-niche.");
    } else {
      sNic = 12;
    }
    dims["Niche fit"] = { score: sNic, max: 17 };

    var total = sSub + sPrev + sCad + sDel + sCta + sNic;
    if (tips.length === 0) tips.push("Strong setup across the board — keep the cadence and A/B test subject lines as you grow.");
    return { total: total, dims: dims, tips: tips };
  }

  // ---- render ----
  function ring(el, score) {
    var deg = (score / 100) * 360;
    el.style.background = "conic-gradient(var(--brand) " + deg + "deg, #e2eeec " + deg + "deg)";
  }

  function render(res) {
    var gr = gradeFor(res.total);
    document.getElementById("resScore").textContent = res.total;
    var gEl = document.getElementById("resGrade");
    gEl.textContent = "Grade " + gr.g;
    gEl.style.background = gr.color;
    gEl.style.color = "#fff";
    document.getElementById("resSummary").textContent =
      res.total >= 85 ? "Top-decile setup — minor tweaks only."
      : res.total >= 70 ? "Good foundation, a few quick wins left."
      : res.total >= 55 ? "Workable, but leaving growth on the table."
      : "Needs real work before it can compound.";

    ring(document.querySelector("#auditResult .score-ring"), res.total);

    var bars = document.getElementById("resBars");
    bars.innerHTML = "";
    Object.keys(res.dims).forEach(function (k) {
      var d = res.dims[k];
      var pct = Math.round((d.score / d.max) * 100);
      var row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML =
        '<span>' + k + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="bar-val">' + d.score + '/' + d.max + '</span>';
      bars.appendChild(row);
    });

    var tipsEl = document.getElementById("resTips");
    tipsEl.innerHTML = "";
    res.tips.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      tipsEl.appendChild(li);
    });

    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var res = scoreNewsletter({
      subjects: document.getElementById("fSubjects").value,
      preview: document.getElementById("fPreview").value,
      cadence: document.getElementById("fCadence").value,
      deliver: document.getElementById("fDeliver").value,
      cta: document.getElementById("fCta").value,
      niche: document.getElementById("fNiche").value
    });
    render(res);
    trackAudit();
  });

  // hero demo score (static illustrative until user runs audit)
  heroScore.textContent = 68;
  heroGrade.textContent = "C";

  // ---- email capture (Formspree free tier, graceful demo fallback) ----
  // Get a FREE form ID at https://formspree.io (no payment). Paste it into FORMSPREE_ID below.
  var emailForm = document.getElementById("emailForm");
  var FORMSPREE_ID = "meeyzkdp"; // free form ID from formspree.io (no payment)
  emailForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("fEmail").value;
    var note = document.getElementById("emailNote");
    if (FORMSPREE_ID.indexOf("YOUR_") === 0) {
      try {
        var store = JSON.parse(localStorage.getItem("newsletterly_leads") || "[]");
        store.push({ email: email, ts: new Date().toISOString() });
        localStorage.setItem("newsletterly_leads", JSON.stringify(store));
      } catch (err) {}
      note.textContent = "✓ Demo mode: lead saved locally (" + email + "). Add a free Formspree ID to receive real emails.";
      note.style.color = "var(--good)";
    } else {
      fetch("https://formspree.io/f/" + FORMSPREE_ID, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, subject: "Newsletterly audit lead", source: "Newsletterly landing" })
      })
        .then(function (r) {
          if (r.ok) { note.textContent = "✓ Subscribed! We'll email you launch + growth tips."; note.style.color = "var(--good)"; }
          else { note.textContent = "Couldn't send — try again or email us."; note.style.color = "var(--bad)"; }
        })
        .catch(function () { note.textContent = "Couldn't send — try again or email us."; note.style.color = "var(--bad)"; });
    }
    emailForm.reset();
  });
})();
