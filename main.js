
const htmlNewHeroName = document.getElementById("new-hero");
const htmlNewHeroLevel = document.getElementById("new-hero-level");
const htmlCreateButton = document.getElementById("create");
const htmlDeleteButton = document.getElementById("delete");
const htmlUpdateButton = document.getElementById("update");
const htmlHeroesTable = document.getElementById("heroes");

window.addEventListener("load", loadHeroes);
htmlHeroesTable.addEventListener("click", onHeroesClick);
htmlCreateButton.addEventListener("click", onCreateClick);
htmlDeleteButton.addEventListener("click", onDeleteClick);
htmlUpdateButton.addEventListener("click", onUpdateClick);

let selected_hero = null;

document.addEventListener("click", function (event) {
  const isInsideTable = event.target.closest("table#heroes");
  const isInsideForm = event.target.closest("#create-hero-form");
  
  if (!isInsideTable && !isInsideForm) {
    for (const row of document.querySelectorAll("table#heroes tr.selected")) {
      row.classList.remove("selected");
    }
    
    selected_hero = null;
    htmlDeleteButton.disabled = true;
    htmlNewHeroName.value = "";
    htmlNewHeroLevel.value = "";
  }
})

async function loadHeroes() {
  const response = await performRequest("GET", "/api/heroes/", {"text-to-search": ""});
  const heroes = response.body ?? []; // how about?   || []
  
  renderHeroesTable(heroes);
  // selectedHero = null;
  // htmlDelete.disabled = true;
}

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function renderHeroesList(heroes) {
  htmlHeroesTable.innerHTML = "";
  for (const hero of heroes) {
    const item = document.createElement("li");
    item.textContent = `${hero.name}, ${hero.level}`;
    item.dataset.name = hero.name;
    item.dataset.level = hero.level;
    htmlHeroesTable.appendChild(item);
  }
}

function renderHeroesTable(heroes) {
  htmlHeroesTable.innerHTML = "<tr><th>Name</th><th>Level</th></tr>";
  
  if (heroes.length == 0) return;

  for (const hero of heroes)
  {
    const row = document.createElement("tr");

    row.dataset.name = hero.name;
    row.dataset.level = hero.level;

    const column1 = document.createElement("td");
    const column2 = document.createElement("td");

    column1.textContent = hero.name;
    column2.textContent = hero.level;

    row.append(column1, column2);

    if (isEqual(selected_hero, { name: hero.name, level: hero.level }))
    {
      row.classList.add("selected");
      htmlDeleteButton.disabled = false;
    }

    htmlHeroesTable.appendChild(row);
  }
}

// function onHeroesClick(event) {
//   if (event.target.tagName === "LI") {
//     for (const child of htmlHeroesTable.children) {
//       child.classList.remove("selected");
//     }
//     event.target.classList.add("selected");
//     selectedHero = 
//     {
//       name: event.target.dataset.name, 
//       level: event.target.dataset.level 
//     }
//     htmlDelete.disabled = false;
//   }
// }

function onHeroesClick(event) {
  const row = event.target.closest("tr");

  if (!row || !row.dataset.name) return;

  for (const row of htmlHeroesTable.querySelectorAll("tr")) {
    row.classList.remove("selected");
  }

  row.classList.add("selected");

  selected_hero = 
  {
    name: row.dataset.name,
    level: row.dataset.level
  };

  htmlNewHeroName.value = selected_hero.name;
  htmlNewHeroLevel.value = selected_hero.level;

  htmlDeleteButton.disabled = false;
}

async function onCreateClick(event) {
  event.preventDefault();

  const newHeroName = htmlNewHeroName.value.trim();
  const newHeroLevel = htmlNewHeroLevel.value.trim();

  if (!newHeroName || !newHeroLevel) {
    alert("Complete the fields!");
    return;
  }

  const newHero = { name: newHeroName, level: newHeroLevel }

  const { statusCode, body } = (await performRequest("POST", "/api/heroes/", {}, 
                                { hero: newHero } )) ?? {};
                  
  if (statusCode === 200) {
    selected_hero = newHero
    await loadHeroes();
    // htmlNewHeroName.value = "";
    // htmlNewHeroLevel.value= "";
  }
  else {
    console.error(body);
    alert(`Duplicate hero \{ name: "${newHero.name}", level: "${newHero.level}" \}`);
  }
}

async function onDeleteClick() {
  // console.log(`DELETE ${selectedHero}`);

  if (Object.keys(selected_hero).length === 0) return;
  
  const response = await performRequest("DELETE", "/api/heroes/", {}, { hero: selected_hero });
  if (response.statusCode === 200) {
    await loadHeroes();
    htmlNewHeroName.value = "";
    htmlNewHeroLevel.value = "";
  } 
  else {
    console.error(response.body);
  }
}

async function onUpdateClick(event) {
  event.preventDefault();

  if (!selected_hero || Object.keys(selected_hero).length === 0) {
    alert("Select a hero!");
    return;
  }

  const new_hero_name = htmlNewHeroName.value.trim();
  const new_hero_level = htmlNewHeroLevel.value.trim();

  if (!new_hero_name || !new_hero_level) {
    alert("Complete the fields!");
    return;
  }

  const new_hero = { name: new_hero_name, level: new_hero_level }

  const response = await performRequest("PUT", "/api/heroes/", {}, { old_hero: selected_hero, new_hero: new_hero });
  if (response.statusCode === 200) {
    await loadHeroes();
    htmlNewHeroName.value = "";
    htmlNewHeroLevel.value = "";
  } 
  else {
    console.error(response.body);
  }
}

async function performRequest(method, url, queryParams = {}, bodyObject = {}) {
  const query = new URLSearchParams(queryParams).toString();
  const fullUrl = query ? `${url}?${query}` : url;
  
  const fetchOptions =
    method === "GET"
      ? {}
      : {
          method,
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(bodyObject),
        };

  const response = await fetch(fullUrl, fetchOptions);
  const body = await response.json();
  return {body, statusCode: response.status};
}
