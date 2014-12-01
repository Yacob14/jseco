/**
 * Most of this is undocumented code
 * This hasn't been worked on since 05/21/2011
 */

//Update: given foundations to implement carnivore class (11/17/14)

function clone(object)
{
	function OneShotConstructor(){}
	OneShotConstructor.prototype = object;
	return new OneShotConstructor();
}

//returns a random number between min and max
function rand(min, max)
{
	return Math.random() * (max-min) + min;
}

//rounds to specified number of decimal places
function round(number, decimals)
{
	var x10 = Math.pow(10, decimals);
	return Math.round(number*x10)/x10;
}

//creates empty 2D array of size toRange by toRange
function arrayRange(toRange)
{
	var target = [];

	for (var i = 0; i < toRange; i++)
		target[target.length] = [];

	return target;
}

//return positive or negative one, depending on whether input values is positive or negative
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

var drawReady = 0;

function drawTile(){
	drawReady++;
}

var ImgSources = [
	"jseco_tiles/fish_tiles/gray.jpg",
	"jseco_tiles/fish_tiles/green2.jpg",
	"jseco_tiles/fish_tiles/green1.jpg",
	"jseco_tiles/fish_tiles/brown.jpg",
	"jseco_tiles/fish_tiles/Fish.png",
	"jseco_tiles/Sturgeon/Sturgeon.png"
];

/* All the used tile images are preloaded */

var grayImage = new Image();
grayImage.src = ImgSources[0];
grayImage.addEventListener('load', drawTile);

var green2Image = new Image();
green2Image.src = ImgSources[1];
green2Image.addEventListener('load', drawTile);

var green1Image = new Image();
green1Image.src = ImgSources[2];
green1Image.addEventListener('load', drawTile);

var brownImage = new Image();
brownImage.src = ImgSources[3];
brownImage.addEventListener('load', drawTile);

var fishImage = new Image();
fishImage.src = ImgSources[4];
fishImage.addEventListener('load', drawTile);

var sturgeonImage = new Image();
sturgeonImage.src = ImgSources[5];
sturgeonImage.addEventListener('load', drawTile);

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
	'SickHerbivore': 256,	// #000010

	'Carnivore' : 512,
	'SickCarnivore': 1024
};

var SpecieMax = {
	128 : 1400,       //Herbivore max
	512 : 1000		  //Carnivore max
};

var FlagColors = {
	0: '#FFFFFF',
	2: '#704D4D',
	4: '#32CD32',
	8: '#228B22',
	16: '#008000',
	32: '#006400',
	64: '#A58800', 	// #TODO: a more rotten color
	128: '#000090',
	256: '#000030', // #TODO: a more 'sick' color

	512: '#FF0000',
	1024: '#E65C00'
};

/* Tiles */
var FlagImages = {
	0: grayImage,
	2: grayImage,
	4: green2Image,
	8: green2Image,
	16: green1Image,
	32: green1Image,
	64: brownImage,
	128: fishImage,
	256: fishImage,
	512: sturgeonImage,
	1024: sturgeonImage
}

// [min, max]
var GrassGene = {
	'maxFoodValue': 	40,
	'maxRottenValue': 	50,

	'rottenRate': 		[0.0075, 0.25],
	'growthRate': 		[0.0075, 0.25],
	'decayRate': 		[0.0001]
};

//whenever this is referenced, remember that SpecieGene[i][1] refers to the pair
//of numbers next to the i-th gene name (ie. SpecieGene[2][1] == [5,40])
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

var CarnivoreGene = [
	['lifeSpan', 			[400, 500]],
	['size', 				[10, 50]],
	['reproductionSpan', 	[30, 40]],
	['reproductionRate', 	[0.25, 1]],
	['adultHood', 			[0.25, 0.5]],
	['oldAge',				[0.5, 0.75]],
	['feedRate', 			[0.25, 1]],
	['hungerRate', 			[0.01, 0.08]],
	['herdBias', 			[0.125, 1]],
	['sickRate',			[0.3, 0.4]],
	['smartness', 			[0.25, 1]],
	['foodCapacity', 		[2, 8]],
	['toughness', 			[0.125, 0.5]],
	['sightRange', 			[10, 20]]
];

var Settings = {
	'grassRotts': true,
	'zoomRectMovementSpeed': 1,
	'FPS': 10
};

function World()
{

	//three 2D arrays of size 200x200, each representing the position of grass, of a creature, and of flag to be drawn
	this.grassMap = arrayRange(World.height);
	this.speciesMap = arrayRange(World.height);
	this.entitiesMap = arrayRange(World.height);  //contains flags

	this.herbivoreCount = 0;
	this.herbivoresBorn = 0;
	this.herbivoresSpawned = 0;
	this.herbivoresEaten = 0;

	this.carnivoreCount = 0;
	this.carnivoresBorn = 0;
	this.carnivoresSpawned = 0;

	this.rottenGrassCount = 0;

	this.sickHerbivoresCount = 0;

	this.init();
}
World.width = 150;//200;
World.height = 150;//200;

World.prototype = {
	init: function(reset)
	{
		if (reset === undefined)
			reset = false;

		if (reset)
		{
			this.herbivoreCount = 0;
			this.herbivoresBorn = 0;
			this.herbivoresSpawned = 0;
			this.herbivoresEaten = 0;

			this.carnivoreCount = 0;
			this.carnivoresBorn = 0;
			this.carnivoresSpawned = 0;

			this.rottenGrassCount = 0;

			this.sickHerbivoresCount = 0;
		}

		for (var y = 0; y < World.height; y++)
		{
			for (var x = 0; x < World.width; x++)
			{
				//generates grass on every square on map
				this.grassMap[y][x] = new Grass();
				this.entitiesMap[y][x] = this.grassMap[y][x].getFlag();  //gives entity map the state of the grass

				//make sure there are no creatures out to start (or just remove all creatures if reset is called)
				if (this.speciesMap[y][x] !== undefined)
					this.speciesMap[y][x] = undefined;
			}
		}
	},

	update: function()
	{
		// traverse all of the squares on the maps
		for (var y = 0; y < World.height; y++)
		{
			for (var x = 0; x < World.width; x++) {
				//Update each grass and push updates to entities map
				this.grassMap[y][x].step();
				if (this.speciesMap[y][x] !== undefined)
					this.speciesMap[y][x].move();

				//remove dead creatures from the map
				if (this.speciesMap[y][x] !== undefined)
				{
					if (this.speciesMap[y][x].step() === false)
						this.removeSpecie(this.speciesMap[y][x], true);
				}

				//update the color flags in the entities map
				if ((this.entitiesMap[y][x] & this.grassMap[y][x]) === 0)   //what does this bitwise op do?
				{
					if (this.entitiesMap[y][x] <= Flags.RottenVeg)
						this.entitiesMap[y][x] = this.grassMap[y][x].getFlag();
					else
						this.entitiesMap[y][x] = this.grassMap[y][x].getFlag() | ((this.speciesMap[y][x] !== undefined) ? this.speciesMap[y][x].flag : this.speciesMap[y][x]);
				}
			}
		}
		return this.entitiesMap;   //everything is drawn with the entities map
	},

	addSpecie: function(specie, firstCall, isSpawned)
	{
		if (firstCall){
			if (specie.type == Flags.Herbivore)
				this.herbivoreCount++;
			else
				this.carnivoreCount++;
		}

		if (isSpawned){
			if (specie.type == Flags.Herbivore)
				this.herbivoresSpawned++;
			else
				this.carnivoresSpawned++;
		}

		if (firstCall && specie.born){
			if (specie.type == Flags.Herbivore)
				this.herbivoresBorn++;
			else
				this.carnivoresBorn++;
		}

		this.speciesMap[specie.posY][specie.posX] = specie;        //adds newly created creature into physical map
		this.entitiesMap[specie.posY][specie.posX] |= specie.type; //the type is all that is added to entities map
	},

	getEdibleGrass: function(){
		var totalEdibleGrass = 0;
		for (var i = 0; i < World.width; i++){
			for (var j = 0; j < World.height; j++){
				if (this.grassMap[i][j].getFlag() > 2)
					totalEdibleGrass++;
			}
		}

		return totalEdibleGrass;
	},

	removeSpecie: function(specie, isDead, isEaten)
	{
		this.speciesMap[specie.posY][specie.posX] = undefined;
		this.entitiesMap[specie.posY][specie.posX] ^= specie.type;

		var amount = 0.0025;

		if (isDead)
		{
			amount = specie.genome.size / 1000;
			if (specie.type == Flags.Herbivore){
				this.herbivoreCount--;

				if (specie.born)
					this.herbivoresBorn--;
				else
					this.herbivoresSpawned--;
			}
			else{
				this.carnivoreCount--;

				if (specie.born)
					this.carnivoresBorn--;
				else
					this.carnivoresSpawned--;
			}
		}

		if (isEaten)
			this.herbivoresEaten++;

		//when creature is removed (dies), it fertilizes the grass it was standing on
		this.grassMap[specie.posY][specie.posX].fertilize(amount);
	},

	//next three functions are generic getter functions that return properties at specific squares on map

	getFlag: function(posX, posY)
	{
		return this.entitiesMap[posY][posX];  //flags are on entities map
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

//here is where everything really starts
var jsEco = new function()
{
	var secondsRemain = 5 * 60;

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

		window.alert("There's a lot of fish around here, and soon they're going to eat everything! Press S to spawn sturgeons to eat the fish " +
		"so the forest is still standing. However, don't let the fishes all get eaten either. This is all about keeping them alive. Can you " +
		"keep everything in balance for five minutes?");

		setEventHandlers();

		world = new World(200,200); // globalCanvas.width, globalCanvas.height (these parameters aren't actually needed)
		view = new View(globalCanvas.getContext('2d'), zoomCanvas.getContext('2d'), World.width, World.height);

		randomSpawnSpecieGroup(20, Herbivore, 10);

		interval = setInterval(step, 1000/Settings.FPS);  //CALLS STEP FUNCTION REPEATEDLY, ANIMATING THE MAPS
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

	this.getWorldSpecie = function(posX, posY)
	{
		return world.getSpecie(posX, posY)
	};

	this.addWorldSpecie = function(specie, firstCall, isSpawned)
	{
		world.addSpecie(specie, firstCall, isSpawned);
	};

	this.removeWorldSpecie = function(specie, isDead, isEaten)
	{
		world.removeSpecie(specie, isDead, isEaten);
	}

	function timerTick() {
		if (secondsRemain > 0) {
			secondsRemain -= 1;
		}
		var minutes = Math.floor(secondsRemain/60);
		var seconds = secondsRemain%60;
		if (seconds < 10)
			return minutes + ":0" + seconds
		else
			return minutes + ":" + seconds;
	}

	function setEventHandlers()
	{
		globalCanvas.addEventListener('click', globalCanvasOnClick, false);
		document.addEventListener('keyup', globalCanvasKeyUp, false);
	}

	function globalCanvasOnClick(mouseEvent)
	{
		if (mouseEvent.offsetX && mouseEvent.offsetY){
			var posX = mouseEvent.offsetX;
			var posY = mouseEvent.offsetY;
		}
		else{
			var posX = mouseEvent.layerX - document.getElementById('global-canvas').offsetLeft;
			var posY = mouseEvent.layerY - document.getElementById('global-canvas').offsetTop;
		}

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
		 83: S(pawn)

		 85: U (spawn carnivore)*/

		if (keyEvent.keyCode === 67)
			continueStep();

		if (keyEvent.keyCode === 82)
			resetStep();

		if (keyEvent.keyCode === 83)
			userSpawnSpecieGroup(20, Carnivore);  //press 'S'

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
		randomSpawnSpecieGroup(20, Herbivore, 10);
		secondsRemain = 5 * 60;
	}

	function continueStep()
	{
		if (interval === undefined)
			interval = setInterval(step, 1000/Settings.FPS);
	}

	function userSpawnSpecieGroup(amount, type){
		//point to roughly the center coordinates of the zoomRect
		var zoomRectPos = view.getZoomRectPos();
		var posX = zoomRectPos[0] + 12;
		var posY = zoomRectPos[1] + 12;
		spawnSpecieGroup(amount, type, [posX, posY]);
	}

	function randomSpawnSpecieGroup(amount, type, numGroups){
		var i;
		for (i = 0; i < numGroups; i++){
			var posX = Math.floor(rand(0, World.width));
			var posY = Math.floor(rand(0, World.height));
			spawnSpecieGroup(amount, type, [posX, posY]);
		}
	}

	function spawnSpecieGroup(amount, type, coordinates)
	{
		var posX = coordinates[0];
		var posY = coordinates[1];

		//spawning occurs within a 10x10 square centered at (posX, posY)
		var minX = (posX - 5 < 0) ? 0 : posX - 5;
		var minY = (posY - 5 < 0) ? 0 : posY - 5;
		var maxX = (posX + 5 >= World.width) ? World.width : posX + 5;
		var maxY = (posY + 5 >= World.width) ? World.height : posY + 5;

		var specieGenome = (type === Herbivore) ? Genome.getRandom(SpecieGene) : Genome.getRandom(CarnivoreGene);

		for (var i = 0; i < amount; i++)
		{
			//spawn points are kept within the 10x10 square
			var spawnX = Math.floor(rand(minX, maxX));
			var spawnY = Math.floor(rand(minY, maxY));

			// One specie per co-ord
			if (jsEco.getWorldSpecie(spawnX, spawnY) !== undefined)
				continue;

			jsEco.addWorldSpecie(new type(Genome.getMutation(specieGenome), spawnX, spawnY, false), true, true);
		}
	}

	//moves the Zoom rectangle on the minimap depending on the arrow key that's pressed
	//gives parameters to View.updateZoomRect(...)
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

	function checkWinCondition(){
		if (world.getEdibleGrass()/(World.width*World.height) < .01 || world.herbivoreCount === 0) {
			window.alert("Game Over");
			resetStep()
		}
		else if (secondsRemain === 0) {
			window.alert("You Win!");
			resetStep();
		}
	}

	//this function is what "animates" the entire application. First part updates canvases, and second part updates html text
	function step()
	{
		// Draw call is located here! sends the entity array to view.draw()
		drawCalls += view.draw(world.update());

		frameCount++;

		checkWinCondition();

		// Second has passed? Update info elements
		if (frameCount == Settings.FPS)
		{

			document.getElementById('time').innerHTML = "Time Remaining: " + timerTick();
			document.getElementById('habitable-grass').innerHTML = "Habitable: " + round((100 * world.getEdibleGrass())/(World.width*World.height), 0) + "%";

			document.getElementById('herbivore-alive').innerHTML = world.herbivoreCount;

			document.getElementById('carnivores-alive').innerHTML = world.carnivoreCount;


			drawCalls = 0;
			frameCount = 0;
		}
	}
}
//gives an array of genes + values to whatever object calls this
function Genome(genes)
{
	if (genes === undefined)
		return false;

	this.allowedVarience = 0.05;
	this.mutationRate = 0.1;

	for (var i = 0; i < SpecieGene.length; i++)
	{
		this[SpecieGene[i][0]] = genes[SpecieGene[i][0]];  //function creates own list of specie gene names
	}
}

//generates new 'genes' which are string of random numbers taken from the SpecieGene array
//or the CarnivoreGene array and uses them to return a new Genome object
Genome.getRandom = function(geneSet)
{
	var newGenes = {};
	var currentGene = undefined;

	for (var i = 0; i < geneSet.length; i++)
	{
		currentGene = geneSet[i];
		newGenes[currentGene[0]] = rand(currentGene[1][0], currentGene[1][1]);
	}

	return new Genome(newGenes);
}

//simulates the crossing of genes when two species reproduce. The degree
//to which the genes are split depends on the crossOverPoint
Genome.getCrossOver = function(specieA, specieB)
{
	var crossOverPoint = Math.floor(rand(0, SpecieGene.length));

	var newGenes = {};
	var geneName = undefined;

	for (i = 0; i < crossOverPoint; i++)
	{
		geneName = SpecieGene[i][0];  //one of the strings in SpecieGene
		newGenes[geneName] = specieA[geneName];
	}

	for (i = crossOverPoint; i < SpecieGene.length; i++)
	{
		geneName = SpecieGene[i][0];
		newGenes[geneName] = specieB[geneName];
	}

	return new Genome(newGenes);
}

//returns a genome that has slight mutations from the genome in the parameter
Genome.getMutation = function(oldGenome, geneSet)
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

	//determines if the genes of the genome calling this function has a low enough numerical difference
	//between the gene values of the parameter genome. If so, they are considered the same species
	isSameSpecies: function(otherGenome)
	{
		var varience = 0;

		for (var i = 0; i < SpecieGene.length; i++)
		{
			var geneName = SpecieGene[i][0];
			var difference = Math.abs(this[geneName] - otherGenome[geneName]);
			//var difference = 2;

			if (difference === 0)
				continue;

			varience += (difference / (this[geneName] - otherGenome[geneName]));
		}

		return ((varience/SpecieGene.length) < this.allowedVarience);
	}
}

//the actual creatures moving around on the map
function Specie(genome, posX, posY, born)
{
	this.genome = genome;
	this.posX = posX;
	this.posY = posY;
	this.born = (born === undefined) ? false : born;
	this.facingLeft = false;

	this.age = 0;
	this.sickNess = 0;

	this.food = 0;
	this.maxFood = this.genome.foodCapacity * this.genome.size;

	this.isMoving = false;
	this.isSick = false;

	//the bias towards each square surrounding the creature (affecting where it will move)
	this.movementBias = arrayRange(3); // [3,3]

	this.flag = 0;

	this.nextReproductionAge = Math.floor(this.genome.lifeSpan) * this.genome.adultHood;
	this.maxReproductionAge = Math.floor(this.genome.lifeSpan) * this.genome.oldAge;

	if (this.nextReproductionAge > this.maxReproductionAge)
		this.nextReproductionAge = Math.floor(this.genome.lifeSpan) + 1;
}
Specie.prototype = {

	//calls the methods that make the creatures change locations
	move: function()
	{
		if (this.isMoving)
			return;

		this.isMoving = true;
		this.search();
		this.act(); // Inheritor (defined by subclasses)
	},

	//called every time World.update() is called
	//simulates aging/passing of time on creatures
	step: function()
	{
		this.age++;
		this.isMoving = false;

		var decreaseFoodWith = this.genome.hungerRate * this.genome.size;

		if (this.isSick)
		{
			this.sickNess++;   //sickness levels go up as long as creature is sick
			decreaseFoodWith = (this.genome.hungerRate * (this.genome.sickRate + 1)) * this.genome.size;

			if (this.sickNess >= (this.genome.sickRate/4.3) * this.genome.lifeSpan)
			{
				this.isSick = false;  //stops being sick when sickness level finally reaches certain point
				this.sickNess = 0;

				this.flag = this.type;

				jsEco.changeWorldSickHerbivores(-1);
			}
		}

		//if (this.type === Flags.Herbivore)
		this.food -= decreaseFoodWith;  //over time, creature gets hungrier (even more so when sick)

		if ((this.age >= Math.floor(this.genome.lifeSpan) || this.food <= 0) && this.immortal != true)   //check if it has starved or gotten too old
		{
			// #TODO: This is herbivores specific code
			if (this.isSick)
			{
				jsEco.changeWorldSickHerbivores(-1);  //if it was sick when it died, then sickness count must decrement
			}

			return false;   //a false return means creature has died
		}

		return true;        //if still has food and has not passed life span, then it's still alive
	},

	//gets coordinates of new square that species will move to
	//does this by comparing corresponding values in movementBias array
	getNextSpace: function()
	{
		var newX = this.posX;
		var newY = this.posY;

		var openSpaceCount = 1;
		var bestBias = (3.402823e-38);  //represents the best available option for creature to take (not sure why doesn't start at 0)

		//go through the eight squares surrounding the creature, as well as the square it's standing on currently
		for (var x = 0; x < 3; x++)
		{
			for (var y = 0; y < 3; y++)
			{
				//the actual world map positions corresponding the creature's surrounding squares
				var gridX = this.posX + x - 1;
				var gridY = this.posY + y - 1;

				if (gridX < 0 || gridY < 0 || gridX >= World.width || gridY >= World.height)
					continue;  //again, can't break world borders

				//checks for the bias value of the adjacent square and updates bestBias if this square has a better bias
				if (this.movementBias[x][y] >= bestBias)
				{
					if (this.movementBias[x][y] == bestBias)
					{
						//if more than one spaces have same bias, randomly decide if its coordinates replace others
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
		this.facingLeft = newX < this.posX;
		return [newX, newY];  //these are the square coordinates the creature will move to
	},

	//return coordinates of an empty space adjacent to the creature
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
		if (this.type === Flags.Herbivore)
			return (this.age > this.nextReproductionAge && this.food > this.maxFood * .5);
		else
			return (this.age > this.nextReproductionAge && this.food > this.maxFood * .33);
	},

	reproduce: function(targetSpecie)
	{
		if (this.canReproduce() && targetSpecie.canReproduce() && (rand(0, 1) < this.genome.reproductionRate) && this.type === targetSpecie.type)
		{
			// If the target specie and 'this' can reproduce, have hot steamy sex
			var emptySpace = this.getEmptySpace();

			if (emptySpace === false)
				return false;  // no room for new creature to be born

			var newGenome = Genome.getCrossOver(this.genome, targetSpecie.genome);

			if (this.type === Flags.Herbivore)
				jsEco.addWorldSpecie(new Herbivore(Genome.getMutation(newGenome), emptySpace[0], emptySpace[1], true), true, false);
			else
				jsEco.addWorldSpecie(new Carnivore(Genome.getMutation(newGenome), emptySpace[0], emptySpace[1], true), true, false);


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

	//the biases found in each searchable spot is sent to movementBias array
	search: function()
	{
		this.resetMovementBias();  //previous movement biases cleared once in new spot

		//search extends as far as the creature's sightRange
		//the overall search is done in a diamond-shaped area of squares
		for (var y = this.posY - Math.floor(this.genome.sightRange); y <= this.posY + Math.floor(this.genome.sightRange); y++)
		{
			var width = Math.floor(this.genome.sightRange) - Math.abs(this.posY - y);

			for (var x = this.posX - width; x <= this.posX + width; x++)
			{
				if ((this.posX === x && this.posY === y) || x < 0 || x >= World.width || y < 0 || y >= World.height)
					continue;  //disregard creature's own space as well as spaces out of bounds

				//distance of coordinates from the creature's coordinates
				var distX = Math.abs(x - this.posX);
				var distY = Math.abs(y - this.posY);

				var bias = this.getBias(x, y);  //get bias generated by square

				if (bias == 0)
					continue;

				//bias generated from a square is cut down by its distance from the creature
				var biasX = (distX != 0) ? bias/distX : 0;
				var biasY = (distY != 0) ? bias/distY : 0;

				//estimates the closest square adjacent to the creature in relation to the square it has searched
				//and gives an index in terms of the square's position in the movementBias array
				var indexX = sign(x - this.posX) + 1;
				var indexY = sign(y - this.posY) + 1;

				//the final biases are applied to the movementBias array
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
	},

	consume: function()
	{
		var amountConsumed = this.food;
		jsEco.removeWorldSpecie(this, true, true);
		return amountConsumed;
	}
};

//HERBIVORE IS BASICALLY A SUBCLASS OF SPECIES
function Herbivore(genome, posX, posY, born)
{
	Specie.call(this, genome, posX, posY, born);  //call Specie constructor, where all instances of 'this' now refer to Herbivore object

	this.food = this.maxFood * 0.5;  //herbivores all start at halfway hunger
	//this.immortal = true;

	this.type = Flags.Herbivore;
	this.flag = this.type;
}
Herbivore.prototype = clone(Specie.prototype);   //Herbivore gets all of Specie's prototype methods/variables

//the bias is the likelihood that an herbivore will move to a certain space
//this method gets the bias at the space in the specified coordinates
Herbivore.prototype.getBias = function(posX, posY)
{
	var grass = jsEco.getWorldGrass(posX, posY);

	//the bias generated by the grass at (posX, posY) depends on
	//how much food the grass has as well as how hungry the herbivore is
	var bias = 2 * (grass.foodValue / GrassGene.maxFoodValue) * (1 - this.food / this.maxFood);

	//presence of another creature in space also affects bias

	var specie = jsEco.getWorldSpecie(posX, posY);

	if (specie === undefined)
		return bias;

	//if the space does contain another creature...

	if (specie.type === this.type && this.genome.isSameSpecies(specie.genome))
	{
		bias += this.genome.herdBias;

		//herbivore will be more inclined to seek out a space with a potential mate
		if (this.canReproduce() && specie.canReproduce())
			bias += 4;
	}
	else
	{
		var danger = specie.genome.size * specie.genome.toughness;
		var defense = this.genome.size * this.genome.toughness * 0.75;

		if (danger > defense && rand(0, 1) < this.genome.smartness)
			bias -= 8;
	}

	return bias;
}
Herbivore.prototype.act = function()
{
	//FIRST: herbivore moves to its desired spot
	var nextSpace = this.getNextSpace();  //gets coords of next square that creature will move to
	var newX = nextSpace[0];
	var newY = nextSpace[1];

	var specie = jsEco.getWorldSpecie(newX, newY);  //see if there's another creature at nextSpace

	if (specie !== undefined)
	{
		if (specie.type == this.type && this.genome.isSameSpecies(specie.genome) && this.reproduce(specie))
			return;
	}
	else
	{
		/* Remove current herbivore from the map, update position and push new herbivore to the map */
		jsEco.removeWorldSpecie(this, false);
		this.posX = newX;
		this.posY = newY;
		jsEco.addWorldSpecie(this, false);
		jsEco.getWorldGrass(this.posX, this.posY).scent = 2 * this.genome.size;
	}

	//SECOND: Herbivore decides whether or not it wants to eat the grass. Eats when it makes a decision.
	if (rand(0, 1) < this.genome.feedRate)
	{
		/* Get the grass for this position, if its rotten and this herbivore does not realize it, this herbivore may get sick */
		var grass = jsEco.getWorldGrass(this.posX, this.posY);

		if (grass.rotten)
		{
			/* If this herbivore is not smart enough to see it AND its gene for sickrate is valid */
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

		//eats the grass
		if (this.isSick)
			this.food += grass.consume((this.maxFood - this.food) / 2);
		else
			this.food += grass.consume(this.maxFood - this.food);
	}
}

function Carnivore(genome, posX, posY, born){
	Specie.call(this, genome, posX, posY, born);

	this.food = this.maxFood * .5;
	//this.genome.sightRange += 23;  //carnivores need more range to see meat
	//this.genome.hungerRate /= 2; //carnivores have harder time finding food, so have them get hungry slowly
	//this.genome.reproductionSpan += 10;

	//this.immortal = true;

	this.type = Flags.Carnivore;
	this.flag = this.type;
}

Carnivore.prototype = clone(Specie.prototype);

//the bias is the likelihood that a carnivore will move to a certain space
//this method gets the bias at the space in the specified coordinates
Carnivore.prototype.getBias = function(posX, posY)
{
	var bias = 0;

	//presence of another creature in space also affects bias

	var specie = jsEco.getWorldSpecie(posX, posY);

	if (specie === undefined)
		return bias;

	//if the space does contain another creature...

	if (specie.type === this.type && this.genome.isSameSpecies(specie.genome))
	{
		bias += this.genome.herdBias;

		//carnivore will be more inclined to seek out a space with a potential mate
		if (this.canReproduce() && specie.canReproduce())
			bias += 4;
	}
	else
	{
		if (specie.type === Flags.Herbivore){
			bias += 2 * (specie.food/specie.maxFood) * (1 - this.food/ this.maxFood);
		}
		else{
			var danger = specie.genome.size * specie.genome.toughness;
			var defense = this.genome.size * this.genome.toughness * 0.75;

			if (danger > defense)
				bias -= 8;
		}
	}

	return bias;

}
//Carnivore.prototype.act = Herbivore.prototype.act;

Carnivore.prototype.act = function()
{
	//FIRST: carnivore looks at spot and sees if it's occupied. If so, does it eat the target or mate with it or neither?
	var nextSpace = this.getNextSpace();  //gets coords of next square that creature will move to
	var newX = nextSpace[0];
	var newY = nextSpace[1];

	var specie = jsEco.getWorldSpecie(newX, newY);  //see if there's another creature at nextSpace

	if (specie !== undefined)
	{
		if (specie.type == this.type && this.genome.isSameSpecies(specie.genome) && this.reproduce(specie))
			return;

		else if (specie.type == Flags.Herbivore && rand(0, 1) < this.genome.feedRate){
			var amountConsumed = specie.consume();
			this.food = ((amountConsumed + this.food) > this.maxFood) ? this.maxFood : amountConsumed + this.food;
			return; //good idea?
		}
	}

	//SECOND: carnivore moves to nextSpace if it's empty
	else{
		jsEco.removeWorldSpecie(this, false);
		this.posX = newX;
		this.posY = newY;
		jsEco.addWorldSpecie(this, false)
	}

}


function Grass()
{
	this.growthRate = GrassGene.growthRate[0];
	this.decayRate = GrassGene.decayRate[0];

	//Amount of food that the grass can give to whatever eats it. Increases over time.
	//It's initialized at a random value
	this.foodValue = rand(0, GrassGene.maxFoodValue);

	this.scent = 0;  //the scent left behind from an herbivore's presence.

	if (Settings.grassRotts)
	{
		//rate of how rottenValue increases per step
		this.rottenRate = rand(GrassGene.growthRate[0], GrassGene.growthRate[1]);

		//amount of food to be given to a newly grown grass
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

		return 1 << (this.foodValue/8 + 1);   //comes out to any of the other '-Veg' flag values
	},

	//changes the state of the grass over time
	step: function()
	{
		if (Settings.grassRotts && this.rotten)
		{
			this.newFoodValue += this.growthRate;

			//before the value of a new grass is invoked, that value is accumulated in newFoodValue
			//it will be officially not rotten somewhere between a value of 2 and 3
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
			this.foodValue += this.growthRate * .5;

			if (this.foodValue > GrassGene.maxFoodValue)
			{
				this.foodValue = GrassGene.maxFoodValue;   //food value of a grass can't go past a certain point

				if (Settings.grassRotts)
					this.rottenValue += this.rottenRate;   //starts to rot after hitting max
			}

			if (this.growthRate > GrassGene.growthRate[0])
				this.growthRate -= this.decayRate;

			//conditions for setting grass to rotten state (namely, when grass's rotten value goes over max)
			if (Settings.grassRotts && this.rottenValue > GrassGene.maxRottenValue * (1+this.rottenRate))
			{
				this.rotten = true;
				this.rottenValue = GrassGene.maxRottenValue;
				this.newFoodValue = rand(0, 1);

				jsEco.changeWorldRottenGrass(1);
			}
		}
	},

	//simulates the grass being eaten
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
	this.entityFlags = arrayRange(worldHeight);		// Set flags to prevent redrawing of the whole map (different flags than EntitiesMap)

	this.innerViewBuffer = arrayRange(25);			// Buffer of the last zoomed view

	this.globalRectSize = 22;                       //big screen is 22x22 squares
	this.zoomRectSize = 25;							//each square in zoomContext canvas is 25x25 px

	//sets the red rectangle and the corresponding Zoom view in the center of the map
	this.globalRectX = this.worldWidth/2 - this.globalRectSize/2;
	this.globalRectY = this.worldHeight/2 - this.globalRectSize/2;

	this.drawn = 0;
}
View.prototype = {

	testDraw: function(x, y)
    {
		this.globalContext.fillStyle('#FF0000');
		this.globalContext.fillRect(x, y, 1, 1);
    },

	//set the EntityFlags flags all to either true or false
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
		//traverses entitiesMap and updates the entitiesBuffer
		for (var y = 0; y < this.worldHeight; y++)
		{
			for (var x = 0; x < this.worldWidth; x++)
			{
				if (entitiesMap[y][x] !== this.entitiesBuffer[y][x])
				{
					this.entitiesBuffer[y][x] = entitiesMap[y][x];

					//entityFlags marks changes in entitiesBuffer so only necessary redraws are made on corresponding squares
					this.entityFlags[y][x] = true;
				}
			}
		}

		this.drawGlobal();
		this.drawZoom();
		this.setEntityFlags(false);   //everything is drawn to satisfy the 'true' flags, so reset all the flags to 'false'

		var _drawn = this.drawn;
		this.drawn = 0;

		return _drawn;
	},

	drawZoom: function(push)
	{
		/* nearViewSize = globalRectSize = 22 */
		if (push === undefined)
			var push = false;

		var image;

		//traverse through all the squares within the red global rectangle

		for (var y = this.globalRectY; y < this.globalRectY + this.globalRectSize; y++)
		{
			for (var x = this.globalRectX; x < this.globalRectX + this.globalRectSize; x++)
			{
				// Check if this co-ord is flagged for re-draw but does not require a push (i.e zoomRect update)
				if (this.entityFlags[y] === undefined || this.entityFlags[y][x] !== true && !push)
					continue;

				//get the image that the flag at this location refers to
				image = this.getImage(this.entitiesBuffer[y][x], FlagImages);
				this.zoomContext.drawImage(image[0], (x - this.globalRectX) * this.zoomRectSize, (y - this.globalRectY) * this.zoomRectSize);
				this.drawn++;

				if (image[1] !== undefined && drawReady === ImgSources.length)  //if there is a creature occupying the square (whose colored returned)
				{
					this.zoomContext.drawImage(image[1], (x - this.globalRectX) * this.zoomRectSize, (y - this.globalRectY) * this.zoomRectSize);
				}

					this.drawn++;

			}
		}
	},

	//draws the minimap in the globalContext canvas
	drawGlobal: function()
	{
		this.globalContext.beginPath(); //start drawing

		var brushes;
		var brush;

		for (var y = 0; y < this.entitiesBuffer.length; y++)
		{
			for (var x = 0; x < this.entitiesBuffer[y].length; x++)
			{
				// Check if this co-ord is flagged for re-draw
				if (this.entityFlags[y] === undefined || this.entityFlags[y][x] !== true)
					continue;

				brushes = this.getImage(this.entitiesBuffer[y][x], FlagColors);
				brush = (brushes[1] !== undefined) ? brushes[1] : brushes[0];

				this.globalContext.fillStyle = brush;
				this.globalContext.fillRect(x, y, 1, 1);

				this.drawn++;
			}
		}

		this.drawZoomRect();
	},

	//draws the red global Rectangle over the global map
	drawZoomRect: function()
	{
		this.globalContext.beginPath();  //starts drawing on Canvas

		for (var y = this.globalRectY; y <= this.globalRectY + this.globalRectSize; y += this.globalRectSize)
		{
			for (var x = this.globalRectX; x <= this.globalRectX + this.globalRectSize; x++)
			{
				this.globalContext.rect(x, y, 2, 2); //draw method
			}
		}

		for (var y = this.globalRectY + 1; y <= this.globalRectY + this.globalRectSize - 1; y ++)
		{
			for (var x = this.globalRectX; x <= this.globalRectX + this.globalRectSize; x+= this.globalRectSize)
			{
				this.globalContext.rect(x, y, 2, 2);
			}
		}

		this.globalContext.closePath();  //ends drawing on Canvas

		this.globalContext.fillStyle = '#900000';
		this.globalContext.fill();

		this.drawn++;
	},

	//lets the zoom rectangle move around by updating its coordinates
	updateZoomRect: function(posX, posY, relative)
	{
		// Relative = keyboard as we don't get co-ords

		if (relative === undefined)
			var relative = false;

		if (relative === true)
		{
			var targetX = this.globalRectX + posX;
			var targetY = this.globalRectY + posY

			//set parameters to original global rectangle position coords
			posX = this.globalRectX;
			posY = this.globalRectY;
		}
		else
		{
			//target coordinates point back towards middle of global map
			var targetX = posX - this.globalRectSize/2;
			var targetY = posY - this.globalRectSize/2;
		}

		//next four conditionals make sure that rectangle doesn't go out of bounds
		if (targetX < 0)
			targetX = 0;

		if (posX + this.globalRectSize > this.worldWidth || targetX + this.globalRectSize > this.worldWidth)
			targetX = this.worldWidth - this.globalRectSize;

		if (targetY < 0)
			targetY = 0;

		if (posY + this.globalRectSize > this.worldHeight || targetY + this.globalRectSize > this.worldHeight)
			targetY = this.worldHeight - this.globalRectSize;

		//leave method if rectangle can't move
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

		//make target coords equal globalRect coords
		this.globalRectX = targetX;
		this.globalRectY = targetY;

		//redraw
		this.drawZoom(true);
		this.drawGlobal();
	},

	//using the flags in entitiesMap (or entitiesBuffer), this method returns either the fill-color or the image
	//associated with the flag's number. Pull the necessary resources from either FlagImages or FlagColors
	//(specified in flagSet parameter)
	getImage : function(flag, flagSet){
		var specieImg;
		var grassImg;

		if (flag > Flags.RottenVeg)
		{
			if ((flag & Flags.Herbivore) === Flags.Herbivore)
			{
				specieImg = flagSet[Flags.Herbivore]
				flag ^= Flags.Herbivore;
			}
			else if ((flag & Flags.SickHerbivore) === Flags.SickHerbivore)
			{
				specieImg = flagSet[Flags.SickHerbivore];
				flag ^= Flags.SickHerbivore;
			}
			else if ((flag & Flags.Carnivore) === Flags.Carnivore)
			{
				specieImg = flagSet[Flags.Carnivore];
				flag ^= Flags.Carnivore;
			}
			else if ((flag & Flags.SickCarnivore) === Flags.SickCarnivore)
			{
				specieImg = flagSet[Flags.SickCarnivore];
				flag ^= Flags.Carnivore;
			}
		}
		else
		{
			specieImg = undefined;
		}

		grassImg = flagSet[flag];

		return [grassImg, specieImg];
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

