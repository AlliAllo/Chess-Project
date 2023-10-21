import React, { ReactNode, useRef, useCallback, useState, useMemo, useEffect  } from 'react';
import Tile from './TileComponent';
import PawnPromotion from './PawnPromotionComponent';

import { Piece } from '../Classes/ChessBoard';
import { Square } from '../Classes/ChessGame';

import { pieceStyle } from "./ChessPieceComponent"
import './CSS/ChessBoard.css';
import { ChessGame } from '../Classes/ChessGame';

import WhiteKing from '../Assets/whiteKing.png';
import WhitePawn from '../Assets/whitePawn.png';
import WhiteRook from '../Assets/whiteRook.png';
import WhiteBishop from '../Assets/whiteBishop.png';
import WhiteQueen from '../Assets/whiteQueen.png';
import WhiteKnight from '../Assets/whiteKnight.png';
import BlackKing from '../Assets/blackKing.png';
import BlackPawn from '../Assets/blackPawn.png';
import BlackRook from '../Assets/blackRook.png';
import BlackBishop from '../Assets/blackBishop.png';
import BlackQueen from '../Assets/blackQueen.png';
import BlackKnight from '../Assets/blackKnight.png';

interface Props {
  children?: ReactNode
  
  getAlgebraicNotation: (PGN: string) => void
}




const game = new ChessGame();
let promotionSquareX = 1000;


export default function ChessBoardComponent(props: Props) {

  const [grabbedPiece, setGrabbedPiece] = useState<Piece | null>(null);
  const ghostPiece = useRef<HTMLDivElement>(null);
  const [chessGame, setChessGame] = useState<ChessGame>(game);
  const [promotion, setPromotion] = useState(chessGame.getPromotion());

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
    }
   
    setGrabbedPiece(null);
    setPromotion(chessGame.getPromotion());
    if (chessGame.getPromotion()) promotionSquareX = x;

  }, [grabbedPiece, chessGame, setChessGame, setGrabbedPiece]);

  const onPromotionSelect = useCallback((promotionType: string) => {
    chessGame.makePawnPromotion(promotionType);
    setPromotion(chessGame.getPromotion());
  } , [chessGame, setPromotion]);

  const revertPromotion = useCallback(() => {
    if (!chessGame.getPromotion()) return;
    chessGame.setPromotionInformationNull();
    chessGame.setPromotion(false);
    setPromotion(chessGame.getPromotion());

  }, [chessGame, setPromotion]);

  
  
  
  const move = (e: React.MouseEvent) => {
    const extra = grabbedPiece ? 0 : 50
    if (ghostPiece.current){
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

        const white = chessGame.getPromotionInformation()?.piece.white as boolean;
        const row = white ? 0 : 7;

        if (chessGame.getPromotionInformation()?.piece.x === piece?.x && chessGame.getPromotionInformation()?.piece.y === piece?.y) {
          piece = null;
        }

        // If we are grabbing a piece, we don't wish to display the original piece on the board.
        if ( grabbedPiece?.x === piece?.x && grabbedPiece?.y === piece?.y) {
          piece = null; 
        }

        let marked = undefined
        const xy: Square = [x, y]
        const op = chessGame.getListOfOpponentMarkedSquares()

        op.forEach(move => {
          if (move[0] === xy[0] && move[1] === xy[1]) {
            marked = "#5203fc";
          }
        });
        
        piecesToDisplayJSX.push(
          <Tile
          piece={piece}
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
    <React.Fragment> 
      <div className="chessboardContainer" onClick={() => revertPromotion()}>
        <div draggable={false} className="chessboard" onMouseMove={e => move(e)}>
          {piecesToDisplayJSX}
        </div>
        <div ref={ghostPiece} className="ghostPiece">
          {grabbedPiece && grabbedPiece.imageURL && 
          <img  
            style={pieceStyle} 
            draggable={false} 
            src={grabbedPiece.imageURL} 
            alt="ghostPiece">
          </img>}
        </div>
        <div> 
          {promotion &&  
            <PawnPromotion whoIsPromoting={chessGame.getPromotionInformation()?.piece.white as boolean}
              onPromotionSelect={(promotion: string) => {onPromotionSelect(promotion)}}
              promotionSquareX={promotionSquareX}
              onRevert={() => revertPromotion()}
              ></PawnPromotion>}
        </div>
      </div>
     
  </React.Fragment>
  );

}
