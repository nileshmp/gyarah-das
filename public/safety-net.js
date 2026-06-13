// Single source of truth for the village Safety Net Directory (from the
// Knowledge Base). Imported by BOTH the server (Node) and the browser.
// Phone numbers live here but are shared with the mother only on request.

export const SAFETY_NET = {
  anwa: {
    village: "Anwa",
    aliases: ["अनवा", "अनवां", "अनवाँ", "आनवा", "आनवां", "आनवाँ", "अन्वा", "आन्वा", "anva", "anwaa"],
    stakeholders: {
      ASHA:      { role: "ASHA Worker",                  name: "Rinku Devi",         mobile: "7037470202" },
      AWW:       { role: "Anganwadi Worker",             name: "Manju Devi",         mobile: "7624809705" },
      ANM:       { role: "ANM (Auxiliary Nurse Midwife)",name: "Rani Devi",          mobile: "9396995185" },
      gramSathi: { role: "Gram Sathi",                   name: "Suraj Kumar",        mobile: "9812067080" },
      shg:       { role: "SHG Representative",            name: "Reena Kumari",       mobile: "9163192998" },
      transport: { role: "Emergency Transport Provider", name: "Krishna Kumar Yadav",mobile: "9772499581" },
    },
    facilities: {
      PHC: { name: "PHC Saifni",               distance: "8-12 km",  time: "15-25 min" },
      CHC: { name: "CHC Shahabad",             distance: "14-18 km", time: "25-35 min" },
      DH:  { name: "District Hospital Rampur", distance: "35-40 km", time: "60-75 min" },
    },
  },
};
