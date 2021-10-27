import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { useMoralis } from "react-moralis";
import Phaser from "phaser";
import { IonPhaser, GameInstance } from "@ion-phaser/react";

import MainScene from "./MainScence";

const gameConfig: GameInstance = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.ScaleModes.FIT,
    //autoCenter: Phaser.Scale.Center.CENTER_BOTH,
    width: 1024,
    height: 400,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
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
    <div>
      <h1>Welcome {user?.get("username")}</h1>
      <button onClick={() => logout()} disabled={isAuthenticating}>
        Logout
      </button>

      <header className="App-header">
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
      </header>
    </div>
  );
}

export default App;
