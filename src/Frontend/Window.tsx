import React from 'react';
import './CSS/App.css';
import { CSSProperties } from 'react';
import ChessBoardComponent from './ChessBoardComponent';

interface Props {
  children?: JSX.Element;
}

const appStyle: CSSProperties = { 
  width: '100%',
  height: '100%', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  overflow: 'hidden'
}

export default function Window(bee: Props) {
  function boo(e: React.MouseEvent) {
  }

  return (
      <div className="window" style={appStyle} onMouseDown={e => boo(e)}>
      
      <ChessBoardComponent >
        </ChessBoardComponent>
          
      </div>
  );
}

