const make = "Toyota";
const model = "Corolla";
const year = "2024";

fetch(`https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${make}&model=${model}`, { headers: { "Accept": "application/json" } })
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(e => console.error(e));
