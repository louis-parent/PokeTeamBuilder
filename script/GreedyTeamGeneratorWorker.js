onmessage = function generateBestTeamFrom(event) {
	let {pokemons, types} = event.data;
	types = typeArrayToMap(types);
	
	let pokemons = new Array();
	let coveredTypes = new Array();

	for(let i = 0; i < 6; i++)
	{
		pokemons.sort((poke1, poke2) => {
			let covering1 = getPokemonCovering(poke1, types).filter(type => { return coveredTypes.indexOf(type) === -1; })
			let covering2 = getPokemonCovering(poke2, types).filter(type => { return coveredTypes.indexOf(type) === -1; })
			
			return covering2.length - covering1.length;
		});
		
		let pokemon = pokemons.shift();
		pokemons.push(pokemon);
		coveredTypes.push(...getPokemonCovering(pokemon, types));
	}
	
	postMessage([pokemons]);
}

function typeArrayToMap(types) {
	let map = {};
	
	for(let type of types)
	{
		map[type.name] = type;
	}
	
	return map;
}

function getPokemonCovering(pokemon, typesData)
{
	let covering = new Array();
	
	for(let type of pokemon.types)
	{
		covering.push(...typesData[type].damageRelations.doubleDamageTo);
	}
	
	return covering;
}
