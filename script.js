const STORAGE_KEY = "garage-panel-v2";

const defaultData = {
  bikes: [
    {
      id: "kx250f",
      name: "KX250F",
      brand: "Kawasaki",
      year: 2009,
      type: "MOTOCROSS / HOURS",
      unit: "h",
      current: 72,
      notes: "",
      quickAdds: [0.5, 1, 2, 5],
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
      id: "kx85",
      name: "KX85",
      brand: "Kawasaki",
      year: 2017,
      type: "MOTOCROSS / HOURS",
      unit: "h",
      current: 20.4,
      notes: "",
      quickAdds: [0.5, 1, 2, 5],
      serviceTemplates: [
        { key: "gearoil", name: "Getriebeöl", interval: 5, lastDoneAt: 20.4, warnBefore: 1.5 },
        { key: "piston", name: "Kolben", interval: 40, lastDoneAt: 0, warnBefore: 5 },
        { key: "airfilter", name: "Luftfilter", interval: 1, lastDoneAt: 20.4, warnBefore: 0.5 }
      ],
      history: []
    },
    {
      id: "ktm690",
      name: "KTM 690 SMC",
      brand: "KTM",
      year: 2008,
      type: "STREET / KILOMETERS",
      unit: "km",
      current: 46799,
      notes: "",
      quickAdds: [100, 250, 500, 1000],
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

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return deepClone(defaultData);

  try {
    return JSON.parse(raw);
  } catch {
    return deepClone(defaultData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetDemoData() {
  state = deepClone(defaultData);
  selectedBikeId = null;
  saveState();
  renderAll();
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
  const states = bike.serviceTemplates.map(t => getServiceState(bike.current, t));
  if (states.includes("due")) return "due";
  if (states.includes("warn")) return "warn";
  return "ok";
}

function stateLabel(status) {
  return status === "due" ? "FÄLLIG" : status === "warn" ? "BALD" : "OK";
}

function getNearestService(bike) {
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

function findBike(id) {
  return state.bikes.find(b => b.id === id);
}

function renderDashboard() {
  const grid = document.getElementById("dashboardGrid");
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  grid.innerHTML = "";

  const bikes = state.bikes.filter(b =>
    [b.name, b.brand, String(b.year), b.type].join(" ").toLowerCase().includes(query)
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
        <div class="metric-value">${bike.unit === "km"
          ? new Intl.NumberFormat("de-DE").format(bike.current)
          : new Intl.NumberFormat("de-DE", {
              minimumFractionDigits: bike.current % 1 === 0 ? 0 : 1,
              maximumFractionDigits: 1
            }).format(bike.current)}</div>
        <div class="metric-unit">${bike.unit}</div>
      </div>

      <div class="next-service">
        Nächster Punkt: <strong>${nearest.name}</strong><br>
        Fällig bei <strong>${formatValue(nearest.dueAt, bike.unit)}</strong>
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
        Nächste Fälligkeit: ${formatValue(dueAt, bike.unit)}
      </div>
      <div class="interval-state ${serviceStatus}">${stateLabel(serviceStatus)}</div>
    `;
    list.appendChild(row);
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
  select.innerHTML = bike.serviceTemplates
    .map(t => `<option value="${t.key}">${t.name}</option>`)
    .join("");
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
  document.getElementById("detailMeta").textContent = `${bike.brand} · Baujahr ${bike.year}`;
  document.getElementById("currentValueInput").value = bike.current;
  document.getElementById("notesInput").value = bike.notes || "";
  document.getElementById("serviceValueInput").value = bike.current;
  document.getElementById("serviceDateInput").value = todayString();

  populateServiceSelect(bike);
  renderQuickButtons(bike);
  renderIntervals(bike);
  renderHistory(bike);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
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

function logService(isPlanned) {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  const value = Number(document.getElementById("serviceValueInput").value);
  const date = document.getElementById("serviceDateInput").value || todayString();
  const note = document.getElementById("serviceNoteInput").value.trim();
  const selectedKey = document.getElementById("serviceTypeSelect").value;

  if (Number.isNaN(value)) return;

  let serviceName = "Freie Wartung";

  if (isPlanned) {
    const template = bike.serviceTemplates.find(t => t.key === selectedKey);
    if (!template) return;
    template.lastDoneAt = value;
    serviceName = template.name;
  } else {
    const option = document.getElementById("serviceTypeSelect");
    serviceName = option.options[option.selectedIndex]?.text || "Freie Wartung";
  }

  bike.history.push({
    id: crypto.randomUUID(),
    date,
    kind: isPlanned ? "planned" : "custom",
    serviceKey: selectedKey,
    serviceName,
    value,
    note
  });

  bike.current = Math.max(bike.current, value);

  document.getElementById("serviceNoteInput").value = "";
  saveState();
  renderAll();
}

function exportJson() {
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
      state = imported;
      saveState();
      renderAll();
    } catch {
      alert("Import fehlgeschlagen.");
    }
  };
  reader.readAsText(file);
}

function openResearch() {
  const bike = findBike(selectedBikeId);
  if (!bike) return;

  const query = encodeURIComponent(`${bike.name} ${bike.year} service manual maintenance intervals common problems`);
  window.open(`https://www.google.com/search?q=${query}`, "_blank");
}

function renderAll() {
  renderDashboard();
  renderDetail();
}

function bindEvents() {
  document.getElementById("searchInput").addEventListener("input", renderDashboard);
  document.getElementById("closeDetailBtn").addEventListener("click", () => {
    selectedBikeId = null;
    renderDetail();
  });
  document.getElementById("saveCurrentBtn").addEventListener("click", saveCurrentValue);
  document.getElementById("saveNotesBtn").addEventListener("click", saveNotes);
  document.getElementById("logPlannedBtn").addEventListener("click", () => logService(true));
  document.getElementById("logCustomBtn").addEventListener("click", () => logService(false));
  document.getElementById("researchBtn").addEventListener("click", openResearch);
  document.getElementById("exportBtn").addEventListener("click", exportJson);
  document.getElementById("resetBtn").addEventListener("click", resetDemoData);

  document.getElementById("importInput").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importJson(file);
    e.target.value = "";
  });
}

bindEvents();
renderAll();
