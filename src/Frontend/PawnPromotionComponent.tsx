import Tile from './TileComponent';
import { Piece} from '../Classes/ChessBoard';
import React, { CSSProperties } from 'react';
import './CSS/ChessBoard.css';
import './CSS/PawnPromotion.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

import WhiteKing from '../Assets/wk.png';
import WhitePawn from '../Assets/wp.png';
import WhiteRook from '../Assets/wr.png';
import WhiteBishop from '../Assets/wb.png';
import WhiteQueen from '../Assets/wq.png';
import WhiteKnight from '../Assets/wn.png';

import BlackKing from '../Assets/bk.png';
import BlackPawn from '../Assets/bp.png';
import BlackRook from '../Assets/br.png';
import BlackBishop from '../Assets/bb.png';
import BlackQueen from '../Assets/bq.png';
import BlackKnight from '../Assets/bn.png';



interface PromotionOptionsProps {
  whoIsPromoting: boolean; // true = white, false = black
  promotionSquareX: number;
  topLeftTilePostion: DOMRect;
  tileSize: number;
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
    //const inverted = props.whoIsPromoting ? 0 : -1;
    const symbolList = ["Q", "R", "B", "N"];
    if (!props.whoIsPromoting) symbolList.reverse(); // If black is promoting we are reversing the order of the pieces.
    const symbol = symbolList[i];

    const imageURL = symbolToImageURL.get(symbol)?.get(props.whoIsPromoting) as string;
    const upOrDown = props.whoIsPromoting ? -1 : 1;
    const piece: Piece = {imageURL: imageURL, x: props.promotionSquareX, y: row+i*upOrDown, value: undefined, white: props.whoIsPromoting, symbol: symbol, legalMoves: []}
    piecesToDisplayJSX.push(
      <Tile
      piece={piece}
      legalTile={undefined}
      grabbedPiece={undefined}
      onStartDragging={undefined}
      onDrop={undefined}
      sizeOverride={props.tileSize}
      x={500} y={500}
      tileIsWhite={undefined}
      color='#FFFFFF'
      onPromotionClick={props.onPromotionSelect}
      key={i*55}>
      </Tile>
    )
  }
  

  const topLeftX = props.topLeftTilePostion.left;
  const topLeftY = props.topLeftTilePostion.top;
  
  console.log(props.tileSize)

  const whitePawnPromotionStyle: CSSProperties = {
    top: topLeftY + row*props.tileSize,
    left: topLeftX + Math.floor(props.promotionSquareX*props.tileSize),
  };

  const blackPawnPromotionStyle: CSSProperties = {
    top:  4.5*topLeftY + 7,
    left: topLeftX + props.promotionSquareX*props.tileSize,
  };

  const pawnPromotionHalfSquareStyle: CSSProperties = {
    width: props.tileSize,
    height: props.tileSize*0.5,
  };

  return (
    <React.Fragment>

    <div className='pawnPromotion' style={props.whoIsPromoting ? whitePawnPromotionStyle : blackPawnPromotionStyle} >
        {!props.whoIsPromoting ? <div className="pawnPromotionHalfSquare" style={pawnPromotionHalfSquareStyle} onClick={() => props.onRevert()}>
          <FontAwesomeIcon icon={faXmark} style={{color: "#8894aa",}} onClick={() => props.onRevert()}/>
        </div> : null}

        <div className='promotionOptions' draggable={false}>
          {piecesToDisplayJSX}
        </div> 

        {props.whoIsPromoting ? <div className="pawnPromotionHalfSquare" style={pawnPromotionHalfSquareStyle} onClick={() => props.onRevert()}>
            <FontAwesomeIcon icon={faXmark} style={{color: "#8894aa",}} />
        </div>
        : null}
    </div>
   

    </React.Fragment> 
  );
};