import React, { CSSProperties } from 'react';
//import { Piece } from '../ChessBoardClass';
import './CSS/ChessPiece.css';
import { Piece } from '../Classes/ChessBoard';
import { forEachChild } from 'typescript';
import { on } from 'events';


export const pieceStyle: CSSProperties= {
  width: "88px",
  height: "88px",
};
//   

interface pieceProps {
  piece: Piece
  onStartDragging : ((thisPiece: Piece | null, e: React.MouseEvent) => void) | undefined
  onPromotionClick?: (promotion: string) => void

}

export default function ChessPiece(props: pieceProps) {
  const grab = (chessPiece: Piece | null, e: React.MouseEvent) => {
      if (e.button === 0 && props.onStartDragging) props.onStartDragging(chessPiece, e);
    }

  return (
    <div className="chessPiece centered" onMouseDown={e => grab(props.piece, e)} onClick={() => (props.onPromotionClick) ? props.onPromotionClick(props.piece.symbol) : undefined}>
        {props.piece.imageURL && <img draggable={false} src={props.piece.imageURL} alt="chessPiece" style={pieceStyle} ></img>}
    </div>
  );
}

