import Moralis from "moralis";
import tiles from "./images/tiles.png";
import grass from "./assets/grass.png";
import road from "./assets/road.png";
import buildings from "./assets/buildings.png";
import village from "./tiles/village.json";
import playerSprite from "./assets/player.png";

class MainScene extends Phaser.Scene {
  private wKey!: Phaser.Input.Keyboard.Key;
  private aKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;
  private sprites: any = {};
  private state: any = {};
  private wallLayer!: Phaser.Tilemaps.TilemapLayer;
  private treeLayer: any;
  private currentId!: string;
  private timer = 0;
  private road!: any;

  init() {
    this.cameras.main.setBackgroundColor("#24252A");
  }
  preload() {
    this.ping();
    this.load.image("grass", grass);
    this.load.image("road", road);
    this.load.image("buildings", buildings);
    this.load.image("tiles", tiles);
    // this.load.tilemapTiledJSON("map", `${process.env.PUBLIC_URL}/tiles.json`);
    this.load.tilemapTiledJSON("map", village);
  }
  async create() {
    this.currentId = Moralis.User.current()?.get("username");
    this.cameras.main.zoom = 0.4;

    //@ts-ignore
    document.getElementById("phaser-container").style.width = "99%";

    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    const map = this.make.tilemap({
      key: "map",
      tileWidth: 256,
      tileHeight: 256,
    });
    const grassTileset = map.addTilesetImage("grass", "grass", 256, 256);
    const roadTileset = map.addTilesetImage("road", "road", 256, 256);
    const buildingTileset = map.addTilesetImage(
      "buildings",
      "buildings",
      843,
      874
    );

    const land = map.createLayer("Land", grassTileset).setDepth(-3);
    this.road = map.createLayer("Road", roadTileset).setDepth(-2);

    this.wallLayer = map.createLayer("Building", buildingTileset);
    this.wallLayer.setCollisionFromCollisionGroup();

    var graphics = this.add.graphics();
    this.wallLayer.forEachTile((tile) => {
      var tileWorldPos = this.wallLayer.tileToWorldXY(tile.x, tile.y);
      var collisionGroup = buildingTileset.getTileCollisionGroup(tile.index);
      console.log(buildingTileset);
      //@ts-ignore
      if (!collisionGroup || collisionGroup.objects.length === 0) {
        return;
      }

      // You can assign custom properties to the whole collision object layer (or even to
      // individual objects within the layer). Here, use a custom property to change the color of
      // the stroke.
      //@ts-ignore
      if (
        //@ts-ignore
        collisionGroup.properties &&
        //@ts-ignore
        collisionGroup.properties.isInteractive
      ) {
        graphics.lineStyle(5, 0x00ff00, 1);
      } else {
        graphics.lineStyle(5, 0x00ffff, 1);
      }

      // The group will have an array of objects - these are the individual collision shapes
      //@ts-ignore
      var objects = collisionGroup.objects;

      for (var i = 0; i < objects.length; i++) {
        var object = objects[i];
        var objectX = tileWorldPos.x + object.x;
        var objectY = tileWorldPos.y + object.y;

        // When objects are parsed by Phaser, they will be guaranteed to have one of the
        // following properties if they are a rectangle/ellipse/polygon/polyline.
        if (object.rectangle) {
          graphics.strokeRect(objectX, objectY, object.width, object.height);
        } else if (object.ellipse) {
          // Ellipses in Tiled have a top-left origin, while ellipses in Phaser have a center
          // origin
          graphics.strokeEllipse(
            objectX + object.width / 2,
            objectY + object.height / 2,
            object.width,
            object.height
          );
        } else if (object.polygon || object.polyline) {
          var originalPoints = object.polygon
            ? object.polygon
            : object.polyline;
          var points = [];
          for (var j = 0; j < originalPoints.length; j++) {
            var point = originalPoints[j];
            points.push({
              x: objectX + point.x,
              y: objectY + point.y,
            });
          }
          graphics.strokePoints(points);
        }
      }
    });

    let query = new Moralis.Query("GameState");
    let subscription = await query.subscribe();
    query.equalTo("stateType", "globalGameState");
    subscription.on("update", (object) => {
      this.state = object.get("state");
      //console.log(this.state);
    });

    this.state = await Moralis.Cloud.run("getState");
  }
  async update(time: any, delta: any) {
    this.timer++;
    if (this.timer > 10 && this.sprites[this.currentId]) {
      // Moralis.Cloud.run("move", {
      //   direction: "right",
      //   position: {
      //     x: this.sprites[this.currentId].x,
      //     y: this.sprites[this.currentId].y,
      //   },
      // });
      this.timer = 0;
    }

    if (
      this.sprites[this.currentId] &&
      this.sprites[this.currentId].setVelocityX
    ) {
      this.sprites[this.currentId].setVelocityX(0);
      this.sprites[this.currentId].setVelocityY(0);
    }

    if (this.wKey.isDown) {
      this.sprites[this.currentId].setVelocityY(-500);
      if (
        !this.sprites[this.currentId].anims.isPlaying ||
        this.sprites[this.currentId].anims.currentAnim.key != "up"
      ) {
        this.sprites[this.currentId].play("up");
      }
    } else if (this.aKey.isDown) {
      this.sprites[this.currentId].setVelocityX(-500);
      if (
        !this.sprites[this.currentId].anims.isPlaying ||
        this.sprites[this.currentId].anims.currentAnim.key != "left"
      ) {
        this.sprites[this.currentId].play("left");
      }
    } else if (this.sKey.isDown) {
      this.sprites[this.currentId].setVelocityY(500);
      if (
        !this.sprites[this.currentId].anims.isPlaying ||
        this.sprites[this.currentId].anims.currentAnim.key != "down"
      ) {
        this.sprites[this.currentId].play("down");
      }
    } else if (this.dKey.isDown) {
      this.sprites[this.currentId].setVelocityX(500);
      if (
        !this.sprites[this.currentId].anims.isPlaying ||
        this.sprites[this.currentId].anims.currentAnim.key != "right"
      ) {
        this.sprites[this.currentId].play("right");
      }
    }
    this.drawState();
  }
  async ping() {
    setTimeout(this.ping, 1000);
    await Moralis.Cloud.run("ping");
  }

  drawState() {
    for (let userId in this.state) {
      // new player that we haven't seen - need to load image, create sprite
      if (!this.sprites[userId]) {
        this.sprites[userId] = { loading: true };

        const svgBlob = new Blob([this.state[userId].svg], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);
        this.load
          .spritesheet("player" + userId, playerSprite, {
            frameWidth: 192,
            frameHeight: 264,
          })
          .on(
            "filecomplete",
            () => {
              if (this.sprites[userId].loading) {
                this.sprites[userId].loading = false;
                setTimeout(() => {
                  //had to add this delay for images to always show
                  this.sprites[userId] = this.physics.add
                    .sprite(
                      this.state[userId].x,
                      this.state[userId].y,
                      "player" + userId
                    )
                    .setScale(1, 1)
                    .setOrigin(0, 0);

                  this.anims.create({
                    key: "down",
                    frameRate: 30,
                    frames: this.anims.generateFrameNumbers("player" + userId, {
                      start: 15,
                      end: 29,
                    }),
                    repeat: 0,
                  });
                  this.anims.create({
                    key: "left",
                    frameRate: 30,
                    frames: this.anims.generateFrameNumbers("player" + userId, {
                      start: 30,
                      end: 44,
                    }),
                    repeat: 0,
                  });
                  this.anims.create({
                    key: "up",
                    frameRate: 30,
                    frames: this.anims.generateFrameNumbers("player" + userId, {
                      start: 0,
                      end: 14,
                    }),
                    repeat: 0,
                  });
                  this.anims.create({
                    key: "right",
                    frameRate: 30,
                    frames: this.anims.generateFrameNumbers("player" + userId, {
                      start: 45,
                      end: 59,
                    }),
                    repeat: 0,
                  });
                  this.sprites[userId].play("down");

                  this.physics.add.collider(
                    this.sprites[userId],
                    this.wallLayer
                  );
                }, 200);
              }
            },
            this
          );
        this.load.start();
      } else {
        if (userId !== this.currentId) {
          let d = Math.abs(this.state[userId].y - this.sprites[userId].y) / 8;
          if (d > 1)
            if (this.sprites[userId].y < this.state[userId].y) {
              this.sprites[userId].y += d;

              this.sprites[userId].play("down");
            } else if (this.sprites[userId].y > this.state[userId].y) {
              this.sprites[userId].y -= d;
              this.sprites[userId].play("up");
            }
          let dx = Math.abs(this.state[userId].x - this.sprites[userId].x) / 8;
          if (dx > 1)
            if (this.sprites[userId].x < this.state[userId].x) {
              this.sprites[userId].x += dx;
              this.sprites[userId].play("right");
            } else if (this.sprites[userId].x > this.state[userId].x) {
              this.sprites[userId].x -= dx;
              this.sprites[userId].play("left");
            }
        } else {
          this.cameras.main.startFollow(this.sprites[this.currentId], true);
          if (Math.abs(this.sprites[userId].x - this.state[userId].x) > 3500)
            this.sprites[userId].x = this.state[userId].x;
          if (Math.abs(this.sprites[userId].y - this.state[userId].y) > 3500)
            this.sprites[userId].y = this.state[userId].y;
        }
      }
    }
  }
}
export default MainScene;
