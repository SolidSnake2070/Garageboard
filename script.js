const STORAGE_KEY = "garage-panel-top-end-v6";
const CURRENT_DATA_VERSION = 6;

const defaultState = {
  version: CURRENT_DATA_VERSION,
  bikes: [
    {
      id: crypto.randomUUID(),
      category: "motocross",
      name: "KX250F",
      brand: "Kawasaki",
      year: 2009,
      type: "MOTOCROSS / HOURS",
      unit: "h",
      current: 72,
      notes: "",
      quickAdds: [0.5, 1, 2, 5],
      reference: {
        engineType: "4T",
        displacement: "250 ccm",
        oilType: "",
        oilAmount: "",
        filterPart: "",
        importantNotes: ""
      },
      serviceTemplates: [
        { key: "oil", name: "Ölwechsel", interval: 5, lastDoneAt: 72, warnBefore: 2 },
        { key: "valves", name: "Ventilspiel", interval: 20, lastDoneAt: 60, warnBefore: 3 },
        { key: "timing", name: "Steuerkette prüfen", interval: 20, lastDoneAt: 60, warnBefore: 3 },
        { key: "piston", name: "Kolben", interval: 80, lastDoneAt: 0, warnBefore: 5 },
        { key: "airfilter", name: "Luftfilter", interval: 1, lastDoneAt: 72, warnBefore: 0.5 }
      ],
      history: [
        {
          id: crypto.randomUUID(),
          date: "2026-03-06",
          kind: "planned",
          serviceKey: "oil",
          serviceName: "Ölwechsel",
          value: 72,
          note: "Motul 300V 15W60 + Filter"
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      category: "motocross",
      name: "KX85",
      brand: "Kawasaki",
      year: 2017,
      type: "MOTOCROSS / HOURS",
      unit: "h",
      current: 20.4,
      notes: "",
      quickAdds: [0.5, 1, 2, 5],
      reference: {
        engineType: "2T",
        displacement: "85 ccm",
        oilType: "",
        oilAmount: "",
        filterPart: "",
        importantNotes: ""
      },
      serviceTemplates: [
        { key: "gearoil", name: "Getriebeöl", interval: 5, lastDoneAt: 20.4, warnBefore: 1.5 },
        { key: "piston", name: "Kolben", interval: 40, lastDoneAt: 0, warnBefore: 5 },
        { key: "airfilter", name: "Luftfilter", interval: 1, lastDoneAt: 20.4, warnBefore: 0.5 }
      ],
      history: []
    },
    {
      id: crypto.randomUUID(),
      category: "motorcycle",
      name: "KTM 690 SMC",
      brand: "KTM",
      year: 2008,
      type: "STREET / KILOMETERS",
      unit: "km",
      current: 46799,
      notes: "",
      quickAdds: [100, 250, 500, 1000],
      reference: {
        engineType: "4T",
        displacement: "654 ccm",
        oilType: "",
        oilAmount: "",
        filterPart: "",
        importantNotes: ""
      },
      serviceTemplates: [
        { key: "oil", name: "Ölwechsel", interval: 5000, lastDoneAt: 45000, warnBefore: 1000 },
        { key: "valves", name: "Ventilspiel", interval: 10000, lastDoneAt: 40000, warnBefore: 1000 },
        { key: "chain", name: "Kettensatz prüfen", interval: 1000, lastDoneAt: 46000, warnBefore: 300 }
      ],
      history: []
    }
  ]
};

let state = loadState();
let selectedBikeId = null;
let editIntervalContext = { bikeId: null, serviceKey: null };

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function getCategoryLabel(category) {
  const map = {
    motocross: "Motocross",
    motorcycle: "Motorrad",
    quad: "Quad",
    car: "Auto",
    custom: "Freies Fahrzeug"
  };
  return map[category] || "Fahrzeug";
}

function getCategoryDefaults(category) {
  const defaults = {
    motocross: {
      type: "MOTOCROSS / HOURS",
      unit: "h",
      quickAdds: [0.5, 1, 2, 5],
      serviceTemplates: [
        { key: "oil", name: "Ölwechsel", interval: 5, lastDoneAt: 0, warnBefore: 2 },
        { key: "airfilter", name: "Luftfilter", interval: 1, lastDoneAt: 0, warnBefore: 0.5 },
        { key: "valves", name: "Ventilspiel", interval: 20, lastDoneAt: 0, warnBefore: 3 }
      ]
    },
    motorcycle: {
      type: "STREET / KILOMETERS",
      unit: "km",
      quickAdds: [100, 250, 500, 1000],
      serviceTemplates: [
        { key: "oil", name: "Ölwechsel", interval: 5000, lastDoneAt: 0, warnBefore: 1000 },
        { key: "brakefluid", name: "Bremsflüssigkeit", interval: 12000, lastDoneAt: 0, warnBefore: 2000 },
        { key: "chain", name: "Kettensatz prüfen", interval: 1000, lastDoneAt: 0, warnBefore: 300 }
      ]
    },
    quad: {
      type: "QUAD / KILOMETERS",
      unit: "km",
      quickAdds: [50, 100, 250, 500],
      serviceTemplates: [
        { key: "oil", name: "Ölwechsel", interval: 3000, lastDoneAt: 0, warnBefore: 500 },
        { key: "airfilter", name: "Luftfilter", interval: 1000, lastDoneAt: 0, warnBefore: 200 },
        { key: "drive", name: "Antrieb prüfen", interval: 1500, lastDoneAt: 0, warnBefore: 300 }
      ]
    },
    car: {
      type: "AUTO / KILOMETERS",
      unit: "km",
      quickAdds: [100, 500, 1000, 5000],
      serviceTemplates: [
        { key: "oil", name: "Ölwechsel", interval: 15000, lastDoneAt: 0, warnBefore: 2000 },
        { key: "inspection", name: "Inspektion", interval: 30000, lastDoneAt: 0, warnBefore: 3000 },
        { key: "brakefluid", name: "Bremsflüssigkeit", interval: 30000, lastDoneAt: 0, warnBefore: 3000 }
      ]
    },
    custom: {
      type: "CUSTOM / KILOMETERS",
      unit: "km",
      quickAdds: [100, 500, 1000],
      serviceTemplates: []
    }
  };

  return deepClone(defaults[category] || defaults.custom);
}

function migrateState(loadedState) {
  const migrated = deepClone(loadedState);

  if (!migrated.version) migrated.version = 1;
  if (!Array.isArray(migrated.bikes)) migrated.bikes = [];

  migrated.bikes.forEach((bike) => {
    if (!bike.category) bike.category = bike.unit === "h" ? "motocross" : "motorcycle";

    if (!bike.reference) {
      bike.reference = {
        engineType: "",
        displacement: "",
        oilType: "",
        oilAmount: "",
        filterPart: "",
        importantNotes: ""
      };
    }

    if (!bike.quickAdds || !Array.isArray(bike.quickAdds)) {
      bike.quickAdds = bike.unit === "h" ? [0.5, 1, 2, 5] : [100, 250, 500, 1000];
    }

    if (!bike.history) bike.history = [];
    if (!bike.serviceTemplates) bike.serviceTemplates = [];
    if (!bike.notes) bike.notes = "";
  });

  migrated.version = CURRENT_DATA_VERSION;
  return migrated;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return deepClone(defaultState);

  try {
    return migrateState(JSON.parse(raw));
  } catch {
    return deepClone(defaultState);
  }
}

function saveState() {
  state.version = CURRENT_DATA_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function findBike(id) {
  return state.bikes.find(b => b.id === id);
}

function findTemplate(bike, key) {
  return bike.serviceTemplates.find(t => t.key === key);
}

function formatValue(value, unit) {
  if (unit === "km") {
    return `${new Intl.NumberFormat("de-DE").format(value)} km`;
  }

  return `${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value)} h`;
}

function getTemplateNextDue(template) {
  return template.lastDoneAt + template.interval;
}

function getServiceState(current, template) {
  const dueAt = getTemplateNextDue(template);
  if (current >= dueAt) return "due";
  if (current >= dueAt - template.warnBefore) return "warn";
  return "ok";
}

function getOverallBikeState(bike) {
  if (!bike.serviceTemplates.length) return "ok";

  const states = bike.serviceTemplates.map(t => getServiceState(bike.current, t));
  if (states.includes("due")) return "due";
  if (states.includes("warn")) return "warn";
  return "ok";
}

function stateLabel(status) {
  return status === "due" ? "FÄLLIG" : status === "warn" ? "BALD" : "OK";
}

function getNearestService(bike) {
  if (!bike.serviceTemplates.length) return null;

  const enriched = bike.serviceTemplates.map(template => {
    const dueAt = getTemplateNextDue(template);
    return {
      ...template,
      dueAt,
      remaining: dueAt - bike.current
    };
  });

  enriched.sort((a, b) => a.remaining - b.remaining);
  return enriched[0];
}

function clearErrors(ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("field-error");
  });
}

function markFieldError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("field-error");
}

function showFeedback(boxId, message) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = message;
  box.classList.remove("hidden");
}

function clearFeedback(boxId, fieldIds = []) {
  const box = document.getElementById(boxId);
  if (box) {
    box.textContent = "";
    box.classList.add("hidden");
  }
  clearErrors(fieldIds);
}

function renderPriorities() {
  const container = document.getElementById("priorityList");
  container.innerHTML = "";

  const items = state.bikes
    .map(bike => {
      const nearest = getNearestService(bike);
      if (!nearest) return null;
      return {
        bike,
        nearest,
        status: getServiceState(bike.current, nearest),
        remaining: nearest.dueAt - bike.current
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 4);

  if (!items.length) {
    container.innerHTML = `<div class="empty-state">Keine Punkte vorhanden.</div>`;
    return;
  }

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "priority-item";
    div.innerHTML = `
      <strong>${item.bike.name}</strong><br>
      ${item.nearest.name} bei ${formatValue(item.nearest.dueAt, item.bike.unit)} · ${stateLabel(item.status)}
    `;
    container.appendChild(div);
  });
}

function renderDashboard() {
  const grid = document.getElementById("dashboardGrid");
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  grid.innerHTML = "";

  const bikes = state.bikes.filter(b =>
    [b.name, b.brand, String(b.year), b.type, getCategoryLabel(b.category)]
      .join(" ")
      .toLowerCase()
      .includes(query)
  );

  if (!bikes.length) {
    grid.innerHTML = `<div class="empty-state">Keine Fahrzeuge gefunden.</div>`;
    return;
  }

  bikes.forEach(bike => {
    const status = getOverallBikeState(bike);
    const nearest = getNearestService(bike);

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-head">
        <div>
          <div class="card-type">${bike.type}</div>
          <h3 class="card-title">${bike.name}</h3>
        </div>
        <div class="status-badge status-${status}">${stateLabel(status)}</div>
      </div>

      <div class="main-metric">
        <div class="metric-value">${
          bike.unit === "km"
            ? new Intl.NumberFormat("de-DE").format(bike.current)
            : new Intl.NumberFormat("de-DE", {
                minimumFractionDigits: bike.current % 1 === 0 ? 0 : 1,
                maximumFractionDigits: 1
              }).format(bike.current)
        }</div>
        <div class="metric-unit">${bike.unit}</div>
      </div>

      <div class="next-service">
        <strong>${getCategoryLabel(bike.category)}</strong><br>
        ${
          nearest
            ? `Nächster Punkt: <strong>${nearest.name}</strong><br>Fällig bei <strong>${formatValue(nearest.dueAt, bike.unit)}</strong>`
            : `Keine Intervalle definiert`
        }
      </div>
    `;

    card.addEventListener("click", () => {
      selectedBikeId = bike.id;
      renderDetail();
    });

    grid.appendChild(card);
  });
}

function renderQuickButtons(bike) {
  const container = document.getElementById("quickButtons");
  container.innerHTML = "";

  bike.quickAdds.forEach(step => {
    const btn = document.createElement("button");
    btn.className = "quick-btn";
    btn.type = "button";
    btn.textContent = `+${String(step).replace(".", ",")} ${bike.unit}`;
    btn.addEventListener("click", () => {
      const input = document.getElementById("currentValueInput");
      input.value = Number(input.value || 0) + step;
    });
    container.appendChild(btn);
  });
}

function renderIntervals(bike) {
  const list = document.getElementById("intervalList");
  list.innerHTML = "";

  if (!bike.serviceTemplates.length) {
    list.innerHTML = `<div class="empty-state">Keine Intervalle vorhanden.</div>`;
    return;
  }

  bike.serviceTemplates.forEach(template => {
    const dueAt = getTemplateNextDue(template);
    const serviceStatus = getServiceState(bike.current, template);

    const row = document.createElement("div");
    row.className = "interval-row";
    row.innerHTML = `
      <div>
        <div class="interval-name">${template.name}</div>
        <div class="interval-meta">Intervall: ${formatValue(template.interval, bike.unit)}</div>
      </div>
      <div class="interval-meta">
        Zuletzt: ${formatValue(template.lastDoneAt, bike.unit)}<br>
        Nächste Fälligkeit: ${formatValue(dueAt, bike.unit)}<br>
        <span class="interval-state ${serviceStatus}">${stateLabel(serviceStatus)}</span>
      </div>
      <div class="interval-actions">
        <button class="icon-btn edit-interval-btn" data-key="${template.key}" type="button" title="Intervall bearbeiten">✎</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll(".edit-interval-btn").forEach((btn) => {
    btn.addEventListener("click", () => openEditIntervalModal(btn.dataset.key));
  });
}

function renderHistory(bike) {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  if (!bike.history.length) {
    list.innerHTML = `<div class="empty-state">Noch keine Einträge vorhanden.</div>`;
    return;
  }

  const sorted = [...bike.history].sort((a, b) => {
    if (a.date === b.date) return b.value - a.value;
    return a.date < b.date ? 1 : -1;
  });

  sorted.forEach(entry => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <div class="history-top">
        <div class="history-name">${entry.serviceName}</div>
        <div class="history-date">${entry.date || "-"}</div>
      </div>
      <div class="history-stand">Stand: ${formatValue(entry.value, bike.unit)} · ${entry.kind === "planned" ? "geplant" : "frei"}</div>
      <div class="history-note">${entry.note ? entry.note : "<span class='empty-state'>Keine Notiz</span>"}</div>
    `;
    list.appendChild(row);
  });
}

function populateServiceSelect(bike) {
  const select = document.getElementById("serviceTypeSelect");
  const options = bike.serviceTemplates.length
    ? bike.serviceTemplates.map(t => `<option value="${t.key}">${t.name}</option>`).join("")
    : "";

  select.innerHTML = `<option value="">Vorlage wählen</option>${options}`;
}

function renderReference(bike) {
  document.getElementById("refEngineType").value = bike.reference?.engineType || "";
  document.getElementById("refDisplacement").value = bike.reference?.displacement || "";
  document.getElementById("refOilType").value = bike.reference?.oilType || "";
  document.getElementById("refOilAmount").value = bike.reference?.oilAmount || "";
  document.getElementById("refFilterPart").value = bike.reference?.filterPart || "";
  document.getElementById("refImportantNotes").value = bike.reference?.importantNotes || "";
}

function renderDetail() {
  const panel = document.getElementById("detailPanel");

  if (!selectedBikeId) {
    panel.classList.add("hidden");
    return;
  }

  const bike = findBike(selectedBikeId);
  if (!bike) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");

  document.getElementById("detailType").textContent = bike.type;
  document.getElementById("detailTitle").textContent = bike.name;
  document.getElementById("detailMeta").textContent = `${bike.brand} · Baujahr ${bike.year} · ${getCategoryLabel(bike.category)}`;
  document.getElementById("currentValueInput").value = bike.current;
  document.getElementById("notesInput").value = bike.notes || "";
  document.getElementById("serviceValueInput").value = bike.current;
  document.getElementById("serviceDateInput").value = todayString();
  document.getElementById("serviceNoteInput").value = "";

  populateServiceSelect(bike);
  renderQuickButtons(bike);
  renderIntervals(bike);
  renderHistory(bike);
  renderReference(bike);
}

function saveCurrentValue() {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  const value = Number(document.getElementById("currentValueInput").value);
  if (Number.isNaN(value)) return;

  bike.current = value;
  saveState();
  renderAll();
}

function saveNotes() {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  bike.notes = document.getElementById("notesInput").value.trim();
  saveState();
  renderAll();
}

function saveReference() {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  bike.reference = {
    engineType: document.getElementById("refEngineType").value.trim(),
    displacement: document.getElementById("refDisplacement").value.trim(),
    oilType: document.getElementById("refOilType").value.trim(),
    oilAmount: document.getElementById("refOilAmount").value.trim(),
    filterPart: document.getElementById("refFilterPart").value.trim(),
    importantNotes: document.getElementById("refImportantNotes").value.trim()
  };

  saveState();
  renderAll();
}

function logPlannedService() {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  const selectedKey = document.getElementById("serviceTypeSelect").value;
  const value = Number(document.getElementById("serviceValueInput").value);
  const date = document.getElementById("serviceDateInput").value || todayString();
  const note = document.getElementById("serviceNoteInput").value.trim();

  if (!selectedKey) {
    alert("Bitte zuerst eine Wartungsvorlage wählen.");
    return;
  }

  if (Number.isNaN(value)) {
    alert("Bitte einen gültigen Stand eingeben.");
    return;
  }

  const template = findTemplate(bike, selectedKey);
  if (!template) return;

  template.lastDoneAt = value;

  bike.history.push({
    id: crypto.randomUUID(),
    date,
    kind: "planned",
    serviceKey: selectedKey,
    serviceName: template.name,
    value,
    note
  });

  bike.current = Math.max(bike.current, value);
  document.getElementById("serviceNoteInput").value = "";

  saveState();
  renderAll();
}

function openAddBikeModal() {
  clearFeedback("newBikeFeedback", ["newBikeName", "newBikeBrand", "newBikeYear", "newBikeCurrent"]);
  document.getElementById("addBikeModal").classList.remove("hidden");
}

function closeAddBikeModal() {
  clearFeedback("newBikeFeedback", ["newBikeName", "newBikeBrand", "newBikeYear", "newBikeCurrent"]);
  document.getElementById("addBikeModal").classList.add("hidden");
}

function createBike() {
  clearFeedback("newBikeFeedback", ["newBikeName", "newBikeBrand", "newBikeYear", "newBikeCurrent"]);

  const name = document.getElementById("newBikeName").value.trim();
  const brand = document.getElementById("newBikeBrand").value.trim();
  const yearRaw = document.getElementById("newBikeYear").value.trim();
  const category = document.getElementById("newBikeCategory").value;
  const manualType = document.getElementById("newBikeType").value.trim();
  const manualUnit = document.getElementById("newBikeUnit").value;
  const currentRaw = document.getElementById("newBikeCurrent").value.trim();

  const year = Number(yearRaw);
  const current = Number(currentRaw);

  const missing = [];

  if (!name) {
    missing.push("Name");
    markFieldError("newBikeName");
  }
  if (!brand) {
    missing.push("Hersteller");
    markFieldError("newBikeBrand");
  }
  if (!yearRaw || Number.isNaN(year)) {
    missing.push("Baujahr");
    markFieldError("newBikeYear");
  }
  if (!currentRaw || Number.isNaN(current)) {
    missing.push("aktueller Stand");
    markFieldError("newBikeCurrent");
  }

  if (missing.length) {
    showFeedback("newBikeFeedback", `Bitte ausfüllen oder korrigieren: ${missing.join(", ")}.`);
    return;
  }

  const defaults = getCategoryDefaults(category);
  const type = manualType || defaults.type;
  const unit = manualUnit || defaults.unit;

  const bike = {
    id: crypto.randomUUID(),
    category,
    name,
    brand,
    year,
    type,
    unit,
    current,
    notes: "",
    quickAdds: defaults.quickAdds,
    reference: {
      engineType: "",
      displacement: "",
      oilType: "",
      oilAmount: "",
      filterPart: "",
      importantNotes: ""
    },
    serviceTemplates: defaults.serviceTemplates.map(t => ({
      ...t,
      lastDoneAt: current
    })),
    history: []
  };

  state.bikes.push(bike);
  selectedBikeId = bike.id;
  saveState();
  renderAll();
  closeAddBikeModal();

  document.getElementById("newBikeName").value = "";
  document.getElementById("newBikeBrand").value = "";
  document.getElementById("newBikeYear").value = "";
  document.getElementById("newBikeType").value = "";
  document.getElementById("newBikeCurrent").value = "";
  document.getElementById("newBikeCategory").value = "motocross";
  document.getElementById("newBikeUnit").value = "h";
}

function deleteSelectedBike() {
  const bike = findBike(selectedBikeId);
  if (!bike) {
    alert("Kein Fahrzeug ausgewählt.");
    return;
  }

  const confirmed = window.confirm(`"${bike.name}" wirklich löschen?`);
  if (!confirmed) return;

  state.bikes = state.bikes.filter(b => b.id !== selectedBikeId);
  selectedBikeId = null;
  saveState();
  renderAll();
}

function openResearchModal() {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  document.getElementById("researchTitle").textContent = `Research: ${bike.name} (${bike.year})`;
  document.getElementById("researchQueryInput").value = "";
  document.getElementById("researchModal").classList.remove("hidden");
}

function closeResearchModal() {
  document.getElementById("researchModal").classList.add("hidden");
}

function buildResearchBase(bike) {
  return `${bike.brand} ${bike.name} ${bike.year}`.trim();
}

function openResearchQuery(suffix) {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  const base = buildResearchBase(bike);
  const query = encodeURIComponent(`${base} ${suffix}`);
  window.open(`https://www.google.com/search?q=${query}`, "_blank");
}

function runCustomResearch() {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  const queryText = document.getElementById("researchQueryInput").value.trim();
  if (!queryText) return;

  openResearchQuery(queryText);
}

function openCustomServiceModal() {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  clearFeedback("customServiceFeedback", ["customServiceName", "customServiceValue"]);
  document.getElementById("customServiceName").value = "";
  document.getElementById("customServiceDate").value = todayString();
  document.getElementById("customServiceValue").value = bike.current;
  document.getElementById("customServiceNote").value = "";
  document.getElementById("customServiceModal").classList.remove("hidden");
}

function closeCustomServiceModal() {
  clearFeedback("customServiceFeedback", ["customServiceName", "customServiceValue"]);
  document.getElementById("customServiceModal").classList.add("hidden");
}

function saveCustomService() {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  clearFeedback("customServiceFeedback", ["customServiceName", "customServiceValue"]);

  const name = document.getElementById("customServiceName").value.trim();
  const date = document.getElementById("customServiceDate").value || todayString();
  const valueRaw = document.getElementById("customServiceValue").value.trim();
  const note = document.getElementById("customServiceNote").value.trim();
  const value = Number(valueRaw);

  const missing = [];

  if (!name) {
    missing.push("Service-Name");
    markFieldError("customServiceName");
  }

  if (!valueRaw || Number.isNaN(value)) {
    missing.push("Stand");
    markFieldError("customServiceValue");
  }

  if (missing.length) {
    showFeedback("customServiceFeedback", `Bitte ausfüllen oder korrigieren: ${missing.join(", ")}.`);
    return;
  }

  bike.history.push({
    id: crypto.randomUUID(),
    date,
    kind: "custom",
    serviceKey: "",
    serviceName: name,
    value,
    note
  });

  bike.current = Math.max(bike.current, value);

  saveState();
  renderAll();
  closeCustomServiceModal();
}

function openEditIntervalModal(serviceKey) {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  const template = findTemplate(bike, serviceKey);
  if (!template) return;

  clearFeedback("editIntervalFeedback", ["editIntervalName", "editIntervalValue", "editWarnBefore", "editLastDoneAt"]);
  editIntervalContext = { bikeId: bike.id, serviceKey: template.key };

  const unit = bike.unit === "km" ? "km" : "h";
  document.getElementById("labelInterval").textContent = `Intervall (${unit})`;
  document.getElementById("labelWarn").textContent = `Warnung vorher (${unit})`;
  document.getElementById("labelLastDone").textContent = `Zuletzt gemacht bei (${unit})`;

  document.getElementById("editIntervalName").value = template.name;
  document.getElementById("editIntervalValue").value = template.interval;
  document.getElementById("editWarnBefore").value = template.warnBefore;
  document.getElementById("editLastDoneAt").value = template.lastDoneAt;

  document.getElementById("editIntervalModal").classList.remove("hidden");
}

function closeEditIntervalModal() {
  clearFeedback("editIntervalFeedback", ["editIntervalName", "editIntervalValue", "editWarnBefore", "editLastDoneAt"]);
  editIntervalContext = { bikeId: null, serviceKey: null };
  document.getElementById("editIntervalModal").classList.add("hidden");
}

function saveEditedInterval() {
  const bike = findBike(editIntervalContext.bikeId);
  if (!bike) return;

  const template = findTemplate(bike, editIntervalContext.serviceKey);
  if (!template) return;

  clearFeedback("editIntervalFeedback", ["editIntervalName", "editIntervalValue", "editWarnBefore", "editLastDoneAt"]);

  const name = document.getElementById("editIntervalName").value.trim();
  const intervalRaw = document.getElementById("editIntervalValue").value.trim();
  const warnRaw = document.getElementById("editWarnBefore").value.trim();
  const lastDoneRaw = document.getElementById("editLastDoneAt").value.trim();

  const interval = Number(intervalRaw);
  const warnBefore = Number(warnRaw);
  const lastDoneAt = Number(lastDoneRaw);

  const missing = [];

  if (!name) {
    missing.push("Name");
    markFieldError("editIntervalName");
  }
  if (!intervalRaw || Number.isNaN(interval)) {
    missing.push("Intervall");
    markFieldError("editIntervalValue");
  }
  if (!warnRaw || Number.isNaN(warnBefore)) {
    missing.push("Warnung vorher");
    markFieldError("editWarnBefore");
  }
  if (!lastDoneRaw || Number.isNaN(lastDoneAt)) {
    missing.push("Zuletzt gemacht bei");
    markFieldError("editLastDoneAt");
  }

  if (missing.length) {
    showFeedback("editIntervalFeedback", `Bitte ausfüllen oder korrigieren: ${missing.join(", ")}.`);
    return;
  }

  template.name = name;
  template.interval = interval;
  template.warnBefore = warnBefore;
  template.lastDoneAt = lastDoneAt;

  saveState();
  renderAll();
  closeEditIntervalModal();
}

function deleteEditedInterval() {
  const bike = findBike(editIntervalContext.bikeId);
  if (!bike) return;

  const template = findTemplate(bike, editIntervalContext.serviceKey);
  if (!template) return;

  const confirmed = window.confirm(`Intervall "${template.name}" wirklich löschen?`);
  if (!confirmed) return;

  bike.serviceTemplates = bike.serviceTemplates.filter(t => t.key !== template.key);

  saveState();
  renderAll();
  closeEditIntervalModal();
}

function exportJson() {
  state.version = CURRENT_DATA_VERSION;

  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `garage-panel-backup-${todayString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!imported.bikes || !Array.isArray(imported.bikes)) {
        alert("Ungültige Datei.");
        return;
      }

      state = migrateState(imported);
      selectedBikeId = null;
      saveState();
      renderAll();
    } catch {
      alert("Import fehlgeschlagen.");
    }
  };

  reader.readAsText(file);
}

function renderAll() {
  renderPriorities();
  renderDashboard();
  renderDetail();
}

function bindEvents() {
  const searchInput = document.getElementById("searchInput");
  const closeDetailBtn = document.getElementById("closeDetailBtn");
  const deleteBikeBtn = document.getElementById("deleteBikeBtn");
  const saveCurrentBtn = document.getElementById("saveCurrentBtn");
  const saveNotesBtn = document.getElementById("saveNotesBtn");
  const saveReferenceBtn = document.getElementById("saveReferenceBtn");
  const logPlannedBtn = document.getElementById("logPlannedBtn");
  const openCustomServiceBtn = document.getElementById("openCustomServiceBtn");
  const addBikeBtn = document.getElementById("addBikeBtn");
  const closeAddBikeModalBtn = document.getElementById("closeAddBikeModalBtn");
  const saveNewBikeBtn = document.getElementById("saveNewBikeBtn");
  const newBikeCategory = document.getElementById("newBikeCategory");
  const researchBtn = document.getElementById("researchBtn");
  const closeResearchModalBtn = document.getElementById("closeResearchModalBtn");
  const runCustomResearchBtn = document.getElementById("runCustomResearchBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");
  const closeCustomServiceModalBtn = document.getElementById("closeCustomServiceModalBtn");
  const saveCustomServiceBtn = document.getElementById("saveCustomServiceBtn");
  const closeEditIntervalModalBtn = document.getElementById("closeEditIntervalModalBtn");
  const saveEditIntervalBtn = document.getElementById("saveEditIntervalBtn");
  const deleteIntervalBtn = document.getElementById("deleteIntervalBtn");

  if (searchInput) searchInput.addEventListener("input", renderDashboard);

  if (closeDetailBtn) {
    closeDetailBtn.addEventListener("click", () => {
      selectedBikeId = null;
      renderDetail();
    });
  }

  if (deleteBikeBtn) deleteBikeBtn.addEventListener("click", deleteSelectedBike);
  if (saveCurrentBtn) saveCurrentBtn.addEventListener("click", saveCurrentValue);
  if (saveNotesBtn) saveNotesBtn.addEventListener("click", saveNotes);
  if (saveReferenceBtn) saveReferenceBtn.addEventListener("click", saveReference);
  if (logPlannedBtn) logPlannedBtn.addEventListener("click", logPlannedService);
  if (openCustomServiceBtn) openCustomServiceBtn.addEventListener("click", openCustomServiceModal);

  if (addBikeBtn) addBikeBtn.addEventListener("click", openAddBikeModal);
  if (closeAddBikeModalBtn) closeAddBikeModalBtn.addEventListener("click", closeAddBikeModal);
  if (saveNewBikeBtn) saveNewBikeBtn.addEventListener("click", createBike);

  if (newBikeCategory) {
    newBikeCategory.addEventListener("change", (e) => {
      const defaults = getCategoryDefaults(e.target.value);
      const typeField = document.getElementById("newBikeType");
      const unitField = document.getElementById("newBikeUnit");
      if (typeField) typeField.value = defaults.type;
      if (unitField) unitField.value = defaults.unit;
    });
  }

  if (researchBtn) researchBtn.addEventListener("click", openResearchModal);
  if (closeResearchModalBtn) closeResearchModalBtn.addEventListener("click", closeResearchModal);
  if (runCustomResearchBtn) runCustomResearchBtn.addEventListener("click", runCustomResearch);

  document.querySelectorAll(".research-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      const map = {
        manual: "service manual pdf",
        oilamount: "oil capacity",
        oiltype: "oil type viscosity",
        intervals: "maintenance intervals",
        parts: "oil filter air filter part number",
        problems: "common problems weak points"
      };
      openResearchQuery(map[mode] || mode);
    });
  });

  if (exportBtn) exportBtn.addEventListener("click", exportJson);

  if (importInput) {
    importInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) importJson(file);
      e.target.value = "";
    });
  }

  if (closeCustomServiceModalBtn) closeCustomServiceModalBtn.addEventListener("click", closeCustomServiceModal);
  if (saveCustomServiceBtn) saveCustomServiceBtn.addEventListener("click", saveCustomService);

  if (closeEditIntervalModalBtn) closeEditIntervalModalBtn.addEventListener("click", closeEditIntervalModal);
  if (saveEditIntervalBtn) saveEditIntervalBtn.addEventListener("click", saveEditedInterval);
  if (deleteIntervalBtn) deleteIntervalBtn.addEventListener("click", deleteEditedInterval);
}

bindEvents();
renderAll();
