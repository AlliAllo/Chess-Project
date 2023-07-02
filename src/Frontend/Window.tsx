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
  const windowSize = useRef([window.innerWidth, window.innerHeight]);

  const resetButtonStyle: CSSProperties = {
    left: 400 + 200,
  }
  const appStyle: CSSProperties = { 
    width: windowSize.current[0]+200,
    height: windowSize.current[1]+600,
    
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

      <button style={resetButtonStyle} className='resetGameButton' onClick={() => {console.log("reset game!")}}>Reset game</button>
      <ChessBoardComponent getAlgebraicNotation={getAlgebraicNotation}>
        </ChessBoardComponent>
        <AlgebraicNotationBox notation={notation}></AlgebraicNotationBox>
          
      </div>
  );
}

