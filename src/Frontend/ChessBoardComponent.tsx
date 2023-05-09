import React, { ReactNode, useRef, useCallback, useState, useMemo, useEffect  } from 'react';
import Tile from './TileComponent';
import { Piece } from '../Classes/ChessBoard';
import { Move } from '../Classes/Move';

import { pieceStyle } from "./ChessPieceComponent"
import './CSS/ChessBoard.css';
import { ChessGame } from '../Classes/ChessGame';

interface Props {
  children: ReactNode;
  
  getAlgebraicNotation: (PGN: string) => void
}



const game = new ChessGame();
game.calcLegalMoves(game.getBoard(), null)
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
    if (grabbedPiece){
    
      if (grabbedPiece.x === x && grabbedPiece.y === y) {
        // If we drop the piece on the same tile it is on, we do nothing.
        setGrabbedPiece(null);
        return;
      }

      const isLegal: boolean = grabbedPiece.legalMoves.some(a => a[0] === x && a[1] === y)

      // True means white, false means black.
      const turn = chessGame.whoseTurn();
      

      if (isLegal && grabbedPiece.white === turn) {

        // Here we create a new piece that is a copy of the grabbedPiece, but with the x and y values of the tile it is dropped on.
        const newPiece: Piece = { ...grabbedPiece, x: x, y: y };
        const capture: boolean = chessGame.getBoard()[newPiece.x][newPiece.y] ? true : false;

        // Consider the case where we are castling.
        const distance = newPiece.x - grabbedPiece.x;
        const castling = newPiece.symbol === "K" && Math.abs(distance) >= 2;
        if (castling) {
          // If we are castling, we need to move the rook as well.
          
          const row = newPiece.white ? 0 : 7; 
          const kingColumn = x >= 6 ? 7 : 2; // if x is 6 or 7, we are castling to the right, otherwise to the left.

          const newRookColumn = kingColumn === 7 ? 5 : 3; // if kingColumn is 7, we are castling to the right, otherwise to the left.
          const formerRookColumn = kingColumn === 7 ? 7 : 0; // if kingColumn is 7, we are castling to the right, otherwise to the left.
          
          const newRook: Piece = { ...chessGame.getBoard()[formerRookColumn][row] as Piece, x: newRookColumn, y: row };

          // Update the king.
          const newKing: Piece = { ...newPiece, x: kingColumn, y: row };
          chessGame.makeMove(chessGame.getBoard(), null, [grabbedPiece.x, grabbedPiece.y]);
          chessGame.makeMove(chessGame.getBoard(), newKing, [newPiece.x, newPiece.y]);

          // Update the rook.
          chessGame.makeMove(chessGame.getBoard(), null, [formerRookColumn, row]);
          chessGame.makeMove(chessGame.getBoard(), newRook, [newRookColumn, row]);

          chessGame.newTurn([newPiece.x, newPiece.y], newPiece, capture, false, x >= 6 ? true : false);

        }
        else{
        chessGame.makeMove(chessGame.getBoard(), null, [grabbedPiece.x, grabbedPiece.y]);
        chessGame.makeMove(chessGame.getBoard(), newPiece, [newPiece.x, newPiece.y]);
        chessGame.newTurn([newPiece.x, newPiece.y], newPiece, capture, false, null);

        }

        if (newPiece.symbol === "K") chessGame.updateKingPosition([newPiece.x, newPiece.y])
        
        chessGame.calcLegalMoves(chessGame.getBoard(), null);
        // Call the usecallback hook to update the notation of the game.
        props.getAlgebraicNotation(chessGame.getPGN())
        setChessGame(chessGame);
        setGrabbedPiece(null);
        

      } else {
        // Illegal move, return the piece to its original position.
        setGrabbedPiece(null);
      }
    }
      }, [grabbedPiece, chessGame, setChessGame, setGrabbedPiece]);

  

  const move = (e: React.MouseEvent) => {
    const extra = grabbedPiece ? 0 : 50
    if (ghostPiece.current){
      console.log("MOVING");
      ghostPiece.current.style.position = "fixed";
      ghostPiece.current.style.top = `${e.clientY - extra - ghostPiece.current.clientHeight / 2}px`; 
      ghostPiece.current.style.left = `${e.clientX -extra - ghostPiece.current.clientWidth / 2}px`;
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


          piecesToDisplayJSX.push(
                <Tile
                piece={showPiece ? piece : null}
                legalTile={grabbedPiece?.legalMoves.some(a => a[0] === x && a[1] === y)}
                grabbedPiece={grabbedPiece}
                onStartDragging={onStartDragging}
                onDrop={onDrop}
                x={x} y={y} 
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
