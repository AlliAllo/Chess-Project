// Window.tsx
import './CSS/Window.css';
import { useCallback, useState } from 'react';
import ChessBoardComponent from './ChessBoardComponent';
import AlgebraicNotationBox from './AlgebraicNotationBox';
import Menu from './MenuComponent';
import computerIcon from '../Assets/desktop.png';
import chessAvatar from '../Assets/userAvatar.svg';
import { GameProvider } from './GameContext'; // Import the context

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog } from '@fortawesome/free-solid-svg-icons'
import { faRepeat } from '@fortawesome/free-solid-svg-icons'

interface Props {
  children?: JSX.Element;
}

export default function Window(props: Props) {
  function boo(e: React.MouseEvent) {}
  const [flippedBoard, setFlippedBoard] = useState(false);


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

  const settingsFunction = () => {
    console.log("Settings button clicked");
    
  }

  const onBoardFlip = () => {
    console.log("Flip board button clicked");
    setFlippedBoard(!flippedBoard);
  }


  return (
    <GameProvider>
      <div className="window" onMouseDown={(e) => boo(e)} >
        <div className='menuBar'>
          <Menu /> 
        </div>

        <div className='topInfoBar'>
          <FontAwesomeIcon icon={faCog} className={"settings"} onClick={() => settingsFunction()}/>
          <FontAwesomeIcon icon={faRepeat} className={"flipBoard"} onClick={() => onBoardFlip()}/>

          <img src={computerIcon} alt='Computer Icon' className='enemyAvatar' />
          <span className='enemyName'>Computer</span>
        </div>

        <div className='buttomInfoBar'>
          <img src={chessAvatar} alt='Computer Icon' className='youAvatar' />
        </div>

        <div className='emptySpaceBarLeft'></div>
        <div className='emptySpaceBarRight'></div>

        <div className='chessBoard'>
          <ChessBoardComponent getAlgebraicNotation={getAlgebraicNotation} onKeyPressed={onKeyPressed} />
        </div>

        <div className='notationBox'>
          <AlgebraicNotationBox notation={notation} />
        </div>
      </div>
    </GameProvider>
  );
}
