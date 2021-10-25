import Moralis from "moralis";
import background from "./images/bg.jpg";

class MainScene extends Phaser.Scene {
  private helloWorld!: Phaser.GameObjects.Text;
  private wKey!: Phaser.Input.Keyboard.Key;
  private aKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;
  private sprites: any = {};
  private state: any = {};
  private keyLock = true;
  init() {
    this.cameras.main.setBackgroundColor("#24252A");
  }
  preload() {
    this.ping();
    this.load.image("background", background);
  }
  async create() {
    this.helloWorld = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "Hello World",
      {
        font: "40px Arial",
        color: "#ffffff",
      }
    );

    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.add.image(0, 0, "background").setOrigin(0, 0).setScale(1, 0.8);
    this.helloWorld.setOrigin(0.5).setDepth(10);
    let query = new Moralis.Query("GameState");
    let subscription = await query.subscribe();
    query.equalTo("stateType", "globalGameState");
    subscription.on("update", (object) => {
      this.state = object.get("state");
      console.log(this.state);
    });

    this.state = await Moralis.Cloud.run("getState");
  }
  async update() {
    this.helloWorld.angle += 1;
    if (this.wKey.isDown && this.keyLock) {
      console.log("UP");
      this.keyLock = false;
      await Moralis.Cloud.run("move", { direction: "up" });
      this.keyLock = true;
    }
    if (this.aKey.isDown && this.keyLock) {
      this.keyLock = false;
      await Moralis.Cloud.run("move", { direction: "left" });
      this.keyLock = true;
    }
    if (this.sKey.isDown && this.keyLock) {
      this.keyLock = false;
      await Moralis.Cloud.run("move", { direction: "down" });
      this.keyLock = true;
    }
    if (this.dKey.isDown && this.keyLock) {
      this.keyLock = false;
      await Moralis.Cloud.run("move", { direction: "right" });
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
          .image(
            "player" + userId,
            "https://wiki.aavegotchi.com/socialmedia/alfredgotchiwelcome.png"
          )
          .on(
            "filecomplete",
            () => {
              if (this.sprites[userId].loading) {
                this.sprites[userId].loading = false;
                setTimeout(() => {
                  //had to add this delay for images to always show
                  this.sprites[userId] = this.physics.add
                    .image(
                      this.state[userId].x,
                      this.state[userId].y,
                      "player" + userId
                    )
                    .setScale(0.5, 0.5)
                    .setOrigin(0, 0);
                }, 100);
              }
            },
            this
          );
        this.load.start();
      } else {
        if (this.sprites[userId].x < this.state[userId].x)
          this.sprites[userId].x += 20;
        else if (this.sprites[userId].x > this.state[userId].x)
          this.sprites[userId].x -= 20;
        if (this.sprites[userId].y < this.state[userId].y)
          this.sprites[userId].y += 20;
        else if (this.sprites[userId].y > this.state[userId].y)
          this.sprites[userId].y -= 20;
      }
    }
  }
}
export default MainScene;
