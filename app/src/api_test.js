const make = "Toyota";
const year = "2024";
fetch(`https://www.fueleconomy.gov/ws/rest/vehicle/menu/model?year=${year}&make=${make}`, { headers: { "Accept": "application/json" } })
  .then(r => r.json())
  .then(d => {
    let models = d.menuItem.map(m => m.value);
    console.log("Toyota Models:", models.filter(m => m.includes("Highlander") || m.includes("Corolla")));
  });

const make2 = "Lexus";
fetch(`https://www.fueleconomy.gov/ws/rest/vehicle/menu/model?year=2024&make=${make2}`, { headers: { "Accept": "application/json" } })
  .then(r => r.json())
  .then(d => {
    let models = d.menuItem.map(m => m.value);
    console.log("Lexus Models:", models.filter(m => m.includes("ES")));
  });
