import React, { ReactNode, useRef, useCallback, useState, useMemo, useEffect  } from 'react';
import Tile from './TileComponent';
import { Piece } from '../Classes/ChessBoard';
import { Move } from '../Classes/Move';

import { pieceStyle } from "./ChessPieceComponent"
import './CSS/ChessBoard.css';
import { ChessGame } from '../Classes/ChessGame';

interface Props {
  children?: ReactNode
  
  getAlgebraicNotation: (PGN: string) => void
}



const game = new ChessGame();
game.calcLegalMoves()
const board = game.getBoard();


export default function ChessBoardComponent(props: Props) {

  const [grabbedPiece, setGrabbedPiece] = useState<Piece | null>(null);
  const ghostPiece = useRef<HTMLDivElement>(null);
  const [chessGame, setChessGame] = useState<ChessGame>(game);

  

  const onStartDragging = useCallback((thisPiece: Piece | null, e: React.MouseEvent) => {
    setGrabbedPiece(thisPiece);
    move(e)
      }, [setGrabbedPiece]);


  // This is where we drop the piece. Very important function :)
  const onDrop = useCallback((x: number, y: number) => {
    if (!(grabbedPiece)) return;
    if (chessGame.makeMove(grabbedPiece, [x, y])) {
      // Call the usecallback hook to update the notation of the game.
      props.getAlgebraicNotation(chessGame.getPGN())
      setChessGame(chessGame);
      setGrabbedPiece(null);
    }
    else {
      // Illegal move, return the piece to its original position.
      setGrabbedPiece(null);
    }
  }, [grabbedPiece, chessGame, setChessGame, setGrabbedPiece]);

  
  const move = (e: React.MouseEvent) => {
    const extra = grabbedPiece ? 0 : 50
    if (ghostPiece.current){
      //console.log("MOVING");
      ghostPiece.current.style.position = "fixed";
      ghostPiece.current.style.top = `${e.clientY - extra - ghostPiece.current.clientHeight / 2}px`; 
      ghostPiece.current.style.left = `${e.clientX - extra - ghostPiece.current.clientWidth / 2}px`;
    }
  };
  
  let piecesToDisplayJSX: JSX.Element[] = []

  for (let y = 7; y >= 0; y--) {
      for (let x = 0; x < chessGame.getBoard()[y].length; x++) {
        
        let piece = chessGame.getBoard()[x][y];
        const isWhite: boolean = (x + y) % 2 === 0 ? false : true
        const showPiece = true

        // If we are grabbing a piece, we don't wish to display the original piece on the board.
        if ( grabbedPiece?.x === piece?.x && grabbedPiece?.y === piece?.y) {
          piece = null 
        }

        let marked = undefined
        const xy: Move = [x, y]
        const op = chessGame.getopponentMarkedSquares()

        op.forEach(move => {
          if (move[0] === xy[0] && move[1] === xy[1]) {
            marked = "#5203fc";
          }
        });
        
  

        piecesToDisplayJSX.push(
              <Tile
              piece={showPiece ? piece : null}
              legalTile={grabbedPiece?.legalMoves.some(a => a[0] === x && a[1] === y)}
              grabbedPiece={grabbedPiece}
              onStartDragging={onStartDragging}
              onDrop={onDrop}
              x={x} y={y} 
              color={marked}
              tileIsWhite={isWhite} ></Tile>
        )
      
      }
    }



  return (
    <React.Fragment > 
      
    <div draggable={false} className="chessboard" onMouseMove={e => move(e)}>
      {piecesToDisplayJSX}
    </div>
    <div ref={ghostPiece} className="ghostPiece">
      {grabbedPiece && grabbedPiece.imageURL && <img  
      style={pieceStyle} 
      draggable={false} 
      src={grabbedPiece.imageURL} 
      alt="ghostPiece"></img>
      }
    </div>
  </React.Fragment>
  );
}
