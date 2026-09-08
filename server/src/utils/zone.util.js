const CANONICAL_ZONES = ["North", "South", "East", "West"];

const INDIAN_STATES_BY_ZONE = Object.freeze({
  North: Object.freeze([
    "Chandigarh",
    "Delhi",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Ladakh",
    "Punjab",
    "Rajasthan",
    "Uttar Pradesh",
    "Uttarakhand",
  ]),
  South: Object.freeze([
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Karnataka",
    "Kerala",
    "Lakshadweep",
    "Puducherry",
    "Tamil Nadu",
    "Telangana",
  ]),
  East: Object.freeze([
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Jharkhand",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Sikkim",
    "Tripura",
    "West Bengal",
  ]),
  West: Object.freeze([
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Goa",
    "Gujarat",
    "Madhya Pradesh",
    "Maharashtra",
  ]),
});

const STATE_ALIASES = Object.freeze({
  "nct of delhi": "Delhi",
  "new delhi": "Delhi",
  "j&k": "Jammu and Kashmir",
  "jammu & kashmir": "Jammu and Kashmir",
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
  "dadra & nagar haveli and daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra and nagar haveli & daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "pondicherry": "Puducherry",
  "orissa": "Odisha",
  "uttaranchal": "Uttarakhand",
  telengana: "Telangana",
});

const STATE_LOOKUP = new Map(
  Object.values(INDIAN_STATES_BY_ZONE)
    .flat()
    .map((state) => [state.toLowerCase(), state]),
);

const normalizeZoneInput = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  const found = CANONICAL_ZONES.find((zone) => zone.toLowerCase() === normalized);
  return found || "";
};

const normalizeIndianStateInput = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (STATE_LOOKUP.has(normalized)) {
    return STATE_LOOKUP.get(normalized);
  }

  const aliased = STATE_ALIASES[normalized];
  if (!aliased) {
    return "";
  }

  return STATE_LOOKUP.get(String(aliased).toLowerCase()) || "";
};

const inferZoneFromTerritory = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (/\bnorth\b/.test(normalized)) {
    return "North";
  }

  if (/\bsouth\b/.test(normalized)) {
    return "South";
  }

  if (/\beast\b/.test(normalized)) {
    return "East";
  }

  if (/\bwest\b/.test(normalized)) {
    return "West";
  }

  return "";
};

const getZoneStates = (zone = "") => {
  const normalizedZone = normalizeZoneInput(zone);
  if (!normalizedZone) {
    return [];
  }

  return [...(INDIAN_STATES_BY_ZONE[normalizedZone] || [])];
};

const getZoneFromState = (state = "") => {
  const normalizedState = normalizeIndianStateInput(state);
  if (!normalizedState) {
    return "";
  }

  const matchedZone = CANONICAL_ZONES.find((zone) =>
    (INDIAN_STATES_BY_ZONE[zone] || []).includes(normalizedState),
  );
  return matchedZone || "";
};

const isValidStateForZone = (state = "", zone = "") => {
  const normalizedZone = normalizeZoneInput(zone);
  const normalizedState = normalizeIndianStateInput(state);

  if (!normalizedZone || !normalizedState) {
    return false;
  }

  return (INDIAN_STATES_BY_ZONE[normalizedZone] || []).includes(normalizedState);
};

const getAvailableStatesForZone = (zone = "", occupiedStates = []) => {
  const zoneStates = getZoneStates(zone);
  if (!zoneStates.length) {
    return [];
  }

  const occupiedSet = new Set(
    (Array.isArray(occupiedStates) ? occupiedStates : [])
      .map((item) => normalizeIndianStateInput(item))
      .filter(Boolean),
  );

  return zoneStates.filter((state) => !occupiedSet.has(state));
};

const buildZoneRegex = (zone = "") => {
  const normalizedZone = normalizeZoneInput(zone);
  if (!normalizedZone) {
    return null;
  }

  return new RegExp(`\\b${normalizedZone}\\b`, "i");
};

module.exports = {
  CANONICAL_ZONES,
  INDIAN_STATES_BY_ZONE,
  normalizeZoneInput,
  normalizeIndianStateInput,
  inferZoneFromTerritory,
  getZoneStates,
  getZoneFromState,
  isValidStateForZone,
  getAvailableStatesForZone,
  buildZoneRegex,
};
