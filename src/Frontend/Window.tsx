// Window.tsx
import './CSS/Window.css';
import { useCallback, useState } from 'react';
import ChessBoardComponent from './ChessBoardComponent';
import AlgebraicNotationBox from './AlgebraicNotationBox';
import Menu from './MenuComponent';
import computerIcon from '../Assets/desktop.png';
import chessAvatar from '../Assets/userAvatar.svg';
import { GameProvider } from './GameContext'; // Import the context

interface Props {
  children?: JSX.Element;
}

export default function Window(props: Props) {
  function boo(e: React.MouseEvent) {}

  function resetGame() {
    window.location.reload();
  }

  const [notation, setNotation] = useState<string | undefined>(undefined);

  const onKeyPressed = (e: React.KeyboardEvent) => {
    // Call the function in ChessBoardComponent with the event
    // For example, you can call a function named handleKeyDown in ChessBoardComponent
    // Pass any necessary parameters
    // Replace 'chessBoardInstance' with the actual instance of ChessBoardComponent
    // chessBoardInstance.handleKeyDown(e);
  };

  const getAlgebraicNotation = useCallback((PGN: string) => {
    setNotation(PGN);
  }, []);

  return (
    <GameProvider>
      <div className="window" onMouseDown={(e) => boo(e)} >
        <div className='menuBar'>
          <Menu /> 
        </div>

        <div className='topInfoBar'>
          <button className='resetGameButton' onClick={resetGame}>
            Reset game
          </button>
          <img src={computerIcon} alt='Computer Icon' className='enemyAvatar' />
          <span className='enemyName'>Computer</span>
        </div>

        <div className='buttomInfoBar'>
          <img src={chessAvatar} alt='Computer Icon' className='youAvatar' />
        </div>

        <div className='emptySpaceBarLeft'></div>
        <div className='emptySpaceBarRight'></div>

        <div className='chessBoard'>
          <ChessBoardComponent getAlgebraicNotation={getAlgebraicNotation} onKeyPressed={onKeyPressed}  />
        </div>

        <div className='notationBox'>
          <AlgebraicNotationBox notation={notation} />
        </div>
      </div>
    </GameProvider>
  );
}
