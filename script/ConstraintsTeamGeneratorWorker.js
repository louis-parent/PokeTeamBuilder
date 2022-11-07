importScripts("Constraints.js");

onmessage = function(event) {
	let {pokemons, types} = event.data;
	let typeSize = types.length;
	types = typeArrayToMap(types);
	
	new ConstraintSystem(6, pokemons, [{
			isPartialSolution(solution)
			{
				let covered = new Array();
				
				for(let pokemon of solution)
				{
					if(pokemon !== undefined)
					{
						for(let type of getPokemonCovering(pokemon, types))
						{
							covered.push(type);
						}
					}
				}
				
				return (new Set(covered)).size > (covered.length / 2);
			},
			isSolution(solution)
			{
				let covered = new Set();
				
				for(let pokemon of solution)
				{
					for(let type of getPokemonCovering(pokemon, types))
					{
						covered.add(type);
					}
				}
				return covered.size === typeSize;
			}
		}]).solve().then(solutions => {
			postMessage(solutions);
		});
};

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
