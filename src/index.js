const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let gameScore = document.getElementById("score");
const startButton = document.getElementById("startButton");

//Sounds Effects
let speedUpSFX = new Audio("/audio/point.wav");
let gameOverSFX = new Audio("/audio/die.wav");
let jumpSFX = new Audio("/audio/jump.wav");

let backgroundOffset = 0;
let backgroundImage = new Image();
backgroundImage.src = "/images/Track.png.jpg";

function drawBackgroundLine() {
  const pattern = ctx.createPattern(backgroundImage, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(backgroundOffset, 0, canvas.width, canvas.height);
}

//used for 'SetInterval'
let presetTime = 1000;
//Enemy can speed up when player has scored points at intervals of 10
let enemySpeed = 5;

// let arrayObstacles = [new Obstacle(50,5)]
let arrayObstacles = [];

let animationId = null;

function drawBackgroundLine() {
  // ctx.beginPath()
  // ctx.moveTo(0,400)
  // ctx.lineTo(800,400)
  // ctx.lineWidth = 1
  // ctx.strokeStyle = 'black'
  // ctx.stroke()

  // const trackImage = document.getElementById('trackImage')
  // ctx.drawImage(trackImage, 0, 395, 800, 12)

  // const pattern = ctx.createPattern(trackImage, 'repeat-x');
  // ctx.fillStyle = pattern;
  // ctx.fillRect(backgroundOffset, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.lineTo(canvas.width, 400);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "black";
  ctx.stroke();
}

//Both min & max are included in this random generation funciton
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNumberInterval(timeInterval) {
  let returnTime = timeInterval;
  if (Math.random() < 0.5) {
    returnTime += getRandomNumber(presetTime / 5, presetTime * 1.5);
  } else {
    returnTime -= getRandomNumber(presetTime / 5, presetTime / 2);
  }
  return timeInterval;
}

class Player {
  constructor(position, width, height) {
    this.position = position;

    this.velocity = {
      x: 0,
      y: 1,
    };
    this.height = height;
    this.width = width;

    this.score = 0;
    this.jumpHeight = 17;

    // these 3 are used for jump configuration
    this.shouldJump = false;
    this.jumperCounter = 0;
    this.gravity = 0.2;
    //related to spin animation
    this.spin = 0;

    //get a perfect 90 degree rotation
    this.spinIncrement = 90 / 20;
  }

  rotation() {
    let offsetXPosition = this.position.x + this.width / 2;
    let offsetYPosition = this.position.y + this.height / 2;

    ctx.translate(offsetXPosition, offsetYPosition);
    //division is there to convert degrees into radians
    ctx.rotate((this.spin * Math.PI) / 180);
    ctx.rotate((this.spinIncrement * Math.PI) / 180);
    ctx.translate(-offsetXPosition, -offsetYPosition);
    //4.5 because 90/20 (number if iterations in jump) is 4.5
    this.spin += this.spinIncrement;
  }

  counterRotation() {
    //this rotates the cube back to its origin so that it can be moved upwards properly
    let offsetXPosition = this.position.x + this.width / 2;
    let offsetYPosition = this.position.y + this.height / 2;
    ctx.translate(offsetXPosition, offsetYPosition);
    ctx.rotate((-this.spin * Math.PI) / 180);
    ctx.translate(-offsetXPosition, -offsetYPosition);
  }

  drow() {
    this.jump();
    const playerImage = document.getElementById("playerImage");
    ctx.drawImage(
      playerImage,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );

    //reset the rotation so the rotstion of other elements is unchanged
    if (this.shouldJump) {
      this.counterRotation();
    }
  }

  jump() {
    if (this.shouldJump) {
      this.jumperCounter++;

      // if(this.jumperCounter < 15){
      if (this.jumperCounter < 15) {
        //go up
        this.position.y -= this.jumpHeight;
      } else if (this.jumperCounter > 14 && this.jumperCounter < 19) {
        this.position.y += 0;
      }
      this.rotation();

      if (this.jumperCounter >= 32) {
        this.counterRotation();
        this.spin = 0;
        this.shouldJump = false;
      }
    }
  }

  update() {
    this.drow();
    this.position.y += this.velocity.y;
    if (this.position.y + this.height + this.velocity.y < 400) {
      this.velocity.y += this.gravity;
    } else {
      this.velocity.y = 0;
    }
  }
}

let player = new Player({ x: 150, y: 350 }, 50, 50);

class Obstacle {
  constructor(size, speed) {
    this.x = canvas.width + size;
    this.y = 400 - size;
    this.size = size;
    this.color = "red";
    this.slideSpeed = speed;
  }
  drow() {
    const obstacleImage = document.getElementById("obstacleImage");
    ctx.drawImage(obstacleImage, this.x, this.y, this.size, this.size);
  }
  slide() {
    this.drow();
    this.x -= this.slideSpeed;
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  setTimeout(() => {
    player.score++;
    if (player.score % 1000 === 0) {
      scoreSFX.play();
      enemySpeed++;
    }
    gameScore.innerText = `Score is : ${Math.floor(player.score / 10)}`;
  }, 0);

  //canvas logic
  drawBackgroundLine();

  player.update();

  arrayObstacles.forEach((arrayObstcale, index) => {
    arrayObstcale.slide();
    //End game as player and enemy have collided
    if (squaresColliding(player, arrayObstcale)) {
      // play music for ending the game
      gameOver();
    }
    //delete block that has left the secreen
    if (arrayObstcale.x + arrayObstcale.size <= 0) {
      setTimeout(() => {
        arrayObstacles.splice(index, 1);
      }, 0);
    }
  });
}

//Returns trun if colliding
function squaresColliding(player, block) {
  let playerCenterX = player.position.x + player.width / 2;
  let playerCenterY = player.position.y + player.height / 2;

  let blockCenterX = block.x + block.size / 2;
  let blockCenterY = block.y + block.size / 2;

  let deltaX = Math.abs(playerCenterX - blockCenterX);
  let deltaY = Math.abs(playerCenterY - blockCenterY);

  // Use half of the sum of widths/heights as the threshold for collision
  let halfWidths = (player.width + block.size) / 2;
  let halfHeights = (player.height + block.size) / 2;

  return deltaX < halfWidths && deltaY < halfHeights;
}

function gameOver() {
  // Play game over sound if needed
  gameOverSFX.play();
  // Stop the animation
  cancelAnimationFrame(animationId);
  // initializeGame();
  toggle();
  // Display a game over message or perform other actions as needed

  // alert('Game Over! Your final score is: ' + Math.floor(player.score / 10));
}

function generateBlocks() {
  let timeDelay = randomNumberInterval(presetTime);
  arrayObstacles.push(new Obstacle(50, enemySpeed));

  setTimeout(generateBlocks, timeDelay);
}

window.addEventListener("load", (event) => {
  const isHidden = (document.getElementById("startButton").hidden = false);
  const restartImage = document.getElementById("startButton");
  restartImage.innerHTML = '<img src="/images/start-button.png" />';

  // animate();
});

// animate();
setTimeout(() => {
  generateBlocks();
}, randomNumberInterval(presetTime));

addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    if (!player.shouldJump) {
      jumpSFX.play();
      player.jumperCounter = 0;
      player.shouldJump = true;
    }
    // player.velocity.y = -9
  }
});

startButton.addEventListener("click", () => {
  // Start or restart the game
  initializeGame();
  animate();
});

function initializeGame() {
  player = new Player({ x: 150, y: 350 }, 50, 50);
  arrayObstacles = [];
  gameScore.innerText = "Score is: 0";
}

function toggle() {
  const isHidden = document.getElementById("startButton").hidden;

  if (isHidden) {
    document.getElementById("startButton").hidden = false;
  } else {
    document.getElementById("startButton").hidden = true;

    const restartImage = document.getElementById("startButton");
    restartImage.innerHTML = '<img src="/images/GameOver.png" />';

    // Create an Image object
    const image = new Image();
    image.src =
      "data:image/svg+xml," + encodeURIComponent(restartImage.innerHTML);

    // Draw the Image on the canvas
    ctx.drawImage(image, canvas.width / 2, canvas.height / 2, 400, 400);
  }
}

// let x = 1;
// let bgImage = document.getElementById("landscape");

// bgImage.style.width = "100vw"
// console.log('canvas.width',canvas.width)

// bgImage.style.width = canvas.width + "px";
// bgImage.style.height = "50vh";
// bgImage.style.alignItems = "center";

// function move() {
//   x++;
//   bgImage.style.backgroundPositionX = x + "px";
// }

// setInterval(move, 50);
