import './CSS/Window.css';
import { CSSProperties, useRef, useCallback, useState } from 'react';
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
  const windowSize = useRef([windowWidth, windowHeight]);

  const resetButtonStyle: CSSProperties = {
    top: windowHeight/100,
    left: windowWidth/2-100,
  }
  const appStyle: CSSProperties = { 
    width: windowSize.current[0],
    height: windowSize.current[1],
    
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
  }

  const [notation, setNotation] = useState<string | undefined>(undefined);

  const getAlgebraicNotation = useCallback((PGN: string) => {
    setNotation(PGN);
  }, [notation]);

  return (
      <div className="window" style={appStyle} onMouseDown={e => boo(e)}>

      <button style={resetButtonStyle} className='resetGameButton' onClick={resetGame}>Reset game</button>
      <ChessBoardComponent getAlgebraicNotation={getAlgebraicNotation}>
        </ChessBoardComponent>
        <AlgebraicNotationBox notation={notation}></AlgebraicNotationBox>
          
      </div>
  );
}

