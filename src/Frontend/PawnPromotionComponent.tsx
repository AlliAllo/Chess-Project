import Tile from './TileComponent';
import { Piece} from '../Classes/ChessBoard';
import React, { CSSProperties } from 'react';
import './CSS/ChessBoard.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

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



interface PromotionOptionsProps {
  whoIsPromoting: boolean; // true = white, false = black
  promotionSquareX: number;
  children?: React.ReactNode;
  onPromotionSelect: (promotion: string) => void;
  onRevert: () => void;
}



export default function PawnPromotion(props: PromotionOptionsProps) {

 

  // Here we make some artifical pieces to show the user what they can promote to.
  const row = props.whoIsPromoting ? 0 : 7;
  const symbolToImageURL = new  Map<string, Map<boolean, string>>([
    ['K', new Map([[true, WhiteKing], [false, BlackKing]])],
    ['Q', new Map([[true, WhiteQueen], [false, BlackQueen]])],
    ['R', new Map([[true, WhiteRook], [false, BlackRook]])],
    ['B', new Map([[true, WhiteBishop], [false, BlackBishop]])],
    ['N', new Map([[true, WhiteKnight], [false, BlackKnight]])],
    ['P', new Map([[true, WhitePawn], [false, BlackPawn]])]]);

  
  const piecesToDisplayJSX: JSX.Element[] = [];

  for (let i = 0; i < 4; i++) {
    const inverted = props.whoIsPromoting ? 0 : -1;
    const symbolList = ["Q", "R", "B", "N"];
    if (!props.whoIsPromoting) symbolList.reverse(); // If black is promoting we are reversing the order of the pieces.
    const symbol = symbolList[i];

    const imageURL = symbolToImageURL.get(symbol)?.get(props.whoIsPromoting) as string;
    const upOrDown = props.whoIsPromoting ? -1 : 1;

    const piece: Piece = {imageURL: imageURL, x: props.promotionSquareX, y: row+i*upOrDown, value: undefined, white: props.whoIsPromoting, hasMoved: undefined, symbol: symbol, legalMoves: []}

    piecesToDisplayJSX.push(
      <Tile
      piece={piece}
      legalTile={undefined}
      grabbedPiece={undefined}
      onStartDragging={undefined}
      onDrop={undefined}
      x={1000} y={row+i*upOrDown}
      tileIsWhite={undefined}
      color={'(255, 255, 255)'}
      onPromotionClick={props.onPromotionSelect}
        ></Tile>
    )

  }

  const whitePawnPromotionStyle: CSSProperties = {
    top: row*100 + 240,
    left: 785 + props.promotionSquareX*100,
  };

  const blackPawnPromotionStyle: CSSProperties = {
    top: row*100 - 110,
    left: 785 + props.promotionSquareX*100,
  };

  return (
    <React.Fragment>

    <div className='pawnPromotion' style={props.whoIsPromoting ? whitePawnPromotionStyle : blackPawnPromotionStyle} >
        {!props.whoIsPromoting ? <div className="pawnPromotionHalfSquare">
          <FontAwesomeIcon icon={faXmark} style={{color: "#8894aa",}} onClick={() => props.onRevert()}/>
        </div> : null}

        <div draggable={false}>
        {piecesToDisplayJSX}
        </div> 

        {props.whoIsPromoting ? <div className="pawnPromotionHalfSquare">
            <FontAwesomeIcon icon={faXmark} style={{color: "#8894aa",}} onClick={() => props.onRevert()}/>
        </div>
        : null}
    </div>
   

    </React.Fragment> 
  );
};