var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var frameRate = 120;
var secondsPerDatapoint = 5;
var numDataPoints = 30;
var boidsContext = document.getElementById("canvas").getContext("2d");
var info = document.getElementById("info");
var genomeChartContext = document.getElementById("genomeChart").getContext("2d");
var genomeChart;
var fitnessChartContext = document.getElementById("fitnessChart").getContext("2d");
var fitnessChart;
var allGenomesChartContext = document.getElementById("allGenomesChart").getContext("2d");
var allGenomesChart;
var allFitnessesChartContext = document.getElementById("allFitnessesChart").getContext("2d");
var allGenomesChart;
Chart.defaults.global.animation = false;
Chart.defaults.global.showTooltips = false;

var f;
var saveAndResetCurrentCharts = function () {
  allGenomesChart.datasets = allGenomesChart.datasets.concat(genomeChart.datasets);
  allFitnessesChart.datasets = allFitnessesChart.datasets.concat(fitnessChart.datasets);
  updateGlobalCharts();
  resetCharts();
  f = new Flock();
  f.run();
}

var updateGlobalCharts = function () {
  allGenomesChart.update();
  allFitnessesChart.update();
}

var resetCharts = function () {
  genomeChart = new Chart(genomeChartContext).Line({
    labels: [0],
    datasets: [
      {
        strokeColor: "rgba(128,0,0,0.5)",
        data: [0]
      },
      {
        strokeColor: "rgba(255,0,0,0.5)",
        data: [0]
      },
      {
        strokeColor: "rgba(0,128,0,0.5)",
        data: [0]
      },
      {
        strokeColor: "rgba(0,0,255,0.5)",
        data: [0]
      },
      {
        strokeColor: "rgba(0,255,255,0.5)",
        data: [0]
      },
    ]
  },
  {
    bezierCurve: false,
    datasetFill: false,
    pointDot: false,
  });

  fitnessChart = new Chart(fitnessChartContext).Line({
    labels: [0],
    datasets: [
      {
        strokeColor: "rgba(0,0,0,0.5)",
        data: [0]
      }
    ]
  },
  {
    bezierCurve: false,
    datasetFill: false,
    pointDot: false,
  });
}

var theLabels = [];
var dumbData = [];
for (var i = 0; i <= numDataPoints; i++) {
  theLabels.push(secondsPerDatapoint*frameRate*i);
  dumbData.push(0);
}

var allGenomesChart = new Chart(allGenomesChartContext).Line({
  labels: theLabels, 
  datasets: [
    {
      strokeColor: "rgba(0,0,0,0)",
      data: dumbData
    }
  ]
},
{
  bezierCurve: false,
  datasetFill: false,
  pointDot: false,
});

var allFitnessesChart = new Chart(allFitnessesChartContext).Line({
  labels: theLabels, 
  datasets: [
    {
      strokeColor: "rgba(0,0,0,0)",
      data: dumbData
    }
  ]
},
{
  bezierCurve: false,
  datasetFill: false,
  pointDot: false,
});

// everything is arbitrary!
var maxSpeed = 3;
var minSpeed = 1;
var maxAcceleration = 1;
var neighborDistance = 60;
var collisionDistance = 6;
var velocitySameness = 2;
var startingNumberOfBoids = 80;
var mutationFactor = 0.2;
var lonelyDeathProbability = 0.08;


var setup = function() {
  resetCharts();
  f = new Flock();
  f.run();
}

var Flock = function () {
  this.timestep = 0;
  this.boidList = [];

  var xstep = canvasWidth/Math.sqrt(startingNumberOfBoids);
  var ystep = canvasHeight/Math.sqrt(startingNumberOfBoids);
  var xstart = 0;
  var ystart = 0;
  var startGenome = [0,0,0,0,0,0];
  for (var i = 0; i < startingNumberOfBoids; i++) {
    this.boidList.push(new Boid(startGenome, xstart, ystart));
    xstart += xstep;
    if (xstart > canvasWidth) {
      xstart = 0;
      ystart += ystep;
    }
  }
}

Flock.prototype = {
  evolveNewBoid: function (parentsList) {
    // decide on the parents
    var firstParent = this.boidList[Math.round(Math.random()*(this.boidList.length-1))];
    var secondParent = this.boidList[Math.round(Math.random()*(this.boidList.length-1))];

    // create the new genome
    var newGenome = [0,0,0,0,0,0];
    var crossoverPoint = Math.round(Math.random()*(newGenome.length-1));
    for (var i = 0; i < newGenome.length; i++) {
      if (i < crossoverPoint) {
        newGenome[i] = firstParent.genome[i]+mutationFactor*(Math.random()-0.5);
      } else {
        newGenome[i] = secondParent.genome[i]+mutationFactor*(Math.random()-0.5);
      }
    }

    // decide on a random position
    var xpos = Math.round(canvasWidth*Math.random());
    var ypos = Math.round(canvasHeight*Math.random());

    return new Boid(newGenome, xpos, ypos);
  },
  run: function () {
    // clear the canvas
    boidsContext.clearRect ( 0 , 0 , canvasWidth, canvasHeight);

    // gather info about the boids
    var genomeAverages = [0,0,0,0,0,0];
    var fitnessTotal = 0;

    // the possible reproducing boids
    var parentsList = [];

    // iterate over boids
    var boidsToBeKilled = {};
    for (var i = 0; i < this.boidList.length; i++) {
      var boid = this.boidList[i];
      var resultObj = boid.update(i, this.boidList);
      var theseBoidsToBeKilled = resultObj.collidingBoids;
      if (theseBoidsToBeKilled.length > 0) {
        for (var j = 0; j < theseBoidsToBeKilled.length; j++) {
          boidsToBeKilled[theseBoidsToBeKilled[j]] = true;
        }
      } else {
        if (resultObj.neighborCount > 0) {
          parentsList.push(boid);
        }
      }

      // contribute to average genome
      for (var j = 0; j < genomeAverages.length; j++) {
        genomeAverages[j] += boid.genome[j];
      }
      // contribute to average age
      fitnessTotal += boid.age;
      // draw the updated boid
      boidsContext.fillRect(boid.position.x, boid.position.y, 3, 3);
    }

    if (this.timestep % (secondsPerDatapoint*frameRate) == 0) {
      // calculate the averages
      for (var j = 0; j < genomeAverages.length; j++) {
        genomeAverages[j] /= this.boidList.length;
      }

      /*if (this.timestep % (20*frameRate) == 0) {
        for (var i = 0; i < chart.datasets.length; i++) {
          for (var j = 1; j < 20; j++) {
            
          }
        }
        chart.update();
      }*/

      genomeChart.addData([
        genomeAverages[0],
        genomeAverages[1],
        genomeAverages[2],
        genomeAverages[3],
        genomeAverages[4],
      ], this.timestep);

      fitnessChart.addData([fitnessTotal/this.boidList.length], this.timestep);

      // calculate the standard deviations
      /*var genomeDeviations = [0,0,0,0,0,0];
      for (var i = 0; i < this.boidList.length; i++) {
        for (var j = 0; j < genomeAverages.length; j++) {
          var difference = this.boidList[i].genome[j] - genomeAverages[j];
          genomeDeviations[j] += difference*difference;
        }
      }

      for (var j = 0; j < genomeAverages.length; j++) {
        genomeDeviations[j] = Math.sqrt(genomeDeviations[j]/this.boidList.length);
      }*/
    }

    // now kill the boids 
    var boidsToBeKilledArray = []
    for (boidIndexString in boidsToBeKilled) {
      if (boidsToBeKilled.hasOwnProperty(boidIndexString)) {
        boidsToBeKilledArray.push(parseInt(boidIndexString));
      }
    }
    boidsToBeKilledArray.sort(function (x,y) { return x - y; });
    for (var i = boidsToBeKilledArray.length-1; i >= 0; i--) {
        this.boidList.splice(boidsToBeKilledArray[i], 1);
    }
    // and replace them
    for (var i = 0; i < boidsToBeKilledArray.length; i++) {
      this.boidList.push(this.evolveNewBoid(parentsList));
    }

    this.timestep++;

    // do the next timestep, or else save the data and start over
    if (this.timestep <= frameRate*secondsPerDatapoint*numDataPoints) {
      setTimeout(this.run.bind(this), 1000/frameRate);
    } else {
      saveAndResetCurrentCharts();
    }
  }
}

var Boid = function (genome,x,y) {
  this.genome = genome;
  this.position = new Vector (x,y);
  this.randomStartVelocity();
  this.acceleration = new Vector(0,0);
  this.age = 0;
}

Boid.prototype = {
  randomStartPosition: function () {
    var rand = Math.random();
    var startPos;
    startPos = new Vector(0, rand*canvasHeight);
    this.position = startPos;
  },

  randomStartVelocity: function () {
    this.velocity = new Vector (Math.random(), Math.random());
    var magnitude = this.velocity.magnitude();
    this.velocity.x = this.velocity.x*(minSpeed/magnitude);
    this.velocity.y = this.velocity.y*(minSpeed/magnitude);
  },

  normalizeAcceleration: function () {
    this.acceleration.normalize(0, maxAcceleration);
  },
  
  normalizeVelocity: function () {
    this.velocity.normalize(minSpeed, maxSpeed);
  },

  calculateAccelerationFromNeighbor: function (otherBoid) {
    var neighborContributedAcceleration = new Vector(0,0);
    neighborContributedAcceleration.x += this.genome[4]*(otherBoid.position.x - this.position.x)
    neighborContributedAcceleration.y += this.genome[4]*(otherBoid.position.y - this.position.y)
    neighborContributedAcceleration.x += this.genome[3]*(otherBoid.velocity.x - this.velocity.x)
    neighborContributedAcceleration.y += this.genome[3]*(otherBoid.velocity.y - this.velocity.y)
    neighborContributedAcceleration.x += this.genome[2]*(otherBoid.acceleration.x - this.acceleration.x)
    neighborContributedAcceleration.y += this.genome[2]*(otherBoid.acceleration.y - this.acceleration.y)
    return neighborContributedAcceleration;
  },

  calculateAccelerationFromSelf: function () {
    this.acceleration.x += this.acceleration.x*this.genome[0];
    this.acceleration.y += this.acceleration.y*this.genome[0];
    this.acceleration.x += this.velocity.x*this.genome[1];
    this.acceleration.y += this.velocity.y*this.genome[1];
  },

  iterateKinematics: function() {
    this.normalizeAcceleration();
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;
    this.normalizeVelocity();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.position.wrap(new Vector(canvasWidth, canvasHeight));
  },
  
  update: function (thisBoidsIndex, boidList) {
    var boidsCollidingWithThisBoid = [];
    var neighborCount = 0;
    var neighborContributedAcceleration = new Vector(0,0);
    for (var i = 0; i < boidList.length; i++) {
      var otherBoid = boidList[i];
      var distanceFromOtherBoid = this.position.distanceFrom(otherBoid.position);
      if (distanceFromOtherBoid < neighborDistance && this != otherBoid) {
        // apply genomic flocking forces
        var accelerationFromThisNeighbor = this.calculateAccelerationFromNeighbor(otherBoid);
        neighborContributedAcceleration.x += accelerationFromThisNeighbor.x;
        neighborContributedAcceleration.y += accelerationFromThisNeighbor.y;
        
        if (distanceFromOtherBoid < collisionDistance) {
          boidsCollidingWithThisBoid.push(i);
        } 

        neighborCount++;
      } else {
        otherBoid.position.unwrap(new Vector(canvasWidth, canvasHeight), neighborDistance);
        distanceFromOtherBoid = this.position.distanceFrom(otherBoid.position);
        if (distanceFromOtherBoid < neighborDistance && this != otherBoid) {
          // apply genomic flocking forces
          var accelerationFromThisNeighbor = this.calculateAccelerationFromNeighbor(otherBoid);
          neighborContributedAcceleration.x += accelerationFromThisNeighbor.x;
          neighborContributedAcceleration.y += accelerationFromThisNeighbor.y;
          
          if (distanceFromOtherBoid < collisionDistance) {
            boidsCollidingWithThisBoid.push(i);
          } 

          neighborCount++;
        }
        otherBoid.position.wrap(new Vector(canvasWidth, canvasHeight));
      }
    }

    // apply loneliness death possibility
    if (Math.random() < lonelyDeathProbability && neighborCount == 0) { boidsCollidingWithThisBoid.push(thisBoidsIndex); }
    
    if (neighborCount > 0) {
      this.acceleration.x += neighborContributedAcceleration.x / neighborCount;
      this.acceleration.y += neighborContributedAcceleration.y / neighborCount;
    }

    // apply genomic acceleration and velocity based changes
    this.calculateAccelerationFromSelf();

    // do physics 
    this.iterateKinematics();
    
    // get older
    this.age++;

    // return indices to be deleted if this boid and another boid have collided.
    if (boidsCollidingWithThisBoid.length > 0) {
      boidsCollidingWithThisBoid.push(thisBoidsIndex);
    }
    return {
             collidingBoids: boidsCollidingWithThisBoid,
             neighborCount: neighborCount
           };
  }
}

var Vector = function (x, y) {
	this.x = x;
	this.y = y;
}

Vector.prototype = {
	magnitude: function () {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	},

	wrap: function (bounds) {
		if (this.x < 0) { this.x = bounds.x + this.x; }
		if (this.x > bounds.x) { this.x = this.x - bounds.x; }
		if (this.y < 0) { this.y = bounds.y + this.y; }
		if (this.y > bounds.y) { this.y = this.y - bounds.y; }
	},

	unwrap: function (bounds, limit) {
		if (this.x < limit) { this.x = bounds.x + this.x; }
		if (this.x > bounds.x-limit) { this.x = this.x - bounds.x; }
		if (this.y < limit) { this.y = bounds.y + this.y; }
		if (this.y > bounds.y-limit) { this.y = this.y - bounds.y; }
	},

  distanceFrom: function (point) {
    var xDiff = this.x - point.x;
    var yDiff = this.y - point.y;
    return Math.sqrt(xDiff*xDiff + yDiff*yDiff);
  },
  
  normalize: function (min, max) {
    var magnitude = this.magnitude();
    if (magnitude < min) {
      this.x = this.x*(min/magnitude);
      this.y = this.y*(min/magnitude);
    } else if (magnitude > max) {
      this.x = this.x*(max/magnitude);
      this.y = this.y*(max/magnitude);
    }
  }
}

setup();
