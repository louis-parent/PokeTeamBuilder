class ConstraintSystem
{
	constructor(solutionSize, domain, constraints)
	{
		this.solutionSize = solutionSize;
		this.domain = domain;
		this.constraints = constraints;
	}
	
	solve(maxSolutionCount)
	{
		return new Promise((success, error) => {
			success(new ConstraintSystemNode(new Array(this.solutionSize), this.domain, this.constraints).solve(maxSolutionCount || 1));
		});
	}
}

class Constraint
{
	constructor(isPartialSolution, isSolution)
	{
		this.isPartialSolution = isPartialSolution;
		this.isSolution = isSolution;
	}
}

class ConstraintSystemNode
{
	constructor(solution, domain, constraints)
	{
		this.solution = solution;
		this.domain = domain;
		this.constraints = constraints;
	}
	
	solve(maxSolutionCount)
	{
		let unsetIndex = this.getFirstUnsetVariable();
		if(unsetIndex !== null)
		{
			return this.branchNode(unsetIndex, maxSolutionCount);
		}
		else
		{
			return this.getSolutionIfFound();
		}
	}
	
	getFirstUnsetVariable()
	{
		for(let i = 0; i < this.solution.length; i++)
		{
			if(this.solution[i] === undefined)
			{
				return i;
			}
		}
		
		return null;
	}
	
	branchNode(toBranchIndex, maxSolutionCount)
	{
		let solutions = new Array();
		let i = 0;

		while(i < this.domain.length && solutions.length < maxSolutionCount)
		{
			let item = this.domain[i];
			let branchedSolution = [...this.solution];
			branchedSolution[toBranchIndex] = item;
			
			if(this.isPartialSolution(branchedSolution))
			{
				let result = new ConstraintSystemNode(branchedSolution, this.domain, this.constraints).solve(maxSolutionCount);
				
				if(result?.isSolutionArray)
				{
					solutions.push(result);
				}
				else if(result !== null)
				{
					solutions.push(...result);
				}
			}
			
			i++;
		}
		
		return solutions
	}
	
	isPartialSolution(partial)
	{
		let correct = true;
		let i = 0;
		
		while(i < this.constraints.length && correct)
		{
			correct &= this.constraints[i].isPartialSolution(partial);
			i++;
		}
		
		return correct;
	}
	
	getSolutionIfFound()
	{
		if(this.isSolution())
		{
			this.solution.isSolutionArray = true;
			return this.solution;
		}		
		else
		{
			return null;
		}
	}
	
	isSolution()
	{
		let correct = true;
		let i = 0;
		
		while(i < this.constraints.length && correct)
		{
			correct &= this.constraints[i].isSolution(this.solution);
			i++;
		}
		
		return correct;
	}
}
