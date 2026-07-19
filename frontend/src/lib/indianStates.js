// India GST state codes — mirrors graamam_v2.html STATES (used for the
// New Order Bill-To / Ship-To / B2C state dropdowns + CGST-SGST vs IGST logic).

export const INDIAN_STATES = [
  ["01", "Jammu & Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"], ["04", "Chandigarh"],
  ["05", "Uttarakhand"], ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"], ["13", "Nagaland"], ["14", "Manipur"],
  ["15", "Mizoram"], ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"], ["19", "West Bengal"],
  ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"],
  ["26", "Dadra & Nagar Haveli and Daman & Diu"], ["27", "Maharashtra"], ["29", "Karnataka"], ["30", "Goa"],
  ["31", "Lakshadweep"], ["32", "Kerala"], ["33", "Tamil Nadu"], ["34", "Puducherry"], ["35", "Andaman & Nicobar"],
  ["36", "Telangana"], ["37", "Andhra Pradesh"], ["38", "Ladakh"], ["97", "Other Territory"],
];

export function stateNameFromCode(code) {
  const s = INDIAN_STATES.find((x) => x[0] === code);
  return s ? s[1] : "";
}

export function stateCodeFromName(name) {
  const n = (name || "").trim().toLowerCase();
  if (!n) return "";
  const hit = INDIAN_STATES.find((x) => x[1].toLowerCase() === n);
  return hit ? hit[0] : "";
}

// Best-effort: derive a GST state code from a GSTIN's 2-digit prefix.
export function stateCodeFromGstin(gstin) {
  const g = (gstin || "").trim();
  if (g.length >= 2) {
    const p = g.slice(0, 2);
    if (INDIAN_STATES.some((x) => x[0] === p)) return p;
  }
  return "";
}
