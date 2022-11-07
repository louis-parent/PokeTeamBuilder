var GENERATIONS = new Array();
var TYPES = new Array();
var POKEMONS = new Array();

var TEAM = {
	team: new Array(),
	setMember(index, pokemon) {
		this.team[index] = pokemon;
		this.display();
	},
	clear() {
		this.team = new Array();
		this.display();
	},
	display() {
		for(let i = 0; i < 6; i++)
		{	
			let pokemonImage = this.team[i]?.sprites?.male?.default?.front || "assets/egg.png";					
			let pokemonName = this.team[i]?.name || "";
			
			this.getImage(i).src = pokemonImage;
			this.getNameSelector(i).value = pokemonName;
		}
	},
	getImage(index) {
		return document.querySelector("#team-" + (index+1) + " > img");
	},
	getNameSelector(index) {
		return document.querySelector("#team-" + (index+1) + " > select");
	}
};

function fetchGenerations() {
	return PokeAPI.Generations.getAll().then(generations => {
		GENERATIONS = generations;
	});
}

function fetchTypes() {
	return PokeAPI.Types.getAll().then(types => {
		TYPES = types;
	});
}

function fetchPokemons() {
	return PokeAPI.Pokemons.getAll().then(pokes => {
		POKEMONS = pokes;
	});
}

function fillGenerationDropdowns() {
	let minGen = document.querySelector("#minGen");
	let maxGen = document.querySelector("#maxGen");

	for(let i = 0; i < GENERATIONS.length; i++)
	{
		let generation = GENERATIONS[i];
						 
		let option = document.createElement("option");
		option.value = generation.name;
		option.innerHTML = generation.localizedName["en"];

		minGen.appendChild(option.cloneNode(true));
		maxGen.appendChild(option.cloneNode(true));
		
		if(i == 0)
		{
			minGen.value = generation.name;
		}
		else if(i == GENERATIONS.length-1)
		{
			maxGen.value = generation.name;
		}
	}
}

function fillTypeTable() {
	const realTypes = TYPES.filter(type => { return type.id < 1000; });
	const table = document.querySelector("#type-table");
	
	let firstRow = document.createElement("tr");
	firstRow.appendChild(document.createElement("td"));
	let offensiveCell = document.createElement("td");
	offensiveCell.style.textAlign = "center";
	offensiveCell.colSpan = realTypes.length + 1;
	offensiveCell.innerText = "Offensive";
	firstRow.appendChild(offensiveCell);
	table.appendChild(firstRow);
	
	let row = document.createElement("tr");
	
	let firstCell = document.createElement("td");
	firstCell.rowSpan = realTypes.length + 1;
	firstCell.innerText = "Defensive";
	row.appendChild(firstCell);

	row.appendChild(document.createElement("td"));
	row.appendChild(document.createElement("td"));
	
	for(let type of realTypes)
	{		
		row.appendChild(createTypeCell(type.name));
	}
	
	table.appendChild(row);
	
	for(let defensiveType of realTypes)
	{
		let row = document.createElement("tr");

		row.appendChild(document.createElement("td"));
		row.appendChild(createTypeCell(defensiveType.name));
		
		for(let offensiveType of realTypes)
		{
			let cell = document.createElement("td");

			if(defensiveType.damageRelations.immuneTo.indexOf(offensiveType.name) !== -1)
			{
				cell.innerText = "x0";
				cell.classList.add("immunity");
			}
			else if(defensiveType.damageRelations.resistantTo.indexOf(offensiveType.name) !== -1)
			{
				cell.innerText = "x0.5";
				cell.classList.add("resistance");
			}
			else if(defensiveType.damageRelations.weakTo.indexOf(offensiveType.name) !== -1)
			{
				cell.innerText = "x2";
				cell.classList.add("weakness");
			}
			else
			{
				cell.innerText = "x1"
			}
			
			row.appendChild(cell);
		}
		
		table.appendChild(row);
	}
	
	document.querySelector("#pokedex").style.visibility = "visible";
}

function createTypeCell(typeName) {		
	let header = document.createElement("th");
	
	let icon = document.createElement("img")
	icon.src = "assets/types/" + typeName + ".png";
	icon.alt = typeName;
	header.appendChild(icon);
	
	return header;
}

function fillPokemonNames() {
	for(let i = 0; i < 6; i++)
	{
		let list = TEAM.getNameSelector(i);
		list.innerHTML = "";
		
		let option = document.createElement("option");
		option.value = "";
		option.innerText = "- Any -";
		
		list.appendChild(option);
	}

	getFilteredPokemon().then(pokemons => {
		for(let i = 0; i < 6; i++)
		{			
			let list = TEAM.getNameSelector(i);
			
			for(let pokemon of pokemons)
			{
				let option = document.createElement("option");
				option.value = pokemon.name;
				option.innerText = pokemon.species.localizedName["en"]
				
				list.appendChild(option);
			}
		}
	});
}

function getFilteredPokemon() {
	return PokeAPI.Generations.getAll().then(generations => {
		generations = generations.sort((gen1, gen2) => { return gen1.id - gen2.id; }).map(gen => { return gen.name; });
		
		const minGen = generations.indexOf(document.querySelector("#minGen").value);
		const maxGen = generations.indexOf(document.querySelector("#maxGen").value);

		const useNormalPokemon = document.querySelector("#useNormalPokemon").checked;
		const useMythicalPokemon = document.querySelector("#useMythicalPokemon").checked;
		const useLegendaryPokemon = document.querySelector("#useLegendaryPokemon").checked;
		
		return POKEMONS.filter(pokemon => {
			let generationIndex = generations.indexOf(pokemon.species.generation);
			let hasCorrectGen = generationIndex >= minGen && generationIndex <= maxGen;
			let isNormal = !pokemon.species.isMythical && !pokemon.species.isLegendary;
			
			return pokemon.isDefault && hasCorrectGen && ((useNormalPokemon && isNormal) || (useMythicalPokemon && pokemon.species.isMythical) || (useLegendaryPokemon && pokemon.species.isLegendary));
		});
	});
}

function generateRandomTeam() {
	TEAM.clear();
	
	getFilteredPokemon().then(pokemons => {
		for(let i = 0; i < 6; i++)
		{				
			let pokemonId = Math.floor(Math.random() * pokemons.length);
			TEAM.setMember(i, pokemons[pokemonId]);
		}		 
	});
}

function generateBestTeam() {	
	getFilteredPokemon().then(pokemons => {
		generateTeamWithWorker(pokemons);
	});
}

function generateTeamWithWorker(pokemons) {
	document.body.classList.add("searching");
	
	const worker = new Worker("script/ConstraintsTeamGeneratorWorker.js");
	
	worker.postMessage({
		pokemons: pokemons,
		types: TYPES.filter(type => { return type.id < 1000; })
	});
	
	worker.onmessage = (event) => {
		document.body.classList.remove("searching");
		TEAM.clear();
		
		for(let i = 0; i < 6; i++)
		{
			TEAM.setMember(i, event.data[0][i]);
		}
	};
}

window.addEventListener("load", () => {
	document.body.classList.add("loading");
	
	fetchGenerations().then(fillGenerationDropdowns);
	fetchTypes().then(fillTypeTable);
	
	fetchPokemons().then(() => {
		fillPokemonNames();
	
		document.body.classList.remove("loading");

		let teamUp = document.querySelector("#teamup");
		teamUp.disabled = false;
		teamUp.addEventListener("click", generateBestTeam);
		
		document.querySelector("#randomize").addEventListener("click", () => {
			generateRandomTeam();
		});
		
		document.querySelector("#clear").addEventListener("click", () => {
			TEAM.clear();
		});
		
		document.querySelectorAll(".pokemon-filter").forEach(input => {
			input.addEventListener("change", () => {
				TEAM.clear();
				fillPokemonNames();
			});
		});
		
		for(let i = 0; i < 6; i++)
		{
			TEAM.getNameSelector(i).addEventListener("change", event => {
				PokeAPI.Pokemons.get(event.target.value).then(pokemon => {
					TEAM.setMember(i, pokemon);
				});
			});
		}
	}).catch(() => {
		document.body.classList.remove("loading");
		document.body.classList.add("error");
	});
});
