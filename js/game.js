var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 2560,
    height: 1280,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
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

var game = new Phaser.Game(config);
// load assets
function preload(){
  // load images
  this.load.image('test','/assets/spirte_sheet.png');
  this.load.spritesheet('ssmain', '/assets/spirte_sheet.png', {frameWidth: 32, frameHeight: 32});

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

var cursors;

var facing = 1;
var animconf = {
  key: 'left',
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
  animconf.frames = [{frame:2},{frame:3}];
  animconf.key = 'right';
  animconf.frameRate = 2;
  this.anims.create(animconf)
  animconf.frames = [{frame:6},{frame:7}];
  animconf.key = 'rightb';
  this.anims.create(animconf)
  animconf.frames = [{frame:4},{frame:5}];
  animconf.key = 'leftb';
  this.anims.create(animconf)






  game.backgroundColor = '#2d5d9d';


  let gameW = this.sys.game.config.width;
  let gameH = this.sys.game.config.height;



  keys = this.input.keyboard.addKeys("W,A,S,D");

  osi = new OSimplex(Math.floor(Math.random() * (2**32)));
  newmap = generatemap(osi);
  newmap = convertMap(newmap);


 map = this.add.tilemap(null,32,32,50,50,newmap);
 map.setCollision(18, true);
 map.setCollision([8,12,13],false);
 tiles = map.addTilesetImage(null,'test', 32,32);
 layer = map.createLayer('layer', tiles, 0, 0);
 rt = this.add.renderTexture(0,0,16384,16384);
 rt.draw(layer);
 player = this.physics.add.sprite(64,64,'ssmain',2);
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
      player.play('left', true);
      break;
    case 1:
      player.play('right', true);
      break;
    case 2:
      player.play('leftb',true);
      break;
    case 3:
      player.play('rightb', true);
      break;
  }
}

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
  return edgemap;
}

function update() {
  player.setVelocity(0);

if (keys.A.isDown) {
  if(facing == 1){
    facing = 0;
  } else if (facing == 3) {
    facing = 2;
  }
  player.setVelocityX(-300);
} else if (keys.D.isDown) {
  if(facing == 0){
    facing = 1;
  } else if (facing == 2) {
    facing = 3;
  }
  player.setVelocityX(300);
}

if (keys.W.isDown) {
  if(facing == 0){
    facing = 2;
  } else if (facing == 1) {
    facing = 3;
  }
  player.setVelocityY(-300);
} else if (keys.S.isDown) {
  if(facing == 2){
    facing = 0;
  } else if (facing == 3) {
    facing = 1;
  }
  player.setVelocityY(300);
}
  // Constrain velocity of player
  // Camera follows player ( can be set in create )
this.cameras.main.startFollow(player);

constrainVelocity(player, 250);
walkAnim();
};
