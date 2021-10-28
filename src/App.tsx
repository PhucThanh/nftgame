//@ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { useMoralis } from "react-moralis";
import Phaser from "phaser";
import { IonPhaser, GameInstance } from "@ion-phaser/react";

import MainScene from "./MainScence";
const gamez = {
  width: "100%",
  height: "100%",
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.ENVELOP,
  },
  scene: {
    init: function () {
      this.cameras.main.setBackgroundColor("#24252A");
    },
    create: function () {
      this.helloWorld = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "Hello World",
        {
          font: "40px Arial",
          fill: "#ffffff",
        }
      );
      this.helloWorld.setOrigin(0.5);
    },
    update: function () {
      this.helloWorld.angle += 1;
    },
  },
};

const gameConfig: GameInstance = {
  type: Phaser.AUTO,
  width: "100%",
  height: "100%",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
  render: { antialias: false, pixelArt: true, roundPixels: true },
  scene: MainScene,
};

function App() {
  const { authenticate, isAuthenticated, user, logout, isAuthenticating } =
    useMoralis();
  const gameRef = useRef<HTMLIonPhaserElement>(null);
  const [game, setGame] = useState<GameInstance>(gameConfig);
  const [initialize, setInitialize] = useState(false);
  const [width, setWidth] = useState("99%");

  useEffect(() => {
    console.log(JSON.stringify(user));
  }, [user]);

  const destroy = () => {
    gameRef.current?.destroy();
    setInitialize(false);
    //setGame(undefined);
  };
  useEffect(() => {
    if (initialize) {
      setGame(Object.assign({}, gameConfig));
    }
  }, [initialize]);
  return (
    <div id="phaser-container" style={{ height: "100vh", width: { width } }}>
      <IonPhaser ref={gameRef} game={game} />
    </div>
  );
  if (!isAuthenticated) {
    return (
      <div>
        <button onClick={() => authenticate({ onComplete: () => alert("🎉") })}>
          Authenticate
        </button>
      </div>
    );
  }

  return (
    <>
      <h1>Welcome {user?.get("username")}</h1>
      <button onClick={() => logout()} disabled={isAuthenticating}>
        Logout
      </button>

      {initialize ? (
        <>
          <IonPhaser ref={gameRef} game={game} initialize={initialize} />
          <div onClick={destroy} className="flex destroyButton">
            <a href="#1" className="bttn">
              End game
            </a>
          </div>
        </>
      ) : (
        <>
          <div onClick={() => setInitialize(true)} className="flex">
            <a href="#1" className="bttn">
              Start game
            </a>
          </div>
        </>
      )}
    </>
  );
}

export default App;
