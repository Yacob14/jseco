/**
 * Most of this is undocumented code
 * This hasn't been worked on since 05/21/2011
 */

function clone(object) 
{
	function OneShotConstructor(){}
	OneShotConstructor.prototype = object;
	return new OneShotConstructor();
}
function rand(min, max) 
{
	return Math.random() * (max-min) + min;
}
function round(number, decimals) 
{
	var x10 = Math.pow(10, decimals);
	return Math.round(number*x10)/x10;
}
function arrayRange(toRange)
{
	var target = [];
	
	for (var i = 0; i < toRange; i++)
		target[target.length] = [];
		
	return target;
}
function sign(value)
{
	if (value < 0)
		return -1;
	
	if (value === 0)
		return 0;
	
	if (value > 0)
		return 1;
}
function deviation(range)
{
	var rndValue = rand(-1, 1);
	return (rndValue^3) * range;
}


/* 'Constants' */
var Flags = {
	'None': 0,				// #FFFFFF
	'SparseVeg': 2, 		// #98FB98
    'LightVeg': 4, 			// #32CD32
    'MediumVeg': 8, 		// #228B22
    'ThickVeg': 16, 		// #008000
    'HeavyVeg': 32, 		// #006400
	'RottenVeg': 64,		// #A56633
	'Herbivore': 128,		// #000090
	'SickHerbivore': 256	// #000010
};
var FlagColors = {
	0: '#FFFFFF',
	2: '#98FB98',
	4: '#32CD32',
	8: '#228B22',
	16: '#008000',
	32: '#006400',
	64: '#A58800', 	// #TODO: a more rotten color
	128: '#000090',
	256: '#000030' // #TODO: a more 'sick' color
};

// [min, max]
var GrassGene = {
	'maxFoodValue': 	40,
	'maxRottenValue': 	50,
	
	'rottenRate': 		[0.0075, 0.25],
	'growthRate': 		[0.0075, 0.25],
	'decayRate': 		[0.0001]
};
var SpecieGene = [
	['lifeSpan', 			[50, 500]],
	['size', 				[1, 50]],
	['reproductionSpan', 	[5, 40]],
	['reproductionRate', 	[0.25, 1]],
	['adultHood', 			[0.25, 0.5]],
	['oldAge',				[0.5, 0.75]],
	['feedRate', 			[0.25, 1]],
	['hungerRate', 			[0.01, 0.2]],
	['herdBias', 			[0.125, 1]],
	['sickRate',			[0.3, 0.4]],
	['smartness', 			[0.25, 1]],
	['foodCapacity', 		[0.5, 4]],
	['toughness', 			[0.125, 0.5]],
	['sightRange', 			[3, 10]]
];

var Settings = { 
	'grassRotts': true,
	'zoomRectMovementSpeed': 1,
	'FPS': 10
};

function World()
{	
	this.grassMap = arrayRange(World.height);
	this.speciesMap = arrayRange(World.height);
	this.entitiesMap = arrayRange(World.height);
	
	this.specieCount = 0;
	this.speciesBorn = 0;
	this.speciesSpawned = 0;
	
	this.rottenGrassCount = 0;
	
	this.sickHerbivoresCount = 0;
	/*this.sickHerbivoresCuredCount = 0;
	this.sickHerbivoresDiedCount = 0;*/
	
	this.init();
}
World.width = 200;
World.height = 200;

World.prototype = {
	init: function(reset)
	{
		if (reset === undefined)
			reset = false;

		if (reset)
		{
			this.specieCount = 0;
			this.speciesBorn = 0;
			this.speciesSpawned = 0;
	
			this.rottenGrassCount = 0;
	
			this.sickHerbivoresCount = 0;
		}
		
		for (var y = 0; y < World.height; y++)
		{
			for (var x = 0; x < World.width; x++)
			{
				this.grassMap[y][x] = new Grass();
				this.entitiesMap[y][x] = this.grassMap[y][x].getFlag();
				
				if (this.speciesMap[y][x] !== undefined)
					this.speciesMap[y][x] = undefined;
			}
		}
	},
	
	update: function()
	{
		// Update each grass and push updates to entities map
		for (var y = 0; y < World.height; y++)
		{
			for (var x = 0; x < World.width; x++)
				this.grassMap[y][x].step();
		}

		for (var y = 0; y < World.height; y++)
		{
			for (var x = 0; x < World.width; x++)
			{
				if (this.speciesMap[y][x] !== undefined)
					this.speciesMap[y][x].move();
			}
		}
		
		for (var y = 0; y < World.height; y++)
		{
			for (var x = 0; x < World.width; x++)
			{
				if (this.speciesMap[y][x] !== undefined)
				{
					if (this.speciesMap[y][x].step() === false)
						this.removeSpecie(this.speciesMap[y][x], true);
				}
					
				if ((this.entitiesMap[y][x] & this.grassMap[y][x]) === 0)
				{
					if (this.entitiesMap[y][x] <= Flags.RottenVeg)
						this.entitiesMap[y][x] = this.grassMap[y][x].getFlag();
					else
						this.entitiesMap[y][x] = this.grassMap[y][x].getFlag() | ((this.speciesMap[y][x] !== undefined) ? this.speciesMap[y][x].flag : this.speciesMap[y][x]);
				}
			}
		}
		
		return this.entitiesMap;
	},
	
	addSpecie: function(specie, firstCall, isSpawned)
	{
		if (firstCall)
			this.specieCount++;
			
		if (isSpawned)
			this.speciesSpawned++;
		
		if (firstCall && specie.born)
			this.speciesBorn++;

		this.speciesMap[specie.posY][specie.posX] = specie;
		this.entitiesMap[specie.posY][specie.posX] |= specie.type;
	},
	
	removeSpecie: function(specie, isDead)
	{
		this.speciesMap[specie.posY][specie.posX] = undefined;
		this.entitiesMap[specie.posY][specie.posX] ^= specie.type;
		
		var amount = 0.0025;
		
		if (isDead)
		{
			amount = specie.genome.size / 1000;
			this.specieCount--;
			
			if (specie.born)
				this.speciesBorn--;
			else
				this.speciesSpawned--;
		}
	
		this.grassMap[specie.posY][specie.posX].fertilize(amount);
	},		
	
	getFlag: function(posX, posY)
	{
		return this.entitiesMap[posY][posX];
	},
	
	getGrass: function(posX, posY)
	{
		return this.grassMap[posY][posX];
	},
	
	getSpecie: function(posX, posY)
	{
		return this.speciesMap[posY][posX];
	}
};

jsEco = new function()
{
	var globalCanvas = undefined;
	var zoomCanvas = undefined;

	var world = undefined;
	
	var view = undefined;
	var interval = undefined;
	
	var drawCalls = 0;
	var frameCount = 0;
	
	this.init = function() 
	{		
		globalCanvas = document.getElementById('global-canvas');
		zoomCanvas = document.getElementById('zoom-canvas');
		
		setEventHandlers();
		
		world = new World(200, 200); // globalCanvas.width, globalCanvas.height
		view = new View(globalCanvas.getContext('2d'), zoomCanvas.getContext('2d'), World.width, World.height);

		interval = setInterval(step, 1000/Settings.FPS);
	};
	
	this.getWorldFlag = function(posX, posY)
	{
		return world.getFlag(posX, posY)
	};
	
	this.getWorldGrass = function(posX, posY)
	{
		return world.getGrass(posX, posY)
	};
	this.changeWorldRottenGrass = function(value)
	{
		world.rottenGrassCount += value;
	};
	
	this.changeWorldSickHerbivores = function(value)
	{
		world.sickHerbivoresCount += value;
	};
	/*
	#TODO
	this.changeWorldSickHerbivoresCured = function(value)
	{
		world.sickHerbivoresCuredCount += value;
	}
	this.changeWorldSickHerbivoresDied = function(value)
	{
		world.sickHerbivoresDiedCount += value;
	}*/
	
	this.getWorldSpecie = function(posX, posY)
	{
		return world.getSpecie(posX, posY)
	};
	
	this.addWorldSpecie = function(specie, firstCall, isSpawned)
	{
		world.addSpecie(specie, firstCall, isSpawned);
	};
	
	this.removeWorldSpecie = function(specie, isDead)
	{
		world.removeSpecie(specie, isDead);
	}
	
	function setEventHandlers()
	{
		globalCanvas.addEventListener('click', globalCanvasOnClick, false);
		document.addEventListener('keyup', globalCanvasKeyUp, false);
	}
	
	function globalCanvasOnClick(mouseEvent)
	{
		/* Get relative co-ords */
		var posX = mouseEvent.offsetX;
		var posY = mouseEvent.offsetY;
		
		view.updateZoomRect(posX, posY);
	}
	
	function globalCanvasKeyUp(keyEvent)
	{
		/* 37: LEFT
		   38: UP
		   39: RIGHT
		   40: DOWN 
		   67: C(ontinue)
		   80: P(ause)
		   82: R(eset)
		   83: S(pawn) */
		
		if (keyEvent.keyCode === 67)
			continueStep();
			
		if (keyEvent.keyCode === 82)
			resetStep();

		if (keyEvent.keyCode === 83)
			spawnSpecieGroup(20);
			
		if (keyEvent.keyCode === 80)
			pauseStep();
		   
		if (keyEvent.keyCode < 37 || keyEvent.keyCode > 40)
			return;

		updateZoomRect(keyEvent.keyCode);
	}
	
	function pauseStep()
	{
		interval = clearInterval(interval);
	
		document.getElementById('draw-calls').innerHTML = 'PAUSED';
		document.getElementById('fps').innerHTML = 'PAUSED';
	}
	
	function resetStep()
	{
		world.init(true);
	}
	
	function continueStep()
	{
		if (interval === undefined)
			interval = setInterval(step, 1000/Settings.FPS);
	}
	
	function spawnSpecieGroup(amount)
	{
		var zoomRectPos = view.getZoomRectPos();
		var posX = zoomRectPos[0] + 12;
		var posY = zoomRectPos[1] + 12;
		
		var minX = (posX - 5 < 0) ? 0 : posX - 5;
		var minY = (posY - 5 < 0) ? 0 : posY - 5;
		var maxX = (posX + 5 >= World.width) ? World.width : posX + 5;
		var maxY = (posY + 5 >= World.width) ? World.height : posY + 5;
		
		var specieGenome = Genome.getRandom();
		
		for (var i = 0; i < amount; i++)
		{
			var spawnX = Math.floor(rand(minX, maxX));
			var spawnY = Math.floor(rand(minY, maxY));
			
			// One specie per co-ord
			if (jsEco.getWorldSpecie(spawnX, spawnY) !== undefined)
				continue;
				
			jsEco.addWorldSpecie(new Herbivore(Genome.getMutation(specieGenome), spawnX, spawnY, false), true, true);
		}
	}
	
	function updateZoomRect(keyCode)
	{
		var speed = Settings.zoomRectMovementSpeed;

		var posX = 0;
		var posY = 0;
		
		switch (keyCode)
		{
			case 37:
				posX = -speed;
			break;
			
			case 38:
				posY = -speed;
			break;
			
			case 39:
				posX = speed;
			break;
			
			case 40:
				posY = speed;
		}
		
		view.updateZoomRect(posX, posY, true);
	}
	
	function step()
	{
		// Draw call is located here!
		drawCalls += view.draw(world.update());
		
		frameCount++;
		
		// Second has passed? Update info elements
		if (frameCount == Settings.FPS)
		{
			document.getElementById('draw-calls').innerHTML = drawCalls/Settings.FPS + ' p/s';
			document.getElementById('fps').innerHTML = Settings.FPS + ' p/s';
			
			document.getElementById('herbivore-alive').innerHTML = world.specieCount;
			document.getElementById('herbivore-spawn').innerHTML = world.speciesSpawned;
			document.getElementById('herbivore-born').innerHTML = world.speciesBorn;
			
			var sickHerbivoresPercent = (world.sickHerbivoresCount/world.specieCount) * 100;
			document.getElementById('herbivore-sick').innerHTML = world.sickHerbivoresCount + ' (' + (sickHerbivoresPercent === Infinity || sickHerbivoresPercent.toString() === 'NaN' ? 0 : round(sickHerbivoresPercent, 2)) + '%)';
			
			/*document.getElementById('herbivore-sick-cured').innerHTML = world.sickHerbivoresCuredCount;
			document.getElementById('herbivore-sick-died').innerHTML = world.sickHerbivoresDiedCount;*/			
			
			var rottenGrassPercent = (world.rottenGrassCount / 40000) * 100;			
			document.getElementById('grass-rotten').innerHTML = world.rottenGrassCount + ' (' + (rottenGrassPercent === Infinity || rottenGrassPercent === 0 ? 0 : round(rottenGrassPercent, 2)) + '%)';
			
			drawCalls = 0;
			frameCount = 0;
		}
	}
}

function Genome(genes) 
{
	if (genes === undefined)
		return false;

	this.allowedVarience = 0.05;
	this.mutationRate = 0.1;

	for (var i = 0; i < SpecieGene.length; i++)
	{
		this[SpecieGene[i][0]] = genes[SpecieGene[i][0]];
	}
}

Genome.getRandom = function()
{
	var newGenes = {};
	var currentGene = undefined;
	
	for (var i = 0; i < SpecieGene.length; i++)
	{
		currentGene = SpecieGene[i]; 
		newGenes[currentGene[0]] = rand(currentGene[1][0], currentGene[1][1]);
	}
	
	return new Genome(newGenes);
}
Genome.getCrossOver = function(specieA, specieB)
{
	var crossOverPoint = Math.floor(rand(0, SpecieGene.length));
	
	var newGenes = {};
	var geneName = undefined;
	
	for (i = 0; i < crossOverPoint; i++)
	{
		geneName = SpecieGene[i][0];
		newGenes[geneName] = specieA[geneName];
	}
	
	for (i = crossOverPoint; i < SpecieGene.length; i++)
	{
		geneName = SpecieGene[i][0];
		newGenes[geneName] = specieB[geneName];
	}
	
	return new Genome(newGenes);
}
Genome.getMutation = function(oldGenome)
{
	var newGenes = {};
	var geneName, i;
	
	for (i = 0; i < SpecieGene.length; i++)
	{
		geneName = SpecieGene[i][0];
		newGenes[geneName] = oldGenome[geneName];

		if (rand(0, 1) < oldGenome.mutationRate)
			newGenes[geneName] += deviation(SpecieGene[i][1][1] / 75)
	}
	
	for (i = 0; i < SpecieGene.length; i++)
	{
		geneName = SpecieGene[i][0];
		
		if (newGenes[geneName] < 0)
			newGenes[geneName] = 0;
			
		if (i >= 4 && i <= 10)
		{
			if (newGenes[geneName] > 1)
				newGenes[geneName] = 1;
		}
	}
	
	return new Genome(newGenes);
}

Genome.prototype = {
	isSameSpecies: function(otherGenome)
	{
		var varience = 0;
		
		for (var i = 0; i < SpecieGene.length; i++)
		{
			var geneName = SpecieGene[i][0];
			var difference = Math.abs(this[geneName] - otherGenome[geneName]);
			
			if (difference === 0)
				continue;
			
			varience += difference / (this[geneName] - otherGenome[geneName]);
		}
		
		return ((varience/SpecieGene.length) < this.allowedVarience);
	}
}

function Specie(genome, posX, posY, born)
{
	this.genome = genome;
	this.posX = posX;
	this.posY = posY;
	this.born = (born === undefined) ? false : born;
	
	this.age = 0;
	this.sickNess = 0;

	this.food = 0;
	this.maxFood = this.genome.foodCapacity * this.genome.size;
	
	this.isMoving = false;
	this.isSick = false;
	
	this.movementBias = arrayRange(3); // [3,3]
	
	this.flag = 0;
	
	this.nextReproductionAge = Math.floor(this.genome.lifeSpan) * this.genome.adultHood;
	this.maxReproductionAge = Math.floor(this.genome.lifeSpan) * this.genome.oldAge;
	
	if (this.nextReproductionAge > this.maxReproductionAge)
		this.nextReproductionAge = Math.floor(this.genome.lifeSpan) + 1;
}
Specie.prototype = {
	move: function()
	{
		if (this.isMoving)
			return;
			
		this.isMoving = true;
		this.search();
		this.act(); // Inheritor
	},
	
	step: function()
	{
		this.age++;
		this.isMoving = false;
		
		var decreaseFoodWith = this.genome.hungerRate * this.genome.size;
		
		if (this.isSick)
		{
			this.sickNess++;
			decreaseFoodWith = (this.genome.hungerRate * (this.genome.sickRate + 1)) * this.genome.size;
			
			if (this.sickNess >= (this.genome.sickRate/4.3) * this.genome.lifeSpan)
			{
				this.isSick = false;
				this.sickNess = 0;
				
				this.flag = this.type;
				
				jsEco.changeWorldSickHerbivores(-1);
			}
		}

		this.food -= decreaseFoodWith;
		
		if (this.age >= Math.floor(this.genome.lifeSpan) || this.food <= 0)
		{
			// #TODO: This is herbivores specific code
			if (this.isSick)
			{
				jsEco.changeWorldSickHerbivores(-1);
			}
			
			return false;
		}
			
		return true;
	},
	
	findOpenSpace: function()
	{
		var openSpaceCount = 1;
		var newX = 0;
		var newY = 0;
		
		for (var x = this.posX - 1; x <= this.posX + 1; x++)
		{
			for (var y = this.posY - 1; y <= this.posY + 1; y++)
			{
				if (x < 0 || y < 0 || x > World.width || y > World.height)
					continue;
				
				if (jsEco.getWorldFlag(x, y) <= GridFlags.RottenVeg)
				{
					if (rand(0, 1) < 1 / openSpaceCount++)
					{
						newX = x;
						newY = y;
					}
				}
			}
		}
		
		return (newX !== 0 && newY !== 0) ? [newX, newY] : false;
	},
	
	getNextSpace: function()
	{
		var newX = this.posX;
		var newY = this.posY;
		
		var openSpaceCount = 1;
		var bestBias = (3.402823e-38);
		
		for (var x = 0; x < 3; x++)
		{
			for (var y = 0; y < 3; y++)
			{
				var gridX = this.posX + x - 1;
				var gridY = this.posY + y - 1;
				
				if (gridX < 0 || gridY < 0 || gridX >= World.width || gridY >= World.height)
					continue;
				
				if (this.movementBias[x][y] >= bestBias)
				{
					if (this.movementBias[x][y] == bestBias)
					{
						if (rand(0, 1) >= 1 / openSpaceCount++)
							continue;
					}
					else
					{
						openSpaceCount = 1;
					}
					
					bestBias = this.movementBias[x][y];
					newX = gridX;
					newY = gridY;
				}
			}
		}
		
		return [newX, newY];
	},
	
	getEmptySpace: function()
	{
		var openSpaceCount = 1;
		var emptyX = 0;
		var emptyY = 0;
		
		for (var x = this.posX - 1; x < this.posX + 1; x++)
		{
			for (var y = this.posY - 1; y < this.posY + 1; y++)
			{
				if (x < 0 || y < 0 || x >= World.width || y >= World.height)
					continue;
					
				if (jsEco.getWorldSpecie(x, y) !== undefined)
					continue;
					
				if (rand(0, 1) < 1 / openSpaceCount++)
				{
					emptyX = x;
					emptyY = y;
				}
			}
		}
		
		return (openSpaceCount === 1) ? false : [emptyX, emptyY]; 
	},
	
	canReproduce: function()
	{
		return (this.age > this.nextReproductionAge);
	},
	
	reproduce: function(targetSpecie)
	{
		if (this.canReproduce() && targetSpecie.canReproduce() && (rand(0, 1) < this.genome.reproductionRate))
		{
		// If the target specie and 'this' can reproduce, have hot steamy sex
		var emptySpace = this.getEmptySpace();
		
		if (emptySpace === false)
			return false;
		
		var newGenome = Genome.getCrossOver(this.genome, targetSpecie.genome);
		
		jsEco.addWorldSpecie(new Herbivore(Genome.getMutation(newGenome), emptySpace[0], emptySpace[1], true), true, false);
		
		this.nextReproductionAge += this.genome.reproductionSpan;
		if (this.nextReproductionAge > this.maxReproductionAge)
			this.nextReproductionAge = Math.floor(this.genome.lifeSpan) + 1;
			
		targetSpecie.nextReproductionAge += targetSpecie.genome.reproductionSpan;
		if (targetSpecie.nextReproductionAge > targetSpecie.maxReproductionAge)
			targetSpecie.nextReproductionAge = Math.floor(targetSpecie.genome.lifeSpan) + 1;
		
		return true;
		}
			
		return false;
	},
	
	search: function()
	{
		this.resetMovementBias();
		
		for (var y = this.posY - Math.floor(this.genome.sightRange); y <= this.posY + Math.floor(this.genome.sightRange); y++)
		{
			var width = Math.floor(this.genome.sightRange) - Math.abs(this.posY - y);

			for (var x = this.posX - width; x <= this.posX + width; x++)
			{
				if ((this.posX === x && this.posY === y) || x < 0 || x >= World.width || y < 0 || y >= World.height)
					continue;
				
				var distX = Math.abs(x - this.posX);
				var distY = Math.abs(y - this.posY);
				
				var bias = this.getBias(x, y);
				
				if (bias == 0)
					continue;
				
				var biasX = (distX != 0) ? bias/distX : 0;
				var biasY = (distY != 0) ? bias/distY : 0;
				
				var indexX = sign(x - this.posX) + 1;
				var indexY = sign(y - this.posY) + 1;
				
				if (distX >= distY)
					this.movementBias[indexX][1] += biasX;
				
				if (distY >= distX)
					this.movementBias[1][indexY] += biasY;
					
				if (bias > 0)
					this.movementBias[indexX][indexY] += biasX * biasY;
				else
					this.movementBias[indexX][indexY] -= biasX * biasY;
			}
		}
	},
	
	resetMovementBias: function()
	{
		for (var x = 0; x < 3; x++)
		{
			for (var y = 0; y < 3; y++)
			{
				this.movementBias[x][y] = 0;
			}
		}
	}
};

function Herbivore(genome, posX, posY, born)
{
	Specie.call(this, genome, posX, posY, born);
	
	this.food = this.maxFood * 0.5;
	
	this.type = Flags.Herbivore;
	this.flag = this.type;
}
Herbivore.prototype = clone(Specie.prototype);

Herbivore.prototype.getBias = function(posX, posY)
{
	var grass = jsEco.getWorldGrass(posX, posY);

	var bias = 2 * (grass.foodValue / GrassGene.maxFoodValue) * (1 - this.food / this.maxFood);
	
	var specie = jsEco.getWorldSpecie(posX, posY);
	
	if (specie === undefined)
		return bias;
	
	if (specie.type === this.type && this.genome.isSameSpecies(specie.genome))
	{
		bias += this.genome.herdBias;
		
		if (this.canReproduce() && specie.canReproduce())
			bias += 4;
	}
	else
	{
		var danger = specie.genome.size * specie.genome.thoughness;
		var defense = this.genome.size * this.thoughness * 0.75;
		
		if (danger > defense)
			bias -= 8;
	}
	
	return bias;
}
Herbivore.prototype.act = function()
{
	var nextSpace = this.getNextSpace();
	var newX = nextSpace[0];
	var newY = nextSpace[1];
	
	var specie = jsEco.getWorldSpecie(newX, newY);

	if (specie !== undefined)
	{
		if (specie.type == this.type && this.genome.isSameSpecies(specie.genome) && this.reproduce(specie))
			return;
	}
	else
	{
		/* Remove current 'me' from the map, update position and push new 'me' to the map */
		jsEco.removeWorldSpecie(this, false);
		this.posX = newX;
		this.posY = newY;
		jsEco.addWorldSpecie(this, false)
	}
	
	if (rand(0, 1) < this.genome.feedRate)
	{
		/* Get the grass for this position, if its rotten and this herbivore does not realize it, this herbivore may get sick */ 
		var grass = jsEco.getWorldGrass(this.posX, this.posY);
		
		if (grass.rotten)
		{
			/* If this herbivore is not smart enough to see it AND its gene its sickrate is valid */
			if (!this.isSick && rand(0, 1) < this.genome.smartness && rand(0, 1) < this.genome.sickRate)
			{
				this.isSick = true;
				this.flag = Flags.SickHerbivore;
				
				jsEco.changeWorldSickHerbivores(1);
			}
			else
			{
				return;
			}
		}
		
		if (this.isSick)
			this.food += grass.consume((this.maxFood - this.food) / 2);
		else
			this.food += grass.consume(this.maxFood - this.food);
	}
}

function Grass()
{
	this.growthRate = GrassGene.growthRate[0];
	this.decayRate = GrassGene.decayRate[0];

	this.foodValue = rand(0, GrassGene.maxFoodValue);
	
	if (Settings.grassRotts)
	{
		this.rottenRate = rand(GrassGene.growthRate[0], GrassGene.growthRate[1]);
		this.newFoodValue = 0;
	
		this.rottenValue = 0;
		this.rotten = false;
	}
}
Grass.prototype = {
	getFlag: function()
	{
		if (this.rotten)
			return Flags.RottenVeg;

		if (this.foodValue >= GrassGene.maxFoodValue)
			return Flags.HeavyVeg;
		
		return 1 << (this.foodValue/8 + 1);
	},
	
	step: function()
	{
		if (Settings.grassRotts && this.rotten)
		{
			this.newFoodValue += this.growthRate;
			
			if (this.newFoodValue > rand(2, 3))
			{
				this.rotten = false;
				this.foodValue = this.newFoodValue;
				this.rottenValue = 0;
				this.newFoodValue = 0;
				
				jsEco.changeWorldRottenGrass(-1);
			}
		}
		else
		{
			this.foodValue += this.growthRate;

			if (this.foodValue > GrassGene.maxFoodValue)
			{
				this.foodValue = GrassGene.maxFoodValue;
				
				if (Settings.grassRotts)
					this.rottenValue += this.rottenRate;
			}
			
			if (this.growthRate > GrassGene.growthRate[0])
				this.growthRate -= this.decayRate;
		
			if (Settings.grassRotts && this.rottenValue > GrassGene.maxRottenValue * (1+this.rottenRate))
			{
				this.rotten = true;
				this.rottenValue = GrassGene.maxRottenValue;
				this.newFoodValue = rand(0, 1);
				
				jsEco.changeWorldRottenGrass(1);
			}
		}
	},
	
	consume: function(maxAmount)
	{
		var amountConsumed = (this.foodValue > maxAmount) ? maxAmount : this.foodValue;
		this.foodValue -= amountConsumed;
		
		return amountConsumed;
	},
	
	fertilize: function(amount)
	{
		this.growthRate += amount;
	}
}

function View(globalContext, zoomContext, worldWidth, worldHeight)
{
	this.globalContext = globalContext;
	this.zoomContext = zoomContext;
	
	this.worldWidth = worldWidth;
	this.worldHeight = worldHeight;
	
	this.entitiesBuffer = arrayRange(worldHeight); 	// Buffer of the last view to compare with the newest
	this.entityFlags = arrayRange(worldHeight);		// Set flags to prevent redrawing of the whole map
	
	this.innerViewBuffer = arrayRange(25);			// Buffer of the last zoomed view
	
	this.globalRectSize = 22;
	this.zoomRectSize = 25;
	
	this.globalRectX = this.worldWidth/2 - this.globalRectSize/2;
	this.globalRectY = this.worldHeight/2 - this.globalRectSize/2;
	
	this.drawn = 0;
}
View.prototype = {
	setEntityFlags: function(toWhat)
	{
		for (var y = 0; y < this.worldHeight; y++)
		{
			for (var x = 0; x < this.worldWidth; x++)
			{
				this.entityFlags[y][x] = toWhat;
			}
		}
	},

	draw: function(entitiesMap)
	{
		for (var y = 0; y < this.worldHeight; y++)
		{
			for (var x = 0; x < this.worldWidth; x++)
			{
				if (entitiesMap[y][x] !== this.entitiesBuffer[y][x])
				{
					this.entitiesBuffer[y][x] = entitiesMap[y][x];					
					this.entityFlags[y][x] = true;
				}
			}
		}
		
		this.drawGlobal();
		this.drawZoom();
		this.setEntityFlags(false);
		
		var _drawn = this.drawn;
		this.drawn = 0;
		
		return _drawn;
	},
	
	drawZoom: function(push)
	{
		/* nearViewSize = globalRectSize = 22 */
		if (push === undefined)
			var push = false;
			
		var brushes;

		for (var y = this.globalRectY; y < this.globalRectY + this.globalRectSize; y++)
		{
			for (var x = this.globalRectX; x < this.globalRectX + this.globalRectSize; x++)
			{
				// Check if this co-ord is flagged for re-draw but does not require a push (i.e zoomRect update)
				if (this.entityFlags[y] === undefined || this.entityFlags[y][x] !== true && !push)
					continue;

				brushes = this.getBrushes(this.entitiesBuffer[y][x]);

				this.zoomContext.beginPath();
				this.zoomContext.rect((x - this.globalRectX) * this.zoomRectSize, (y - this.globalRectY) * this.zoomRectSize, this.zoomRectSize, this.zoomRectSize);
				this.zoomContext.closePath();
				
				this.zoomContext.fillStyle = brushes[0];
				this.zoomContext.fill();
				
				this.drawn++;
				
				if (brushes[1] !== undefined)
				{
					this.zoomContext.beginPath();
					this.zoomContext.arc((x - this.globalRectX) * this.zoomRectSize + 12, (y - this.globalRectY) * this.zoomRectSize + 12, 8, 0, Math.PI*2, false);
					this.zoomContext.closePath();
					
					this.zoomContext.fillStyle = brushes[1];
					this.zoomContext.fill();

					this.drawn++;
				}
			}
		}
	},
	
	drawGlobal: function()
	{
		this.globalContext.beginPath();
		
		var brushes;
		var brush;
		
		for (var y = 0; y < this.entitiesBuffer.length; y++)
		{
			for (var x = 0; x < this.entitiesBuffer[y].length; x++)
			{
				// Check if this co-ord is flagged for re-draw
				if (this.entityFlags[y] === undefined || this.entityFlags[y][x] !== true)
					continue;

				brushes = this.getBrushes(this.entitiesBuffer[y][x]);				
				brush = (brushes[1] !== undefined) ? brushes[1] : brushes[0];
				
				this.globalContext.fillStyle = brush;
				this.globalContext.fillRect(x, y, 1, 1);
				
				this.drawn++;
			}
		}
		
		this.drawZoomRect();
	},
	
	drawZoomRect: function()
	{
		this.globalContext.beginPath();
			
		for (var y = this.globalRectY; y <= this.globalRectY + this.globalRectSize; y += this.globalRectSize)
		{
			for (var x = this.globalRectX; x <= this.globalRectX + this.globalRectSize; x++)
			{
				this.globalContext.rect(x, y, 2, 2);
			}
		}
			
		for (var y = this.globalRectY + 1; y <= this.globalRectY + this.globalRectSize - 1; y ++)
		{
			for (var x = this.globalRectX; x <= this.globalRectX + this.globalRectSize; x+= this.globalRectSize)
			{
				this.globalContext.rect(x, y, 2, 2);
			}
		}

		this.globalContext.closePath();
			
		this.globalContext.fillStyle = '#900000';
		this.globalContext.fill();
		
		this.drawn++;
	},
	
	updateZoomRect: function(posX, posY, relative)
	{
		// Relative = keyboard as we don't get co-ords

		if (relative === undefined)
			var relative = false;

		if (relative === true)
		{
			var targetX = this.globalRectX + posX;
			var targetY = this.globalRectY + posY
			
			posX = this.globalRectX;
			posY = this.globalRectY;
		}
		else
		{
			var targetX = posX - this.globalRectSize/2;
			var targetY = posY - this.globalRectSize/2;
		}
		
		if (targetX < 0)
			targetX = 0;
		
		if (posX + this.globalRectSize > this.worldWidth || targetX + this.globalRectSize > this.worldWidth)
			targetX = this.worldWidth - this.globalRectSize;
			
		if (targetY < 0)
			targetY = 0;
		
		if (posY + this.globalRectSize > this.worldHeight || targetY + this.globalRectSize > this.worldHeight)
			targetY = this.worldHeight - this.globalRectSize;
		
		if (this.globalRectX === targetX && this.globalRectY == targetY)
			return;
	
		
		// #TODO: Reset sides only
		for (var y = this.globalRectY; y < this.globalRectY + this.globalRectSize + 2; y++)
		{
			for (var x = this.globalRectX; x < this.globalRectX + this.globalRectSize + 2; x++)
			{
				if (this.entityFlags[y] === undefined)
					this.entityFlags[y] = [];
				
				this.entityFlags[y][x] = true;
			}
		}

		this.globalRectX = targetX;
		this.globalRectY = targetY;
		
		this.drawZoom(true);
		this.drawGlobal();
	},
	
	getBrushes: function(flag)
	{
		var specieBrush;
		var grassBrush;

		if (flag > Flags.RottenVeg)
		{
			if ((flag & Flags.Herbivore) === Flags.Herbivore)
			{
				specieBrush = FlagColors[Flags.Herbivore]
				flag ^= Flags.Herbivore;
			}
			else if ((flag & Flags.SickHerbivore) === Flags.SickHerbivore)
			{
				specieBrush = FlagColors[Flags.SickHerbivore];
				flag ^= Flags.SickHerbivore;
			}
		}
		else
		{
			specieBrush = undefined;
		}
		
		grassBrush = FlagColors[flag];
		
		return [grassBrush, specieBrush];
	},
	
	getZoomRectPos: function()
	{
		return [this.globalRectX, this.globalRectY];
	}
}

window.onload = function()
{
	jsEco.init();
	htmlInteraction();
};