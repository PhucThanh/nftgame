import Moralis from "moralis";
import tiles from "./images/tiles.png";
class MainScene extends Phaser.Scene {
  private wKey!: Phaser.Input.Keyboard.Key;
  private aKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;
  private sprites: any = {};
  private state: any = {};
  private keyLock = true;
  private wallLayer: any;
  private treeLayer: any;
  private currentId!: string;
  private timer = 0;

  init() {
    this.cameras.main.setBackgroundColor("#24252A");
  }
  preload() {
    this.ping();
    this.load.image("tiles", tiles);
    this.load.tilemapTiledJSON("map", `${process.env.PUBLIC_URL}/tiles.json`);
  }
  async create() {
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("normal", "tiles");

    this.wallLayer = map.createLayer("Wall", tileset).setDepth(-1);
    this.treeLayer = map.createLayer("Trees", tileset).setDepth(-2);
    const groundLayer = map.createLayer("Ground", tileset).setDepth(-3);

    this.wallLayer.setCollisionByProperty({ collide: true });
    this.treeLayer.setCollisionByProperty({ collide: true });

    this.currentId = Moralis.User.current()?.get("username");

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
      console.log("move");
      Moralis.Cloud.run("move", {
        direction: "right",
        position: {
          x: this.sprites[this.currentId].x,
          y: this.sprites[this.currentId].y,
        },
      });
      this.timer = 0;
    }

    if (
      this.sprites[this.currentId] &&
      this.sprites[this.currentId].setVelocityX
    ) {
      this.sprites[this.currentId].setVelocityX(0);
      this.sprites[this.currentId].setVelocityY(0);
    }

    if (this.wKey.isDown && this.keyLock) {
      this.keyLock = true;
      this.sprites[this.currentId].setVelocityY(-200);
      this.sprites[this.currentId].play("up");
      this.keyLock = true;
    }
    if (this.aKey.isDown && this.keyLock) {
      this.keyLock = false;
      this.sprites[this.currentId].setVelocityX(-200);
      this.sprites[this.currentId].play("left");
      this.keyLock = true;
    }
    if (this.sKey.isDown && this.keyLock) {
      this.keyLock = false;
      this.sprites[this.currentId].setVelocityY(200);
      this.sprites[this.currentId].play("down");
      this.keyLock = true;
    }
    if (this.dKey.isDown && this.keyLock) {
      this.keyLock = false;

      this.sprites[this.currentId].setVelocityX(200);
      this.sprites[this.currentId].play("right");
      this.keyLock = true;
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
          .spritesheet(
            "player" + userId,
            `${process.env.PUBLIC_URL}/player.png`,
            { frameWidth: 32, frameHeight: 32 }
          )
          .on(
            "filecomplete",
            () => {
              if (this.sprites[userId].loading) {
                this.sprites[userId].loading = false;
                setTimeout(() => {
                  //had to add this delay for images to always show

                  console.log(this.sprites[this.currentId].x);
                  this.sprites[userId] = this.physics.add
                    .sprite(
                      this.state[userId].x,
                      this.state[userId].y,
                      "player" + userId
                    )
                    .setScale(1, 1)
                    .setOrigin(0, 0);
                  this.physics.add.collider(
                    this.sprites[userId],
                    this.wallLayer
                  );
                  this.physics.add.collider(
                    this.sprites[userId],
                    this.treeLayer
                  );
                  this.anims.create({
                    key: "down",
                    frameRate: 5,
                    frames: this.anims.generateFrameNumbers("player" + userId, {
                      start: 0,
                      end: 3,
                    }),
                    repeat: 0,
                  });
                  this.anims.create({
                    key: "left",
                    frameRate: 5,
                    frames: this.anims.generateFrameNumbers("player" + userId, {
                      start: 4,
                      end: 7,
                    }),
                    repeat: 0,
                  });
                  this.anims.create({
                    key: "up",
                    frameRate: 5,
                    frames: this.anims.generateFrameNumbers("player" + userId, {
                      start: 8,
                      end: 11,
                    }),
                    repeat: 0,
                  });
                  this.anims.create({
                    key: "right",
                    frameRate: 5,
                    frames: this.anims.generateFrameNumbers("player" + userId, {
                      start: 12,
                      end: 15,
                    }),
                    repeat: 0,
                  });
                }, 100);
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
          if (Math.abs(this.sprites[userId].x - this.state[userId].x) > 500)
            this.sprites[userId].x = this.state[userId].x;
          if (Math.abs(this.sprites[userId].y - this.state[userId].y) > 500)
            this.sprites[userId].y = this.state[userId].y;
        }
      }
    }
  }
}
export default MainScene;
