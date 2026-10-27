/*
  SUMMIT FITNESS — front-end scaffold
  All data below is in-memory mock data. Replace the functions marked
  "TODO: connect to backend" with real fetch() calls to your API.
*/

// ---------- Mock data (replace with API calls) ----------
// class.booked holds the ids of the members who booked that class.
let classes = [
  { id: 1, name: "Sunrise HIIT", trainer: "Jordan Lee", type: "HIIT", day: "Monday", time: "6:00 AM", capacity: 12, booked: [] },
  { id: 2, name: "Power Vinyasa", trainer: "Ama Okafor", type: "Yoga", day: "Monday", time: "8:00 AM", capacity: 15, booked: [] },
  { id: 3, name: "Barbell Strength", trainer: "Marco Diaz", type: "Strength", day: "Tuesday", time: "5:30 PM", capacity: 10, booked: [] },
  { id: 4, name: "Spin Sprint", trainer: "Priya Nair", type: "Cycling", day: "Wednesday", time: "6:30 AM", capacity: 20, booked: [] },
  { id: 5, name: "Evening Flow", trainer: "Ama Okafor", type: "Yoga", day: "Thursday", time: "7:00 PM", capacity: 15, booked: [] },
  { id: 6, name: "Full Body HIIT", trainer: "Jordan Lee", type: "HIIT", day: "Friday", time: "6:00 AM", capacity: 12, booked: [] },
];

let members = []; // { id, username, email, membership, joinedOn, startedOn, expiresOn, bookings: [classId] }
let nextUserId = 1;
let currentUser = null;
let currentView = "home";
let profileFormFor = null;  // id of the member whose details are in the profile form
let planChoice = null;      // plan highlighted in the account plan picker
let membershipNotice = "";  // confirmation shown after renewing or switching plans

// Troubleshooting switch: lets visitors who are not signed in open the My account page.
// They see sample data with every control turned off. Set to false to restore the sign-in gate.
const ACCOUNT_PREVIEW = true;

// Membership plans — TODO: connect to backend / payment processor (e.g. Stripe)
const PLANS = {
  Basic:   { price: 30,  days: 30,  blurb: "A month to find your rhythm." },
  Premium: { price: 80,  days: 90,  blurb: "A full season of training." },
  VIP:     { price: 300, days: 365, blurb: "A full year at the lowest daily rate." },
};
const PLAN_PERKS = [
  "Book classes online",
  "Full weekly class schedule",
  "Expiry date tracked on your account",
];

// Optional hero photos. Leave empty to use the built-in themed slides, or add the
// path to a photo you have the rights to use, e.g. HIIT: "images/hiit.jpg".
// The photo only replaces the slide background once it has loaded.
const HERO_PHOTOS = { Strength: "images/danielle-cerullo-CQfNt66ttZM-unsplash.jpg", Yoga: "images/ambitious-studio-rick-barrett-w7jYaN7GqyA-unsplash.jpg", HIIT: "images/jonathan-borba-R0y_bEUjiOM-unsplash.jpg", Cycling: "images/sam-moghadam-W8CyjblrF8U-unsplash.jpg" };

// ---------- Helpers ----------
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

const reduceMotion = typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Members and memberships ----------
function findByEmail(email) {
  return members.find(m => m.email.toLowerCase() === email.toLowerCase());
}

function usernameTaken(username, except) {
  return members.some(m => m !== except && m.username.toLowerCase() === username.toLowerCase());
}

function createMember(username, email, plan) {
  const now = new Date();
  const user = {
    id: nextUserId++,
    username,
    email,
    membership: plan,
    joinedOn: now,
    startedOn: now,
    expiresOn: addDays(now, PLANS[plan].days),
    bookings: [],
  };
  members.push(user);
  return user;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// A membership is valid through the end of its expiry date.
function isActive(user) {
  return new Date() <= endOfDay(user.expiresOn);
}

// Whole calendar days from today to the expiry date. Counting calendar days
// (not 24-hour blocks) keeps the number right across daylight-saving changes.
function daysLeft(user) {
  const diff = (startOfDay(user.expiresOn) - startOfDay(new Date())) / 864e5;
  return Math.max(0, Math.round(diff));
}

// Renewing an active plan adds time to the current expiry date.
// Anything else (switching plans, or renewing after expiry) starts a new term today.
function applyPlan(user, plan) {
  const now = new Date();
  if (plan === user.membership && isActive(user)) {
    user.expiresOn = addDays(user.expiresOn, PLANS[plan].days);
  } else {
    user.membership = plan;
    user.startedOn = now;
    user.expiresOn = addDays(now, PLANS[plan].days);
  }
}

// Sample member shown by the signed-out preview of My account. Never added to `members`.
let previewUser = null;

function accountUser() {
  if (currentUser) return currentUser;
  if (!previewUser) {
    const now = new Date();
    previewUser = {
      id: 0,
      username: "Sample Member",
      email: "sample@example.com",
      membership: "Premium",
      joinedOn: addDays(now, -45),
      startedOn: addDays(now, -30),
      expiresOn: addDays(now, PLANS.Premium.days - 30),
      bookings: [1],
    };
  }
  return previewUser;
}

// ---------- Element refs ----------
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authBtn = document.getElementById("authBtn");
const userLabel = document.getElementById("userLabel");

const registerModal = document.getElementById("registerModal");
const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");

const acctMembership = document.getElementById("acctMembership");
const profileForm = document.getElementById("profileForm");
const profileStatus = document.getElementById("profileStatus");

// ---------- View routing ----------
const navlinks = document.querySelectorAll(".navlink");
const views = {
  home: document.getElementById("view-home"),
  schedule: document.getElementById("view-schedule"),
  account: document.getElementById("view-account"),
};

function showView(name) {
  if (!views[name]) return;
  if (name === "account" && !currentUser && !ACCOUNT_PREVIEW) {
    authModal.classList.remove("hidden");
    return;
  }
  if (name !== "account") planChoice = null;
  currentView = name;
  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle("hidden", key !== name);
  });
  navlinks.forEach(l => {
    l.classList.toggle("is-active", l.dataset.view === name && !l.dataset.scroll);
  });
  window.scrollTo(0, 0);
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el && el.scrollIntoView) {
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }
}

function openRegister(plan) {
  if (plan && PLANS[plan]) {
    const radio = registerForm.querySelector(`input[name="plan"][value="${plan}"]`);
    if (radio) radio.checked = true;
  }
  registerModal.classList.remove("hidden");
}

// One delegated handler covers nav links, hero/CTA buttons, class tiles,
// trainer cards, plan buttons and footer links, including ones rendered later by JS.
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-view], [data-open], [data-filter-type], [data-filter-search], [data-switch-plan]");
  if (!el || el.disabled) return;

  if (el.dataset.open === "register") {
    openRegister(el.dataset.plan);
    return;
  }
  if (el.dataset.open === "login") {
    authModal.classList.remove("hidden");
    return;
  }
  if (el.dataset.switchPlan) {
    if (!currentUser) return;
    planChoice = el.dataset.switchPlan;
    membershipNotice = "";
    renderAccount();
    showView("account");
    return;
  }
  if (el.dataset.filterType !== undefined || el.dataset.filterSearch !== undefined) {
    document.getElementById("filterType").value = el.dataset.filterType || "";
    document.getElementById("filterSearch").value = el.dataset.filterSearch || "";
    document.getElementById("filterDay").value = "";
    renderSchedule();
    showView("schedule");
    return;
  }
  if (el.dataset.view) {
    showView(el.dataset.view);
    if (el.dataset.scroll) scrollToSection(el.dataset.scroll);
  }
});

// ---------- Modal helpers ----------
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.close).classList.add("hidden");
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  }
});

authBtn.addEventListener("click", () => {
  if (currentUser) {
    logout();
  } else {
    authModal.classList.remove("hidden");
  }
});

registerBtn.addEventListener("click", () => openRegister());

// ---------- Auth: log in (mock — TODO: connect to backend) ----------
authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("authName").value.trim();
  const email = document.getElementById("authEmail").value.trim();

  // TODO: connect to backend — POST /api/login
  // For now: find an existing member by email, or create a quick Basic account.
  currentUser = findByEmail(email) || createMember(name, email, "Basic");

  authModal.classList.add("hidden");
  authForm.reset();
  renderAll();
  if (currentView === "home") showView("account");
});

// ---------- Auth: register (mock — TODO: connect to backend) ----------
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const plan = registerForm.querySelector('input[name="plan"]:checked').value;

  if (findByEmail(email)) {
    alert("An account with that email already exists — log in instead.");
    return;
  }
  if (usernameTaken(username)) {
    alert("That username is taken. Try another one.");
    return;
  }

  // TODO: connect to backend — POST /api/signup, then charge PLANS[plan].price
  // via your payment processor before activating the membership.
  currentUser = createMember(username, email, plan);

  registerModal.classList.add("hidden");
  registerForm.reset();
  renderAll();
  if (currentView === "home") showView("account");
});

function logout() {
  currentUser = null;
  profileFormFor = null;
  planChoice = null;
  membershipNotice = "";
  renderAll();
  if (currentView === "account") showView("home");
}

// ---------- Rendering ----------
function renderAll() {
  renderUserBar();
  renderHome();
  renderAccount();
  renderSchedule();
}

function renderUserBar() {
  if (currentUser) {
    const expired = isActive(currentUser) ? "" : " (expired)";
    userLabel.textContent = `${currentUser.username} · ${currentUser.membership}${expired}`;
    authBtn.textContent = "Log out";
    registerBtn.classList.add("hidden");
  } else {
    userLabel.textContent = "Not signed in";
    authBtn.textContent = "Log in";
    registerBtn.classList.remove("hidden");
  }
  // Show or hide buttons that only make sense for visitors or for members
  document.querySelectorAll("[data-auth]").forEach(el => {
    const showWhenSignedIn = el.dataset.auth === "in";
    const show = showWhenSignedIn === Boolean(currentUser)
      || (ACCOUNT_PREVIEW && el.hasAttribute("data-auth-preview"));
    el.classList.toggle("hidden", !show);
  });
}

// ----- Home page -----
function bestValuePlan() {
  return Object.entries(PLANS)
    .sort((a, b) => a[1].price / a[1].days - b[1].price / b[1].days)[0][0];
}

function renderHome() {
  const trainers = new Set(classes.map(c => c.trainer));
  document.getElementById("statClasses").textContent = classes.length;
  document.getElementById("statTrainers").textContent = trainers.size;
  document.getElementById("statPlans").textContent = Object.keys(PLANS).length;
  document.getElementById("statFrom").textContent = `$${Math.min(...Object.values(PLANS).map(p => p.price))}`;

  document.querySelectorAll("[data-count]").forEach(el => {
    const n = classes.filter(c => c.type === el.dataset.count).length;
    el.textContent = `${plural(n, "class", "classes")} a week`;
  });

  renderPlans();
  renderTrainers();
  updateHeroCaption();
  document.getElementById("footerYear").textContent = new Date().getFullYear();
}

function renderPlans() {
  const grid = document.getElementById("pricingGrid");
  const best = bestValuePlan();

  grid.innerHTML = Object.entries(PLANS).map(([name, plan]) => {
    const perDay = (plan.price / plan.days).toFixed(2);
    const term = plan.days === 365 ? "365 days (1 year)" : `${plan.days} days`;
    const isMine = Boolean(currentUser) && currentUser.membership === name;

    let badge = "";
    if (isMine) badge = "Your plan";
    else if (name === best) badge = "Best value";

    let action;
    if (!currentUser) {
      action = `<button class="btn btn--primary btn--block" data-open="register" data-plan="${name}">Choose ${name}</button>`;
    } else if (isMine && isActive(currentUser)) {
      action = `<button class="btn btn--primary btn--block" data-view="schedule">Book a class</button>`;
    } else if (isMine) {
      action = `<button class="btn btn--primary btn--block" data-switch-plan="${name}">Renew ${name}</button>`;
    } else {
      action = `<button class="btn btn--ghost btn--block" data-switch-plan="${name}">Switch to ${name}</button>`;
    }

    return `
      <article class="pricing-card${name === best || isMine ? " is-featured" : ""}">
        ${badge ? `<span class="pricing-card__badge">${badge}</span>` : ""}
        <h3 class="pricing-card__name">${name}</h3>
        <p class="pricing-card__blurb">${plan.blurb}</p>
        <div class="pricing-card__price">$${plan.price}</div>
        <div class="pricing-card__term">${term}</div>
        <div class="pricing-card__perday">About $${perDay} per day</div>
        <ul class="pricing-card__perks">
          ${PLAN_PERKS.map(p => `<li>${p}</li>`).join("")}
        </ul>
        ${action}
      </article>
    `;
  }).join("");
}

function renderTrainers() {
  const grid = document.getElementById("trainerGrid");
  const byTrainer = new Map();
  classes.forEach(c => {
    if (!byTrainer.has(c.trainer)) byTrainer.set(c.trainer, { types: new Set(), count: 0 });
    const t = byTrainer.get(c.trainer);
    t.types.add(c.type);
    t.count += 1;
  });

  if (byTrainer.size === 0) {
    grid.innerHTML = `<p class="empty">Trainers will appear here once classes are scheduled.</p>`;
    return;
  }

  grid.innerHTML = [...byTrainer.entries()].map(([name, t]) => `
    <article class="trainer">
      <div class="trainer__avatar" aria-hidden="true">${escapeHtml(initials(name))}</div>
      <strong class="trainer__name">${escapeHtml(name)}</strong>
      <span class="trainer__meta">${[...t.types].map(escapeHtml).join(" · ")}</span>
      <span class="trainer__meta">${plural(t.count, "class", "classes")} a week</span>
      <button class="btn btn--ghost btn--small" data-filter-search="${escapeHtml(name)}">See classes</button>
    </article>
  `).join("");
}

// ----- Hero slideshow -----
const heroEl = document.getElementById("hero");
const heroSlides = document.querySelectorAll(".hero__slide");
const heroDots = document.querySelectorAll(".hero__dots button");
const heroCaption = document.getElementById("heroCaption");
let heroIndex = 0;
let heroTimer = null;

function updateHeroCaption() {
  const type = heroSlides[heroIndex].dataset.type;
  const next = classes.find(c => c.type === type);
  heroCaption.textContent = next
    ? `${type} · ${next.name}, ${next.day} ${next.time}`
    : `${type} · no classes scheduled yet`;
}

function setHeroSlide(i) {
  heroIndex = (i + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((s, n) => s.classList.toggle("is-active", n === heroIndex));
  heroDots.forEach((d, n) => {
    d.classList.toggle("is-active", n === heroIndex);
    d.setAttribute("aria-current", n === heroIndex ? "true" : "false");
  });
  updateHeroCaption();
}

function startHeroTimer() {
  if (reduceMotion || heroTimer) return;
  heroTimer = setInterval(() => setHeroSlide(heroIndex + 1), 5000);
}

function stopHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = null;
}

heroDots.forEach((dot, n) => dot.addEventListener("click", () => setHeroSlide(n)));
heroEl.addEventListener("mouseenter", stopHeroTimer);
heroEl.addEventListener("mouseleave", startHeroTimer);
heroEl.addEventListener("focusin", stopHeroTimer);
heroEl.addEventListener("focusout", startHeroTimer);

Object.entries(HERO_PHOTOS).forEach(([type, url]) => {
  if (!url) return;
  const img = new Image();
  img.onload = () => {
    const slide = document.querySelector(`.hero__slide[data-type="${type}"]`);
    if (slide) slide.style.backgroundImage = `url("${url}")`;
  };
  img.src = url;
});

// ----- My account -----
function renderAccount() {
  if (!currentUser && !ACCOUNT_PREVIEW) return;
  const u = accountUser();
  const preview = !currentUser;

  document.getElementById("previewBanner").classList.toggle("hidden", !preview);
  document.getElementById("acctAvatar").textContent = initials(u.username);
  document.getElementById("acctName").textContent = u.username;
  document.getElementById("acctSince").textContent = preview
    ? "Sample data, not a real account"
    : `Member since ${formatDate(u.joinedOn)}`;

  // Fill the profile form once per member, so unsaved typing isn't wiped by other updates
  if (profileFormFor !== u.id) {
    document.getElementById("profUsername").value = u.username;
    document.getElementById("profEmail").value = u.email;
    profileStatus.textContent = "";
    profileStatus.className = "form__status";
    profileFormFor = u.id;
  }

  profileForm.querySelectorAll("input, button").forEach(el => { el.disabled = preview; });
  renderMembershipPanel(u, preview);
  renderMyBookings(u, preview);
}

function renderMembershipPanel(u, preview) {
  const plan = PLANS[u.membership];
  const active = isActive(u);
  const left = daysLeft(u);
  const span = Math.max(1, new Date(u.expiresOn) - new Date(u.startedOn));
  const remaining = active
    ? Math.min(100, Math.max(0, ((new Date(u.expiresOn) - Date.now()) / span) * 100))
    : 0;

  let badge = ["badge--active", "Active"];
  if (!active) badge = ["badge--expired", "Expired"];
  else if (left <= 7) badge = ["badge--soon", "Expires soon"];

  const choice = planChoice && PLANS[planChoice] ? planChoice : u.membership;
  const cards = Object.entries(PLANS).map(([name, p]) => `
    <label class="plan-card">
      <input type="radio" name="acctPlan" value="${name}"${name === choice ? " checked" : ""}${preview ? " disabled" : ""}>
      <span class="plan-card__name">${name}</span>
      <span class="plan-card__price">$${p.price}</span>
      <span class="plan-card__duration">${p.days} days</span>
    </label>
  `).join("");

  acctMembership.innerHTML = `
    <div class="member-plan">
      <span class="member-plan__name">${escapeHtml(u.membership)}</span>
      <span class="badge ${badge[0]}">${badge[1]}</span>
    </div>
    <p class="member-plan__price muted">$${plan.price} for ${plan.days} days</p>

    <dl class="facts">
      <div><dt>Started</dt><dd>${formatDate(u.startedOn)}</dd></div>
      <div><dt>${active ? "Expires" : "Expired"}</dt><dd>${formatDate(u.expiresOn)}</dd></div>
      <div><dt>Days left</dt><dd>${left}</dd></div>
    </dl>

    <div class="meter" role="progressbar" aria-label="Membership time remaining"
         aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(remaining)}">
      <div class="meter__fill" style="width: ${remaining.toFixed(1)}%"></div>
    </div>

    <form id="planForm" class="plan-form">
      <fieldset class="plan-picker">
        <legend class="plan-picker__label">Renew or switch plan</legend>
        <div class="plan-grid">${cards}</div>
      </fieldset>
      <button type="submit" class="btn btn--primary" id="planSubmit"${preview ? " disabled" : ""}></button>
      <p class="form__note" id="planHint"></p>
      <p class="form__status" id="planStatus" role="status">${escapeHtml(membershipNotice)}</p>
      <p class="form__note">Demo only: no payment is taken.</p>
    </form>
  `;
  updatePlanAction();
}

function updatePlanAction() {
  const form = document.getElementById("planForm");
  if (!form) return;
  const u = accountUser();
  const choice = form.querySelector('input[name="acctPlan"]:checked').value;
  const p = PLANS[choice];
  const same = choice === u.membership;
  const stillActive = isActive(u);

  document.getElementById("planSubmit").textContent =
    `${same ? "Renew" : "Switch to"} ${choice} · $${p.price}`;

  let hint;
  if (same && stillActive) hint = `Adds ${p.days} days to your current expiry date.`;
  else if (!same && stillActive) hint = `Starts a new ${p.days}-day term today. Time left on your current plan isn't carried over.`;
  else hint = `Starts a new ${p.days}-day term today.`;
  document.getElementById("planHint").textContent = hint;
}

acctMembership.addEventListener("change", (e) => {
  if (e.target.name !== "acctPlan") return;
  planChoice = e.target.value;
  membershipNotice = "";
  document.getElementById("planStatus").textContent = "";
  updatePlanAction();
});

acctMembership.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id !== "planForm" || !currentUser) return;
  const choice = e.target.querySelector('input[name="acctPlan"]:checked').value;
  const renewal = choice === currentUser.membership;

  // TODO: connect to backend — POST /api/memberships { plan }, charging PLANS[choice].price
  // via your payment processor before the new expiry date is saved.
  applyPlan(currentUser, choice);

  planChoice = null;
  membershipNotice = `${renewal ? "Renewed" : "Switched to"} ${choice}. Your plan now runs until ${formatDate(currentUser.expiresOn)}.`;
  renderAll();
});

function renderMyBookings(u, preview) {
  const wrap = document.getElementById("myBookings");
  const mine = classes.filter(c => u.bookings.includes(c.id));

  if (mine.length === 0) {
    wrap.innerHTML = `<p class="empty">No classes booked yet. <button class="linklike linklike--accent" data-view="schedule">Browse the schedule</button></p>`;
    return;
  }

  wrap.innerHTML = mine.map(c => `
    <div class="booking-item">
      <div>
        <strong>${escapeHtml(c.name)}</strong>
        <div class="booking-item__meta">${escapeHtml(c.day)} · ${escapeHtml(c.time)} · ${escapeHtml(c.trainer)}</div>
      </div>
      <button class="btn btn--danger btn--small" data-cancel="${c.id}"${preview ? " disabled" : ""}>Cancel</button>
    </div>
  `).join("");

  wrap.querySelectorAll("[data-cancel]").forEach(btn => {
    btn.addEventListener("click", () => cancelBooking(Number(btn.dataset.cancel)));
  });
}

// Profile details (mock — TODO: connect to backend: PATCH /api/me)
profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const usernameInput = document.getElementById("profUsername");
  const emailInput = document.getElementById("profEmail");
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();

  const fail = (msg) => {
    profileStatus.textContent = msg;
    profileStatus.className = "form__status form__status--error";
  };

  if (!username) return fail("Enter a username.");
  const other = findByEmail(email);
  if (other && other !== currentUser) return fail("That email is already used by another account.");
  if (usernameTaken(username, currentUser)) return fail("That username is taken. Try another one.");

  currentUser.username = username;
  currentUser.email = email;
  usernameInput.value = username;
  emailInput.value = email;
  profileStatus.textContent = "Changes saved.";
  profileStatus.className = "form__status";
  renderAll();
});

profileForm.addEventListener("input", () => {
  profileStatus.textContent = "";
  profileStatus.className = "form__status";
});

// ----- Schedule -----
function renderSchedule() {
  const search = document.getElementById("filterSearch").value.toLowerCase();
  const day = document.getElementById("filterDay").value;
  const type = document.getElementById("filterType").value;
  const tbody = document.getElementById("scheduleBody");

  const filtered = classes.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search) || c.trainer.toLowerCase().includes(search);
    const matchesDay = !day || c.day === day;
    const matchesType = !type || c.type === type;
    return matchesSearch && matchesDay && matchesType;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No classes match those filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const spotsLeft = c.capacity - c.booked.length;
    const isBooked = currentUser && c.booked.includes(currentUser.id);
    const isFull = spotsLeft <= 0;

    let spotsClass = "";
    if (isFull) spotsClass = "spots-full";
    else if (spotsLeft <= 3) spotsClass = "spots-low";

    let actionBtn;
    if (!currentUser) {
      actionBtn = `<button class="btn btn--ghost btn--small" disabled>Log in to book</button>`;
    } else if (isBooked) {
      actionBtn = `<button class="btn btn--danger btn--small" data-cancel-row="${c.id}">Cancel</button>`;
    } else if (isFull) {
      actionBtn = `<button class="btn btn--ghost btn--small" disabled>Full</button>`;
    } else if (!isActive(currentUser)) {
      actionBtn = `<button class="btn btn--ghost btn--small" data-switch-plan="${currentUser.membership}">Renew to book</button>`;
    } else {
      actionBtn = `<button class="btn btn--primary btn--small" data-book="${c.id}">Book</button>`;
    }

    return `
      <tr>
        <td><strong>${escapeHtml(c.name)}</strong><div class="muted">${escapeHtml(c.type)}</div></td>
        <td>${escapeHtml(c.trainer)}</td>
        <td>${escapeHtml(c.day)} · ${escapeHtml(c.time)}</td>
        <td class="${spotsClass}">${isFull ? "Full" : `${spotsLeft} left`}</td>
        <td>${actionBtn}</td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-book]").forEach(btn => {
    btn.addEventListener("click", () => bookClass(Number(btn.dataset.book)));
  });
  tbody.querySelectorAll("[data-cancel-row]").forEach(btn => {
    btn.addEventListener("click", () => cancelBooking(Number(btn.dataset.cancelRow)));
  });
}

// ---------- Booking logic (TODO: connect to backend) ----------
function bookClass(classId) {
  if (!currentUser) return;
  const cls = classes.find(c => c.id === classId);
  if (!cls) return;

  // Guard: only active memberships can book
  if (!isActive(currentUser)) {
    alert("Your membership has expired. Renew it on your account page to book classes.");
    return;
  }
  // Guard: capacity check
  if (cls.booked.length >= cls.capacity) {
    alert("This class just filled up.");
    renderSchedule();
    return;
  }
  // Guard: prevent double-booking
  if (cls.booked.includes(currentUser.id)) return;

  // TODO: connect to backend — POST /api/bookings { classId }
  cls.booked.push(currentUser.id);
  currentUser.bookings.push(classId);
  renderAll();
}

function cancelBooking(classId) {
  if (!currentUser) return;
  const cls = classes.find(c => c.id === classId);
  if (!cls) return;

  // TODO: connect to backend — DELETE /api/bookings/:id
  cls.booked = cls.booked.filter(id => id !== currentUser.id);
  currentUser.bookings = currentUser.bookings.filter(id => id !== classId);
  renderAll();
}

// ---------- Filters ----------
["filterSearch", "filterDay", "filterType"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderSchedule);
});

// ---------- Init ----------
renderAll();
setHeroSlide(0);
startHeroTimer();
