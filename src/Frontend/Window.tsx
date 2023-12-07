import './CSS/Window.css';
import { CSSProperties, useCallback, useState } from 'react';
import ChessBoardComponent from './ChessBoardComponent';
import AlgebraicNotationBox from './AlgebraicNotationBox';

interface Props {
  children?: JSX.Element;
}


export default function Window(bee: Props) {


  function boo(e: React.MouseEvent) {
  }


  function resetGame() {
    window.location.reload();
  }

  const [windowWidth, windowHeight] = [window.innerWidth, window.innerHeight];

  const resetButtonStyle: CSSProperties = {
    top: windowHeight/100,
    left: windowWidth/2-100,
  }

  const [notation, setNotation] = useState<string | undefined>(undefined);

  const getAlgebraicNotation = useCallback((PGN: string) => {
    setNotation(PGN);
  }, []);


  return (
      <div className="window" onMouseDown={e => boo(e)}>

        <button style={resetButtonStyle} className='resetGameButton' onClick={resetGame}>Reset game</button>

        <div className='menuBar'>Menubar</div>

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

