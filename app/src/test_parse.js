const parseModelString = (raw, makeStr) => {
  let powertrain = "Gasoline";
  // The first word is often the make, but not always. FuelEconomy usually includes it? Actually, FuelEconomy menu/model sometimes doesn't include the Make. It says "Corolla", not "Toyota Corolla".
  // Let's not blindly remove make if it's the only word.
  let m = raw;
  if(m.toLowerCase().startsWith(makeStr.toLowerCase() + " ")) {
      m = m.substring(makeStr.length).trim();
  }
  
  const lowerM = m.toLowerCase();
  const makeLower = makeStr.toLowerCase();
  
  if (['tesla', 'rivian', 'lucid', 'polestar', 'byd'].includes(makeLower)) {
    powertrain = "Electric (EV)";
  } else if (lowerM.includes('plug-in') || lowerM.includes('phev') || lowerM.includes('prime') || lowerM.includes('450h+') || lowerM.includes('450h+')) {
    powertrain = "Plug-in Hybrid (PHEV)";
    m = m.replace(/(plug-in|phev|prime)/ig, '').trim();
    if(lowerM.includes('450h+')) m = m.replace(/h\+/ig, '');
  } else if (lowerM.includes('hybrid') || lowerM.includes('hev') || /\b\d{3}h\b/.test(lowerM)) {
    powertrain = "Hybrid (HEV)";
    m = m.replace(/hybrid|\bhev\b/ig, '').trim();
    if(/\b\d{3}h\b/.test(lowerM)) m = m.replace(/h\b/i, '');
  } else if (/\bev\b/.test(lowerM) || lowerM.includes('electric') || lowerM.includes('e-tron') || lowerM.includes('mach-e')) {
    powertrain = "Electric (EV)";
    m = m.replace(/\bev\b|electric/ig, '').trim();
  } else if (lowerM.includes('diesel') || lowerM.includes('tdi') || lowerM.includes('bluetec')) {
    powertrain = "Diesel";
    m = m.replace(/diesel|tdi|bluetec/ig, '').trim();
  }

  const trimRegex = /\b(AWD|4WD|FWD|RWD|LE|XLE|SE|XSE|Limited|Platinum|Premium|Touring|Sport|CX|EX|LX|FX|GT|TRD|Pro|Max)\b/ig;
  const foundTrims = m.match(trimRegex) || [];
  m = m.replace(trimRegex, '').replace(/\s+/g, ' ').trim();
  
  let baseModel = m.trim() || raw;
  let trim = foundTrims.join(' ');
  
  return { raw, baseModel, powertrain, trim: trim || "Standard" };
};

const tests = [
  "Corolla",
  "Corolla Cross Hybrid AWD",
  "Corolla FX",
  "Corolla Hatchback",
  "Corolla Hatchback XSE",
  "Corolla Hybrid",
  "ES 300h"
];

console.log(tests.map(t => parseModelString(t, "Toyota")));
