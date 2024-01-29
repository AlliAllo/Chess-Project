import './CSS/Window.css';
import { useCallback, useState } from 'react';
import ChessBoardComponent from './ChessBoardComponent';
import AlgebraicNotationBox from './AlgebraicNotationBox';
import Menu from './MenuComponent';
import computerIcon from '../Assets/desktop.png';
import chessAvatar from '../Assets/userAvatar.svg';

interface Props {
  children?: JSX.Element;
}


export default function Window(bee: Props) {


  function boo(e: React.MouseEvent) {
  }


  function resetGame() {
    window.location.reload();
  }

  const [notation, setNotation] = useState<string | undefined>(undefined);

  const getAlgebraicNotation = useCallback((PGN: string) => {
    setNotation(PGN);
  }, []);


  return (
      <div className="window" onMouseDown={e => boo(e)}>


        <div className='menuBar'>
          <Menu ></Menu>
        </div>

        <div className='topInfoBar'> 
          <button className='resetGameButton' onClick={resetGame}>Reset game</button>
          <img src={computerIcon} alt="Computer Icon" className='enemyAvatar' />
          <span className='enemyName'>Computer</span>
        </div>

        <div className='buttomInfoBar'>
          <img src={chessAvatar} alt="Computer Icon" className='youAvatar' />
        </div>
        

        <div className='emptySpaceBarLeft'></div>
        <div className='emptySpaceBarRight'></div>

        <div className='chessBoard'>
          <ChessBoardComponent getAlgebraicNotation={getAlgebraicNotation}>
          </ChessBoardComponent>
        </div>

        

        <div className='notationBox'>
          <AlgebraicNotationBox notation={notation}></AlgebraicNotationBox>
        </div>
      
            
      </div>
  );
}

