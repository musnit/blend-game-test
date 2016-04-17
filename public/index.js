window.totalCanvasWidth = 500;
window.totalCanvasHeight = 260;

window.onload = function(){

  window.makeSprite = function (options) {
      var actualSprite = {};
      actualSprite.ticksPerFrame = options.ticksPerFrame || 0;
      actualSprite.context = options.context;
      actualSprite.spriteSheetWidth = options.spriteSheetWidth;
      actualSprite.height = options.height;
      actualSprite.dx = options.dx || 0;
      actualSprite.dy = options.dy || 0;
      actualSprite.image = options.image;
      actualSprite.tickCount = 0;
      actualSprite.frameIndex = 0;

      actualSprite.update = function () {

          actualSprite.tickCount += 1;

          if (actualSprite.tickCount > actualSprite.ticksPerFrame) {

          	actualSprite.tickCount = 0;
          	if(window.activeMouseShift && actualSprite.contains(window.activeMouseShift)) {
              // If the current frame index is in range
              if (actualSprite.frameIndex < window.numFrames - 1) {
                // Go to the next frame
                actualSprite.frameIndex += 1;
              }
            }
            else {
              if(actualSprite.frameIndex === 0){
                return;
              }
              var inShift = false;
              window.mouseShifts.forEach(function(mouseShift){
                if (!mouseShift.active){
                  if(actualSprite.contains(mouseShift)) {
                    inShift = true;
                  }
                }
              });
              if (!inShift) {
                actualSprite.frameIndex -= 1;
              }
            }
          }
      };

      actualSprite.contains = function(shift){
        var spriteTopLeft = {
          x: this.dx,
          y: this.dy
        };
        var spriteBotRight = {
          x: this.dx + (this.spriteSheetWidth / window.numFrames),
          y: this.dy+ (this.height)
        };
        var mouseTopLeft = {
          x: shift.mx - shift.rad,
          y: shift.my - shift.rad
        };
        var mouseBotRight = {
          x: shift.mx + shift.rad,
          y: shift.my + shift.rad
        };

        if (spriteTopLeft.x > mouseBotRight.x || mouseTopLeft.x > spriteBotRight.x){
          return false;
        }
        if (spriteTopLeft.y > mouseBotRight.y || mouseTopLeft.y > spriteBotRight.y){
          return false;
        }
        return true;
      }

      actualSprite.mouseHit = function(x, y){
        if(x > this.dx &&
          x < this.dx + (this.spriteSheetWidth / window.numFrames) &&
          y > this.dy &&
          y < this.dy + (this.height)
        ){
          return true;
        }
        else {
          return false;
        }
      }

      return actualSprite;
  }

  function renderAll() {

    window.canvasContext.clearRect(0, 0, window.canvas.width, window.canvas.height);

    window.sprites.forEach(function(sprite){
      var frameWidth = sprite.actualSprite.spriteSheetWidth / window.numFrames;
      var frameHeight = sprite.actualSprite.height;
      window.canvasContext.drawImage(
         sprite.image,
         sprite.actualSprite.frameIndex * frameWidth,
         0,
         frameWidth,
         frameHeight,
         sprite.actualSprite.dx,
         sprite.actualSprite.dy,
         frameWidth,
         frameHeight);
    });
  }

  function gameLoop () {
    if (window.activeMouseShift) {
      window.activeMouseShift.rad += 5;
    }
    window.mouseShifts.forEach(function(mouseShift){
      if (!mouseShift.active){
        mouseShift.rad -= 5;
        if (mouseShift.rad === 0){
          window.mouseShifts.splice(window.mouseShifts.indexOf(mouseShift), 1);
        }
      }
    });
    window.requestAnimationFrame(gameLoop);
    window.sprites.forEach(function(sprite){
      sprite.actualSprite.update();
      renderAll();
    });
  }

  function loadCheck() {
    window.numLoaded++;
    if(window.numLoaded == window.numToLoad){
      gameLoop();
    }
  };

  var sprites = [];
  window.numLoaded = 0;
  fetch('manifest.json').then(function(response) {
    response.json().then(function(json) {
      var keys = Object.keys(json.sprites);
      window.numToLoad = keys.length;
      console.log(json.sprites);
      window.horizontalPieces = parseInt(json.horizontalPieces);
      window.verticalPieces = parseInt(json.verticalPieces);
      window.numFrames = parseInt(json.numFrames);
      keys.forEach(function(spriteKey) {
        var spriteJSON = {
          image: new Image(),
          frameWidth: json.sprites[spriteKey][0],
          frameHeight: json.sprites[spriteKey][1],
          fileName: spriteKey,
        };
        spriteJSON.image.src = 'sprites/' + spriteKey;
        spriteJSON.image.addEventListener("load", loadCheck);
        sprites.push(spriteJSON);
      });
      console.log(sprites);

      var canvas = document.getElementById("canvasTest");
      canvas.width = window.totalCanvasWidth;
      canvas.height = window.totalCanvasHeight;
      window.canvasContext = canvas.getContext("2d");
      window.canvas = canvas;
      window.canvas.addEventListener("mousedown", mouseDown, false);
      window.canvas.addEventListener("mouseup", mouseUp, false);
      window.mouseRad = 0;
      window.mouseShifts = [];

      window.sprites = sprites;
      var xPos = 0;
      var yPos = 0;
      window.sprites = window.sprites.sort(function(a,b){
        var aNum = parseInt(a.fileName.split('_')[1].split('.')[0]);
        var bNum = parseInt(b.fileName.split('_')[1].split('.')[0]);
        return aNum - bNum;
      });
      sprites.forEach(function(sprite, index){
        sprite.actualSprite = window.makeSprite({
            spriteSheetWidth: (sprite.frameWidth * window.numFrames),
            height: sprite.frameHeight,
            dx: xPos,
            dy: yPos,
            image: sprite.image,
            loop: false,
            ticksPerFrame: 0
        });
        if (index % window.horizontalPieces === window.horizontalPieces - 1){
          xPos = 0;
          yPos = yPos + sprite.frameHeight;
        }
        else {
          xPos = xPos + sprite.frameWidth;
        }
      });
    });
  });

  function mouseDown(event)
  {
    window.mid = true;

    var x = event.x;
    var y = event.y;

    x -= window.canvas.offsetLeft;
    y -= window.canvas.offsetTop;

    var mouseShift = {
      mx: x,
      my: y,
      rad: 5,
      active: true
    };
    window.mouseShifts.push(mouseShift);
    window.activeMouseShift = mouseShift;
  }

  // Start the game loop as soon as the sprite sheet is loaded
   function mouseUp(){
    window.mid = false;
    window.activeMouseShift.active = false;
    window.activeMouseShift = undefined;
  };
}
