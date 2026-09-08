import { STATE_WISE_CITIES, STATES_OBJECT } from "indian-states-cities-list";

const FIXED_OPTIONS = [
  { city: "Remote", state: "", label: "Remote", isFixed: true },
  { city: "Work From Home", state: "", label: "Work From Home", isFixed: true },
  { city: "Anywhere in India", state: "", label: "Anywhere in India", isFixed: true },
];

let _citiesCache = null;

function buildStateNameMap() {
  const map = {};
  STATES_OBJECT.forEach((s) => {
    map[s.name] = s.label;
  });
  return map;
}

const _stateNameMap = buildStateNameMap();

function formatStateName(key) {
  return _stateNameMap[key] || key;
}

export function loadAllCities() {
  if (_citiesCache) return _citiesCache;

  const seen = new Set();
  const cities = [];

  Object.entries(STATE_WISE_CITIES).forEach(([stateKey, cityList]) => {
    const stateName = formatStateName(stateKey);
    cityList.forEach((c) => {
      const cityName = (c.value || c.label || "").trim();
      if (!cityName) return;
      const dedupeKey = `${cityName}|${stateName}`.toLowerCase();
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      cities.push({ city: cityName, state: stateName });
    });
  });

  cities.sort((a, b) => a.city.localeCompare(b.city));

  _citiesCache = cities;
  return _citiesCache;
}

export function searchCities(query) {
  const term = (query || "").trim().toLowerCase();
  if (!term) return FIXED_OPTIONS;

  const allCities = loadAllCities();
  const matched = [];

  for (let i = 0; i < allCities.length; i++) {
    const c = allCities[i];
    const cityLower = c.city.toLowerCase();
    const stateLower = c.state.toLowerCase();
    const fullLower = `${c.city}, ${c.state}`.toLowerCase();

    if (
      cityLower.startsWith(term) ||
      cityLower.includes(term) ||
      stateLower.startsWith(term) ||
      stateLower.includes(term) ||
      fullLower.includes(term)
    ) {
      matched.push({ ...c, label: `${c.city}, ${c.state}` });
      if (matched.length >= 10) break;
    }
  }

  return [...FIXED_OPTIONS, ...matched];
}

export function highlightMatch(text, query) {
  if (!query) return text;
  const term = query.trim().toLowerCase();
  if (!term) return text;

  const idx = text.toLowerCase().indexOf(term);
  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + term.length);
  const after = text.slice(idx + term.length);

  return (
    <>
      {before}
      <mark style={{ background: "#fef08a", borderRadius: "2px", padding: "0 1px" }}>{match}</mark>
      {after}
    </>
  );
}

export function getCityByValue(value) {
  const allCities = loadAllCities();
  const term = (value || "").trim().toLowerCase();

  const fixed = FIXED_OPTIONS.find(
    (f) => f.city.toLowerCase() === term
  );
  if (fixed) return fixed;

  const found = allCities.find(
    (c) =>
      c.city.toLowerCase() === term ||
      `${c.city}, ${c.state}`.toLowerCase() === term
  );
  if (found) return { ...found, label: `${found.city}, ${found.state}` };

  return null;
}
