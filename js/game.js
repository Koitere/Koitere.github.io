var config = {
    type: Phaser.AUTO,
    parent: 'layer2',
    width: 1280,
    height: 800,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      forceLandscape: false
    },
    physics: {
      default: 'arcade',
      arcade: {
      }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
        extend: {
                    player: null,
                    keys: null,
                    time: 0,
                }
    }
};
if(is_touch_enabled()) {
  config.scale.mode = Phaser.Scale.HEIGHT_CONTROLS_WIDTH;
  config.scale.orientation = Phaser.LANDSCAPE;
  config.width = 800;
  config.height = 340;
}
var gameVersion = "v0.1.2-alpha"
console.log("Game Version = " + gameVersion);
//possible game name... Mountaineer? Something like that
var game = new Phaser.Game(config);
// load assets
function preload(){
  // load images
  this.load.image('test','/assets/spirte_sheet.png');
  this.load.spritesheet('upchar', 'assets/upwalk.png', {frameWidth: 32, frameHeight: 32});
  this.load.spritesheet('ssmain', '/assets/spirte_sheet.png', {frameWidth: 32, frameHeight: 32});
  this.load.spritesheet('char', 'assets/hairv2-sheet.png', {frameWidth: 32, frameHeight: 32});
  //this.load.multiatlas('ssmain', 'assets/sprites.json', 'assets');
};

var map;
var layer;
var layer1;
var layer2;
var layer3;
var marker;
var rt;
var currentTile = 0;
var currentLayer;
var joy;
var moving = false;
var cursors;

var facing = 1;
var animconf = {
  key: 'leftb',
  frames: [{frame:0},{frame:1}],
  defaultTextureKey: 'ssmain',
  frameRate: 2,
  repeat: -1
};
// called once after the preload ends
function create() {
  // Create world bounds
  this.physics.world.setBounds(0, 0, 16384, 16384);
  this.cameras.main.zoom = 1;
  this.anims.create(animconf)

  lframes = [{frame:1},{frame:0},{frame:2},{frame:0}];
  animconf.frames = lframes;
  animconf.key = 'left';
  animconf.frameRate = 4;
  animconf.defaultTextureKey = 'char';
  this.anims.create(animconf)

  lframes = [{frame:0},{frame:1},{frame:2},{frame:0},{frame:3},{frame:4}];
  animconf.frames = lframes;
  animconf.key = 'up';
  animconf.frameRate = 6;
  animconf.defaultTextureKey = 'upchar';
  this.anims.create(animconf)

  animconf.frames = [{frame:6},{frame:7}];
  animconf.defaultTextureKey = 'ssmain';
  animconf.key = 'rightb';
  this.anims.create(animconf)

  animconf.defaultTextureKey = 'char';
  animconf.key = 'right';
  rframes = [{frame:4},{frame:5},{frame:3},{frame:5}];
  animconf.frames = rframes;
  this.anims.create(animconf)






  game.backgroundColor = '#2d5d9d';


  let gameW = this.sys.game.config.width;
  let gameH = this.sys.game.config.height;

  if(is_touch_enabled()) {
    joy = new JoyStick('layer1',{width:200,height:200});
  }
  keys = this.input.keyboard.addKeys("W,A,S,D");

  osi = new OSimplex(Math.floor(Math.random() * (2**32)));
  newmap = generatemap(osi);
  newmap = convertMap(newmap);


 map = this.add.tilemap(null,32,32,50,50,newmap);
 map.setCollision(18, true);
 map.setCollision([8,12,13],false);
 tiles = map.addTilesetImage(null,'ssmain', 32, 32);
 layer = map.createLayer('layer', tiles, 0, 0);
 rt = this.add.renderTexture(0,0,4096,4096);
 rt.draw(layer);
 player = this.physics.add.sprite(64,64,'char',5);
 player.setOrigin(0.5, 0.5).setDisplaySize(32, 32).setCollideWorldBounds(true).setDrag(1000, 1000);
 this.physics.add.collider(player, layer);
};

// Ensures sprite speed doesnt exceed maxVelocity while update is called
function constrainVelocity(sprite, maxVelocity)
{
    if (!sprite || !sprite.body)
      return;

    var angle, currVelocitySqr, vx, vy;
    vx = sprite.body.velocity.x;
    vy = sprite.body.velocity.y;
    currVelocitySqr = vx * vx + vy * vy;

    if (currVelocitySqr > maxVelocity * maxVelocity)
    {
        angle = Math.atan2(vy, vx);
        vx = Math.cos(angle) * maxVelocity;
        vy = Math.sin(angle) * maxVelocity;
        sprite.body.velocity.x = vx;
        sprite.body.velocity.y = vy;
    }
}

function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

function generatemap(noise) {
  map = createArray(512,512);
  let max = 0;
  let min = 0;
  let feat = 24;
  for (let y = 0; y < 512; y++)
  {
    for (let x = 0; x < 512; x++)
    {
      let value = noise.eval(x / feat, y / feat);
      if(value > max) {
        max = value;
      }
      if(value < min) {
        min = value;
      }
      map[x][y] = value;
    }
  }
  console.log(max)
  console.log(min)
  return map;
}

function walkAnim() {
  switch(facing) {
    case 0:
      if(moving) {
        player.play('left', true);
      } else {
        player.stop();
        player.setFrame(0);
      }
      break;
    case 1:
    if(moving) {
      player.play('right', true);
    } else {
      player.stop();
      player.setFrame(5);
    }
      break;
    case 2:
    if(moving) {
      player.play('up', true);
    } else {
      player.stop();
      player.setFrame(0);
    }
      break;
    case 3:
      player.stop();
      player.setFrame(5);
      break;
  }
}

function is_touch_enabled() {
    return ( 'ontouchstart' in window ) ||
           ( navigator.maxTouchPoints > 0 ) ||
           ( navigator.msMaxTouchPoints > 0 );
}

var edgeHash = {"111111010":13,"111010010":8,"010010000":8,"011111000":13,"001011000":8,"110111110":13,"100110100":8,"001111011":13,"100111001":8,"110111000":13,"110110010":13,"010111111":13};
function convertMap(rawmap) {
  newmap = createArray(512,512);
  for (let y = 0; y < 512; y++)
  {
    for (let x = 0; x < 512; x++)
    {
      if (rawmap[x][y] >= 0.45) {
        newmap[x][y] = 12;
      } else if ((rawmap[x][y] > 0) && (rawmap[x][y] < 0.45)) {
        newmap[x][y] = 13;
      } else if ((rawmap[x][y] < 0) && (rawmap[x][y] > -0.3)) {
        newmap[x][y] = 8;
      } else {
        newmap[x][y] = 18;
      }
    }
  }
  edgemap = createArray(512,512);
  for (let y = 0; y < 512; y++)
  {
    for (let x = 0; x < 512; x++)
    {
      if (newmap[x][y] == 13) {
        if((x == 0 || x == 511 || y == 0 || y == 512 )) {
          edgemap[x][y] = 13
          continue;
        }
        if((newmap[x][y+1] == 8) && (newmap[x+1][y] == 13) && (newmap[x-1][y] == 13)) {
          edgemap[x][y] = 25; //flat bottom ???
        } else if ((newmap[x+1][y] == 8) && (newmap[x-1][y] == 13) && (newmap[x][y+1] == 8)) {
          edgemap[x][y] = 23;
        } else if ((newmap[x][y-1] == 13) && (newmap[x][y+1] == 13) && (newmap[x+1][y] == 8)) {
          edgemap[x][y] = 24; //flat bottom
        } else if ((newmap[x][y+1] == 13) && (newmap[x+1][y] == 13) && (newmap[x+1][y+1] == 8)) {
          edgemap[x][y] = 26;
        } else if ((newmap[x][y-1] == 8) && (newmap[x-1][y] == 13) && (newmap[x+1][y] == 8)){
          edgemap[x][y] = 29;
        } else if ((newmap[x][y-1] == 8) && (newmap[x+1][y] == 13) && (newmap[x-1][y] == 13)) {
          edgemap[x][y] = 28;
        } else if ((newmap[x][y-1] == 13) && (newmap[x+1][y] == 13) && (newmap[x+1][y-1] == 8)) {
          edgemap[x][y] = 27;
        } else if ((newmap[x][y-1] == 8) && (newmap[x+1][y] == 13) && (newmap[x-1][y] == 8)) {
          edgemap[x][y] = 30;
        } else if ((newmap[x][y+1] == 8) && (newmap[x+1][y] == 13) && (newmap[x-1][y] == 8)) {
          edgemap[x][y] = 31;
        } else if ((newmap[x-1][y] == 13) && (newmap[x][y+1] == 13) && (newmap[x-1][y+1] == 8)) {
          edgemap[x][y] = 32;
        } else if ((newmap[x][y-1] == 13) && (newmap[x-1][y] == 13) && (newmap[x-1][y-1] == 8)) {
          edgemap[x][y] = 33;
        } else if ((newmap[x][y-1] == 13) && (newmap[x-1][y] == 8) && (newmap[x][y+1] == 13)) {
          edgemap[x][y] = 34;
        } else {
          edgemap[x][y] = 13;
        }
      } else {
        edgemap[x][y] = newmap[x][y]
      }
    }

  }
  for (let y = 0; y < 128; y++)
  {
    for (let x = 0; x < 128; x++)
    {
      if (newmap[x][y] == 13) {
        if((x == 0 || x == 511 || y == 0 || y == 512 )) {
          edgemap[x][y] = 13
          continue;
        }
        let checkhash = ""
        for (let i = -1; i < 2; i++) {
          for (let ii = -1; ii < 2; ii++) {
            if (newmap[x+i][y+ii]==8){
              checkhash += "0";
            } else {
              checkhash += "1";
            }
          }
        }
        try {
          if((checkhash in edgeHash)) {
            edgemap[x][y] = edgeHash[checkhash]
            console.log(edgeHash[checkhash], " ", x, " ", y);
          }
        } catch(error) {
          continue;
        }
      }
    }
  }
  return edgemap;
}

function update() {
  player.setVelocity(0);
  if (is_touch_enabled()) {
    player.setVelocityX(joy.GetX()*3);
    player.setVelocityY(-joy.GetY()*3);
    switch(joy.GetDir()) {
      case "N":
        facing = 2;
        moving = true;
        break;
      case "E":
        facing = 1;
        moving = true;
        break;
      case "SE":
        facing = 1;
        moving = true;
        break;
      case "NE":
        facing = 1;
        moving = true;
        break;
      case "S":
        facing = 0;
        moving = true;
        break;
      case "W":
        facing = 0;
        moving = true;
        break;
      case "SW":
        facing = 0;
        moving = true;
        break;
      case "NW":
        facing = 0;
        moving = true;
        break;
      default:
        moving = false;
        break;
    }
  } else {
    /*
    if (keys.A.isDown) {
      moving = true;
      facing = 0;
      player.setVelocityX(-300);
    } else if (keys.D.isDown) {
      moving = true;
      facing = 1;
      player.setVelocityX(300);
    } else {
      moving = false;
    }*/

    if (keys.W.isDown) {
      moving = true;
      facing = 2;
      player.setVelocityY(-300);
    } else if (keys.S.isDown) {
      moving = true;
      if(facing == 0) {
        facing = 0;
      } else {
        facing = 1;
      }
      player.setVelocityY(300);
    } else {
      moving = false;
    }

    if (keys.A.isDown) {
      moving = true;
      facing = 0;
      player.setVelocityX(-300);
    } else if (keys.D.isDown) {
      moving = true;
      facing = 1;
      player.setVelocityX(300);
    }
}
  // Constrain velocity of player
  // Camera follows player ( can be set in create )
this.cameras.main.startFollow(player);

constrainVelocity(player, 250);
walkAnim();
};
