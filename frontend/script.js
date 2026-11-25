

// local
//const API_URL = "http://127.0.0.1:8000";
// deployment
const API_URL = "https://api.gymhubproject.com";
let membershipUpdateInProgress = false;


let classes = [];

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


const PLANS = {
  Basic:   { price: 30,  days: 30,  blurb: "A month to find your rhythm." },
  Premium: { price: 80,  days: 90,  blurb: "A full season of training." },
  Vip:     { price: 300, days: 365, blurb: "A full year at the lowest daily rate." },
};
const PLAN_PERKS = [
  "Book classes online",
  "Full weekly class schedule",
  "Expiry date tracked on your account",
];

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

function parseLocalDate(value) {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  if (!date) return "—";
  return parseLocalDate(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

const reduceMotion = typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;



// --------Admin Function -------------
function isAdmin(){
  return currentUser && currentUser.role ==="admin";
}

// ---------- Members and memberships ----------


function startOfDay(date) {
  const d = parseLocalDate(date);
  if (!d) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = parseLocalDate(date);
  if (!d) return null;
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

// ------- preview of my account page --------------------
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
      joined: addDays(now, -45),
      startedOn: addDays(now, -30),
      expiresOn: addDays(now, PLANS.Premium.days - 30),
      bookings: [],
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

  const registerMessage = document.getElementById("regMessage");
  registerMessage.textContent = "";
  registerMessage.classList.remove("success-message");

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

// ---------- Auth: log in  ----------
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("authName").value.trim();
  const password = document.getElementById("authPassword").value;
  const userData = {
    username: username,
    password: password
  };

  try{
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    });
  
  

  const login_data = await response.json();
  if (!response.ok){
    alert(login_data.detail || "Login failed")
    return;
  }
  // save jwt
  const accessToken = login_data.access_token;
  authModal.classList.add("hidden");
  authForm.reset();

  // use token to get user info
  console.log("Login Successful:", accessToken);
  sessionStorage.setItem("accessToken", accessToken);

  // Retrieve the logged-in user's profile
const profileResponse = await fetch(`${API_URL}/auth/my_profile`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${accessToken}`
  }
});

const profileData = await profileResponse.json();

if (!profileResponse.ok) {
  throw new Error(profileData.detail || "Could not retrieve profile");
}

currentUser = profileData;


renderAll();
showView("account");


  } catch (error){
  console.error("Login error:", error);
  alert(error.message);
}
});



// ---------- Restore login after page reload ----------
async function restoreSession() {
  const accessToken = sessionStorage.getItem("accessToken");

  if (!accessToken) {
    renderAll();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/my_profile`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error("Session expired");
    }

    currentUser = await response.json();

    renderAll();

  } catch (error) {
    console.error("Session restore error:", error);
    sessionStorage.removeItem("accessToken");
    currentUser = null;
    renderAll();
  }
}








// ---------- Register Frontend to Backend Connection ----------
registerForm.addEventListener("submit", async( e) => {
  e.preventDefault();
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const plan = registerForm.querySelector('input[name="plan"]:checked').value;

  const userData = {
    username: username,
    email: email,
    password: password,
    membership_type: plan
  };

  try{
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    });
  
  const data = await response.json();
  if (!response.ok){
    alert(data.detail || "Registration failed")
    return;
  }

  const registerMessage = document.getElementById("regMessage");

  registerMessage.classList.add("success-message");


  registerMessage.textContent = "User has been created!";
  


  registerForm.reset();
} catch (error){
  console.error("Registartion error:", error);
  alert("Could not connect to server");
}
});


//---------- schedule ----------------

async function loadClasses() {
  console.log("loadClasses started");
  try {
    const response = await fetch (`${API_URL}/class/get_classes`);

    if (!response.ok){
      throw new Error("Couldnt find class");

    }

    const data = await response.json();
    

    classes = data.map(c => ({

      id: c.id,
      name: c.class_name,
      trainer: `${c.name} ${c.last_name}`,
      type: c.class_name || "General",
      day: c.class_day,
      time: c.start_time,
      endTime: c.end_time,
      capacity: c.capacity || 12,
      booked: Array(c.enrollment_count).fill(null)

    }));

    renderAll();

  } catch (error){
    console.error("Error loading classes:", error);
  }
  
}



// --------- logout ----------
function logout() {
  sessionStorage.removeItem("accessToken");
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

  document.getElementById("Admin")
  .classList.toggle("hidden", !isAdmin());
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

  console.log("currentUser:", currentUser);
  console.log("accountUser:", u);
  console.log("joined date:", u.joined);




  const preview = !currentUser;

  document.getElementById("previewBanner").classList.toggle("hidden", !preview);
  document.getElementById("acctAvatar").textContent = initials(u.username);
  document.getElementById("acctName").textContent = u.username;
  document.getElementById("acctSince").textContent = preview
    ? "Sample data, not a real account"
    : `Member since ${formatDate(u.joined)}`;

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

acctMembership.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (e.target.id !== "planForm" || !currentUser) return;

  if (membershipUpdateInProgress) return;
  membershipUpdateInProgress = true;

  const choice = e.target.querySelector(
    'input[name="acctPlan"]:checked'
  ).value;

  const renewal = choice === currentUser.membership;

  const accessToken = sessionStorage.getItem("accessToken");

  try {
    const response = await fetch(`${API_URL}/user/update_membership`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        membership_type: choice
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Membership update failed");
    }

    currentUser.membership = data.membership_type;
    currentUser.startedOn = data.start_date;
    currentUser.expiresOn = data.end_date;

    planChoice = null;

    membershipNotice = `${renewal ? "Renewed" : "Switched to"} ${choice}. Your plan now runs until ${formatDate(currentUser.expiresOn)}.`;

    renderAll();

  } catch (error) {
    console.error("Membership update failed:", error);
    membershipNotice = error.message;
    renderAll();
  }
  finally{
    membershipUpdateInProgress = false;
  }
});

function renderMyBookings(u, preview) {
  const wrap = document.getElementById("myBookings");
  const mine = classes.filter(c => u.bookings.some(b => b.class_id === c.id));

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
      <button class="btn btn--danger btn--small" data-cancel="${u.bookings.find(b => b.class_id === c.id).enrollment_id}"${preview ? " disabled" : ""}>Cancel</button>
    </div>
  `).join("");

  wrap.querySelectorAll("[data-cancel]").forEach(btn => {
    btn.addEventListener("click", () => cancelBooking(Number(btn.dataset.cancel)));
  });
}



// ----------------- Profile details -------------------------
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();


  if (!currentUser) return;

  const usernameInput = document.getElementById("profUsername");
  const emailInput = document.getElementById("profEmail");
  const passwordInput = document.getElementById("profPassword");
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  const fail = (msg) => {
    profileStatus.textContent = msg;
    profileStatus.className = "form__status form__status--error";
  };

  if (!username) return fail("Enter a username.");
  if (!email) return fail("Enter an email.");

  const accessToken = sessionStorage.getItem("accessToken");

  try{
    const response = await fetch(`${API_URL}/auth/update_profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        username: username,
        email: email,
        ...(password ? { password: password } : {})
      })
    });
    const data = await response.json();

    if (!response.ok){
      return fail(data.detail || "Could not update profile");
    }

    currentUser.username = username;
    currentUser.email = email;
    passwordInput.value = "";

    profileStatus.textContent = "Changes saved.";
    profileStatus.className = "form__status";

    renderAll();

  } catch (error){
    console.error("Update error", error);
    fail("could not connect to server");
  }

  
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

  const normalizeDay = d =>
  d.trim().toLowerCase().replace(/\./g, "").slice(0, 3);

  const filtered = classes.filter(c => {
  const matchesSearch =
    c.name.toLowerCase().includes(search) ||
    c.trainer.toLowerCase().includes(search);

  const matchesDay = !day || c.day
    .split(/\s*(?:&|and|,)\s*/i)
    .some(d => normalizeDay(d) === normalizeDay(day));

  const matchesType = !type || c.type === type;

  return matchesSearch && matchesDay && matchesType;
});





  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No classes match those filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const spotsLeft = c.capacity - c.booked.length;
    const isBooked = currentUser &&
    currentUser.bookings.some(b => b.class_id === c.id);
    const isFull = spotsLeft <= 0;

    let spotsClass = "";
    if (isFull) spotsClass = "spots-full";
    else if (spotsLeft <= 3) spotsClass = "spots-low";

    let actionBtn;
    if (!currentUser) {
      actionBtn = `<button class="btn btn--ghost btn--small" disabled>Log in to book</button>`;
    } else if (isBooked) {
      const booking = currentUser.bookings.find(b => b.class_id === c.id);
      actionBtn = `<button class="btn btn--danger btn--small" data-cancel-row="${booking.enrollment_id}">Unenroll</button>`;
    } else if (isFull) {
      actionBtn = `<button class="btn btn--ghost btn--small" disabled>Full</button>`;
    } else if (!isActive(currentUser)) {
      actionBtn = `<button class="btn btn--ghost btn--small" data-switch-plan="${currentUser.membership}">Renew to book</button>`;
    } else {
      actionBtn = `<button class="btn btn--primary btn--small" data-book="${c.id}">Enroll</button>`;
    }
    
    const deleteButton = isAdmin()
    ? `<button class="btn btn--danger btn--small" data-delete-class="${c.id}">Delete</button>`:"";

    return `
      <tr>
        <td><strong>${escapeHtml(c.name)}</strong><div class="muted">${escapeHtml(c.type)}</div></td>
        <td>${escapeHtml(c.trainer)}</td>
        <td>${escapeHtml(c.day)} · ${escapeHtml(c.time)}</td>
        <td class="${spotsClass}">${isFull ? "Full" : `${spotsLeft} left`}</td>
        <td>
          <div class="schedAct">
          ${actionBtn}
          ${deleteButton}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-book]").forEach(btn => {
    btn.addEventListener("click", () => bookClass(Number(btn.dataset.book)));
  });
  tbody.querySelectorAll("[data-cancel-row]").forEach(btn => {
    btn.addEventListener("click", () => cancelBooking(Number(btn.dataset.cancelRow)));
  });

  tbody.querySelectorAll("[data-delete-class").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteClass(Number(btn.dataset.deleteClass));
    });
  });
}



// ------------ Admin schedule --------------
async function loadInstructors() {
    const instructorSelect = document.getElementById("Instructor");
    const instructorSelectDelete = document.getElementById("Instructor_delete");

    try {
        const response = await fetch(`${API_URL}/instructor/all_instructor`);

        if (!response.ok) {
            throw new Error("Couldnt load instructors");
        }

        const instructors = await response.json();

        instructorSelect.innerHTML =
            '<option value="">Select an instructor</option>';

        instructorSelectDelete.innerHTML =
            '<option value="">Select an instructor</option>';

        instructors.forEach(instructor => {
            const option = document.createElement("option");

            option.value = instructor.id;
            option.textContent =
                `${instructor.name} ${instructor.last_name}`;

            instructorSelect.appendChild(option);

            instructorSelectDelete.appendChild(option.cloneNode(true));

        });

    } catch (error) {
        console.error("Error loading instructors:", error);
    }
} 

async function addClass(event) {
    event.preventDefault();

    const className = document.getElementById("className").value.trim();
    const instructorId = document.getElementById("Instructor").value;
    const classDay = document.getElementById("classDay").value.trim();
    const startTime = document.getElementById("classStartTime").value;
    const endTime = document.getElementById("classEndTime").value;

    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
        alert("log in first.");
        return;
    }

    if (!classDay) {
        alert("Enter the class days.");
        return;
    }

    if (endTime <= startTime) {
        alert("cant end befpre it starts");
        return;
    }

    const newClass = {
        class_name: className,
        instructor_id: Number(instructorId),
        class_day: classDay,
        start_time: startTime,
        end_time: endTime
    };

    try {
        const response = await fetch(`${API_URL}/class/post_class`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify(newClass)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Failed to create class.");
        }

        alert("Class added successfully!");

        document.getElementById("addClassForm").reset();

        await loadClasses();
        renderAll();

    } catch (error) {
        console.error("Error adding class:", error);
        alert(error.message);
    }
}



async function deleteClass(classId) {
  if (!isAdmin()) return;

  const confirmed = confirm("do you want to delete?");
  if (!confirmed) return;

  const accessToken = sessionStorage.getItem("accessToken");

  try {
    const response = await fetch(
      `${API_URL}/class/delete_class/${classId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data.detail));
    }

    // Remove from frontend
    classes = classes.filter(c => c.id !== classId);

    renderAll();

  } catch (error) {
    console.error("Delete class error:", error);
    alert(error.message);
  }
}

// -------- add Instructor -----------
document.getElementById("addInstructor").addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("InstName").value;
  const last_name = document.getElementById("InstLastName").value;

  const accessToken = sessionStorage.getItem("accessToken");

  try {
    const response = await fetch(`${API_URL}/instructor/add_instructor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: name,
        last_name: last_name
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data.detail));
    }

    alert("Instructor added successfully!");

    document.getElementById("addInstructor").reset();

  } catch (error) {
    console.error("Add instructor error:", error);
    alert(error.message);
  }
});

// ------------- Delete Instructor --------- 

document.getElementById("DelInstructor").addEventListener("submit", async (event) => {
    event.preventDefault();

    const instructorId = document.getElementById("Instructor_delete").value;
    const accessToken = sessionStorage.getItem("accessToken");

    if (!instructorId) {
        alert("Please select an instructor.");
        return;
    }

    if (!confirm("Are you sure you want to delete this instructor?")) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/instructor/delete_instructor/${instructorId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Could not delete instructor.");
        }

        alert("Instructor deleted successfully!");

        document.getElementById("DelInstructor").reset();

        // Refresh both instructor dropdowns
        await loadInstructors();

    } catch (error) {
        console.error("Delete instructor error:", error);
        alert(error.message);
    }
});


// ---------- Booking logic ----------
async function bookClass(classId) {
  if (!currentUser) return;

  const cls = classes.find(c => c.id === classId);
  if (!cls) return;

  // Check if the user's membership is active
  if (!isActive(currentUser)) {
    alert("Your membership has expired. Renew it on your account page to book classes.");
    return;
  }

  // Check if the class is full
  if (cls.booked.length >= cls.capacity) {
    alert("This class just filled up.");
    renderSchedule();
    return;
  }

  // Get the JWT token saved during login
  const accessToken = sessionStorage.getItem("accessToken");

  if (!accessToken) {
    alert("Please log in before enrolling.");
    return;
  }

  try {
    // Send enrollment request to FastAPI
    const response = await fetch(`${API_URL}/enrollment/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        class_id: classId
      })
    });

    const data = await response.json();

    // Handle errors returned by the backend
    if (!response.ok) {
      alert(data.detail || "Could not enroll in this class.");
      return;
    }

    // Update the frontend after successful enrollment
    if (!Array.isArray(currentUser.bookings)) {
      currentUser.bookings = [];
    }

    cls.booked.push(currentUser.id);

    currentUser.bookings.push({
    class_id: classId,
    enrollment_id: data.id
    });

    alert("Successfully enrolled in class!");

    renderAll();

  } catch (error) {
    console.error("Enrollment error:", error);
    alert("Could not connect to the server.");
  }
}


// ------- unenroll --------

async function cancelBooking(enrollment_id) {
  if (!currentUser) return;

  const accessToken = sessionStorage.getItem("accessToken");

  if (!accessToken) {
    alert("Please log in again");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/enrollment/${enrollment_id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      const data = await response.json();
      alert(data.detail || "Failed to unenroll from this class.");
      return;
    }

    // Refresh user
    const profileResponse = await fetch(`${API_URL}/auth/my_profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!profileResponse.ok) {
      throw new Error("Could not refresh user profile.");
    }

    currentUser = await profileResponse.json();

    await loadClasses();
    renderAll();

  } catch (error) {
    console.error("Unenrollment error:", error);
  }
}


// ---------- Filters ----------
document.getElementById("filterSearch").addEventListener("input", renderSchedule);

["filterDay", "filterType"].forEach(id => {
  document.getElementById(id).addEventListener("change", renderSchedule);
});

document.getElementById("addClassForm").addEventListener("submit", addClass);

// ---------- Init ----------
loadClasses();
restoreSession();
setHeroSlide(0);
startHeroTimer();
loadInstructors();
