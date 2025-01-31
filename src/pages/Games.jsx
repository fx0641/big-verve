import { useRef, useState } from 'react';
import { PhaserGame } from '../game/PhaserGame';

function Games() {
  const gameRef = useRef();
  const [buttonText, setButtonText] = useState('Start Game');

  const changeScene = () => {
    const scene = gameRef.current.scene;
    if (scene) {
      scene.changeScene();
    }
  }

  const handleSceneReady = (scene) => {
    console.log('Scene ready:', scene);
    if (gameRef.current) {
      gameRef.current.scene = scene;
      // Start logo movement immediately if it's the MainMenu scene
      if (scene.scene.key === 'MainMenu') {
        scene.moveLogo();
        setButtonText('Start Game');
      } else if (scene.scene.key === 'Game') {
        setButtonText('End Game');
      } else if (scene.scene.key === 'GameOver') {
        setButtonText('Restart');
      }
    }
  };

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-4xl font-bold mb-4">
        <span className="text-[#2D7EFF]">Our </span>
        <span className="text-[#FF4D00]">Games</span>
      </h1>
      
      {/* Game Controls */}
      <div className="max-w-4xl mx-auto mb-4 flex justify-center">
        <button 
          onClick={changeScene}
          className="bg-[#2D7EFF] hover:bg-[#4C8FFF] text-white font-medium py-2 px-6 rounded-full transition-all"
        >
          {buttonText}
        </button>
      </div>

      {/* Game Container */}
      <div className="max-w-4xl mx-auto">
        <PhaserGame ref={gameRef} currentActiveScene={handleSceneReady} />
      </div>
    </div>
  )
}

export default Games 