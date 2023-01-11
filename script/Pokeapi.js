
window.PokeAPI = {
	BASE_URL: "https://pokeapi.co/api/v2/",
	
	multipageRequest(base) {
		return this.request(base).then(data => {
			return this.request(base, 0, data.count);
		});
	},
	request(ressource, offset, limit) {
		return fetch(this.buildURL(ressource, offset, limit)).then(response => {
			return response.json();
		});
	},
	buildURL(ressource, offset, limit) {
		let url = this.BASE_URL;
		
		if(Array.isArray(ressource))
		{
			url += ressource.join('/');
		}
		else
		{
			url += ressource;
		}
		
		url += "/?";
		
		if(offset !== undefined)
		{
			url += "offset=" + offset + "&";
		}
		
		if(limit !== undefined)
		{
			url += "limit=" + limit
		}
		
		return url;
	},
	
	nameTranslationsToMap(translations) {
		let map = {};
		
		for(let translation of translations)
		{
			map[translation.language.name] = translation.name;
		}
		
		return map;
	},
	
	Generations: {
		count() {
			return PokeAPI.request("generation").then(data => {
				return data.count;
			});
		},
		getAll() {
			return PokeAPI.multipageRequest("generation").then(data => {
				return Promise.all(data.results.map(generation => {
					return this.get(generation.name).then(details => { return details; });
				}));
			});
		},
		get(generation) {
			return PokeAPI.request(["generation", generation]).then(data => {
				return {
					id: data.id,
					name: data.name,
					localizedName: PokeAPI.nameTranslationsToMap(data.names),
					region: data.main_region.name,
					version: data.version_groups[0].name
				};
			});
		}
	},
	Types: {
		count() {
			return PokeAPI.request("type").then(data => {
				return data.count;
			});
		},
		getAll() {
			return PokeAPI.multipageRequest("type").then(data => {
				return Promise.all(data.results.map(type => {
					return this.get(type.name).then(details => { return details; });
				}));
			});
		},
		get(type) {
			return PokeAPI.request(["type", type]).then(data => {
				return {
					id: data.id,
					name: data.name,
					localizedName: PokeAPI.nameTranslationsToMap(data.names),
					damageRelations: {
						noDamageTo: data.damage_relations.no_damage_to.map(relation => { return relation.name; }),
						halfDamageTo: data.damage_relations.half_damage_to.map(relation => { return relation.name; }),
						doubleDamageTo: data.damage_relations.double_damage_to.map(relation => { return relation.name; }),
						immuneTo: data.damage_relations.no_damage_from.map(relation => { return relation.name; }),
						resistantTo: data.damage_relations.half_damage_from.map(relation => { return relation.name; }),
						weakTo: data.damage_relations.double_damage_from.map(relation => { return relation.name; }),
					}
				};
			});
		}
	},
	Pokemons: {
		count() {
			return PokeAPI.request("pokemon").then(data => {
				return data.count;
			});
		},
		getAll() {
			return PokeAPI.multipageRequest("pokemon").then(data => {
				return Promise.all(data.results.map(pokemon => {
					return this.get(pokemon.name).then(details => { return details; });
				}));
			});
		},
		getPaginated(page) {
			return PokeAPI.request("pokemon", (page * 20)).then(data => {
				return Promise.all(data.results.map(pokemon => {
					return this.get(pokemon.name).then(details => { return details; });
				}));
			});
		},
		get(variety) {
			return PokeAPI.request(["pokemon", variety]).then(data => {
				return this.getSpecies(data.species.name).then(species => {
					return {
						id: data.id,
						name: data.name,
						baseExperience: data.base_experience,
						height: data.height,
						isDefault: data.is_default,
						weight: data.weight,
						abilities: data.abilities.map(ability => { return ability.ability.name; }),
						possiblyHeldItems: data.held_items.map(item => { return item.item.name; }),
						locationAreas: [],
						moves: data.moves.map(move => { return move.move.name; }),
						stats: data.stats.map(stat => { return { name: stat.stat.name, base: stat.base_stat, effortValue: stat.effort}}),
						types: data.types.map(type => { return type.type.name; }),
						species: species,
						sprites: {
							male: {
								default: {
									front: data.sprites.front_default,
									back: data.sprites.back_default
								},
								shiny: {
									front: data.sprites.front_shiny,
									back: data.sprites.back_shiny
								}
							},
							female: {
								default: {
									front: data.sprites.front_female,
									back: data.sprites.back_female
								},
								shiny: {
									front: data.sprites.front_shiny_female,
									back: data.sprites.back_shiny_female
								}
							}
						}
					};
				});
			});
		},
		getSpecies(species) {
			return PokeAPI.request(["pokemon-species", species]).then(async data => {
				const color = data.color?.name !== undefined ? (await PokeAPI.request(["pokemon-color", data.color.name])) : undefined;
				const shape = data.shape?.name !== undefined ? (await PokeAPI.request(["pokemon-shape", data.shape.name])) : undefined;
				return this.buildPokemon(data, color, shape);
			});
		},
		
		buildPokemon(species, color, shape) {
			const pokemon = {
				id: species.id,
				name: species.name,
				femaleRate: (species.gender_rate / 8) * 100,
				captureRate: (species.capture_rate	/ 255) * 100,
				baseHappiness: (species.base_happiness / 255) * 100,
				isBaby: species.is_baby,
				isLegendary: species.is_legendary,
				isMythical: species.is_mythical,
				hatchSteps: 255 * ((species.hatch_counter || 0) + 1),
				hasGenderDifference: species.has_gender_differences,
				areFormsSwitchable: species.forms_switchable,
				growthRate: species.growth_rate?.name,
				eggGroups: species.egg_groups.map(group => { return group?.name; }),
				evolvesFrom: species.evolves_from_species?.name,
				habitat: species.habitat?.name,
				generation: species.generation.name,
				localizedName: PokeAPI.nameTranslationsToMap(species.names)
			};
			
			if(color !== undefined)
			{
				pokemon.color = {
					name: color.name,
					localizedName: PokeAPI.nameTranslationsToMap(color.names)
				};
			}
			
			if(shape !== undefined)
			{
				pokemon.shape = {
					name: shape.name,
					localizedName: PokeAPI.nameTranslationsToMap(shape.names)
				};
			}
			
			return pokemon;
		}
	}
};
