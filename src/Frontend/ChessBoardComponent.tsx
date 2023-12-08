import React, { ReactNode, useRef, useCallback, useState, CSSProperties  } from 'react';
import Tile from './TileComponent';
import PawnPromotion from './PawnPromotionComponent';

import { Piece } from '../Classes/ChessBoard';
// import { Square } from '../Classes/ChessGame';

import './CSS/ChessBoard.css';
import { ChessGame } from '../Classes/ChessGame';

import ConfettiExplosion from 'react-confetti-explosion';


interface Props {
  children?: ReactNode
  
  getAlgebraicNotation: (PGN: string) => void
  // onKeyPress: (e: React.KeyboardEvent) => void
}




const game = new ChessGame();
let promotionSquareX = 1000;


export default function ChessBoardComponent(props: Props) {

  const [grabbedPiece, setGrabbedPiece] = useState<Piece | null>(null);
  const ghostPiece = useRef<HTMLDivElement>(null);
  const [chessGame, setChessGame] = useState<ChessGame>(game);
  const [promotion, setPromotion] = useState(chessGame.getPromotion());
  const [check, setCheck] = useState(false);
  const [attacker , setAttacker] = useState<Piece | null>(null);
  const [positionNumber, setPositionNumber] = useState<number>(0);

  // const onDrop = useCallback((e: React.KeyboardEvent) => {
  //   loadChessBoard(e);
  // }, []);
  


  const onStartDragging = useCallback((thisPiece: Piece | null, e: React.MouseEvent) => {
    setGrabbedPiece(thisPiece);
    move(e)
      }, [setGrabbedPiece]);


  // This is where we drop the piece. Very important function :)
  const onDrop = useCallback((x: number, y: number) => {
    if (!(grabbedPiece)) return;
    if (positionNumber === chessGame.getPositionHistory().length - 1 && chessGame.makeMove(grabbedPiece, [x, y])) {
      // Call the usecallback hook to update the notation of the game.
      props.getAlgebraicNotation(chessGame.getPGN())
      setChessGame(chessGame);
    }
    setAttacker(chessGame.getAttacker());
    setCheck(chessGame.getCheck());
    setGrabbedPiece(null);
    setPromotion(chessGame.getPromotion());
    setPositionNumber(chessGame.getPositionHistory().length - 1);
    if (chessGame.getPromotion()) promotionSquareX = x;

  }, [grabbedPiece, positionNumber, chessGame, props]);

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

  const tileElements = document.getElementsByClassName("tile");
  const move = (e: React.MouseEvent) => {
    if (ghostPiece.current){
      ghostPiece.current.style.top = `${e.clientY  - ghostPiece.current.clientHeight / 2}px`; 
      ghostPiece.current.style.left = `${e.clientX  - ghostPiece.current.clientWidth / 2}px`;
    }
  };

  // const loadChessBoard = (e: React.KeyboardEvent) => {
  //   if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  //   const back = e.key === "ArrowLeft" ? true : false;

  //   console.log(positionNumber, chessGame.getPositionHistory().length)
  //   if (back === true && positionNumber > 0) {
  //     const position = chessGame.getPositionHistory()[positionNumber - 1];
  //     setPositionNumber(positionNumber - 1);
  //     console.log(positionNumber, position)
  //     game.setChessBoard(position);
  //   }
  //   if (back === false && positionNumber < chessGame.getPositionHistory().length - 1) {
  //     const position = chessGame.getPositionHistory()[positionNumber + 1];
  //     setPositionNumber(positionNumber + 1);
  //     console.log(positionNumber, position)

  //     game.setChessBoard(position);
  //   }
    
  //   setChessGame(game);
  // }
  
  let piecesToDisplayJSX: JSX.Element[] = []

  for (let y = 7; y >= 0; y--) {
      for (let x = 0; x < chessGame.getBoard()[y].length; x++) {
        let piece = chessGame.getBoard()[x][y];

        const isWhite: boolean = (x + y) % 2 === 0 ? false : true

        // const white = chessGame.getPromotionInformation()?.piece.white as boolean;
        // const row = white ? 0 : 7;

        if (chessGame.getPromotionInformation()?.piece.x === piece?.x && chessGame.getPromotionInformation()?.piece.y === piece?.y) {
          piece = null;
        }

        // If we are grabbing a piece, we don't wish to display the original piece on the board.
        if ( grabbedPiece?.x === piece?.x && grabbedPiece?.y === piece?.y) {
          piece = null; 
        }

        let marked = undefined

        /*
         op.forEach(move => {
          if (move[0] === xy[0] && move[1] === xy[1]) {
            marked = "#5203fc";
          }
        });
        */
        
        
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

  

  const confettiStyle: CSSProperties = {
    position: "absolute",
    top: attacker ? 100*attacker?.y + + 200 : "0px",
    left: attacker ? 100*attacker?.x + 830 : "0px",
    zIndex: 2,
  } 

  const ghostPieceStyle: CSSProperties = {
    position: "fixed",
    width: `${tileElements ? tileElements[0]?.clientWidth : 0}px`,
    height: `${tileElements ? tileElements[0]?.clientHeight : 0}px`,
  } 




  return (
      <React.Fragment>
        <div draggable={false} className="chessboard" onMouseMove={e => move(e)}>
          {piecesToDisplayJSX}
        </div>
        <div ref={ghostPiece} className="ghostPiece" style={ghostPieceStyle}>
          {grabbedPiece && grabbedPiece.imageURL && 
          <img  
            className='ghostPieceIMG'
            draggable={false} 
            src={grabbedPiece.imageURL} 
            alt="ghostPiece">
          </img>}
        </div>
        <div>
          {check && 
          <ConfettiExplosion style={confettiStyle} force={0.4} duration={2200} particleCount={35} width={400}/>
          }
        </div>
        <div> 
          {promotion &&  
            <PawnPromotion whoIsPromoting={chessGame.getPromotionInformation()?.piece.white as boolean}
              onPromotionSelect={(promotion: string) => {onPromotionSelect(promotion)}}
              promotionSquareX={promotionSquareX}
              onRevert={() => revertPromotion()}
              ></PawnPromotion>}
        </div>
      </React.Fragment>
       
  );

}
