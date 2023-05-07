import React, { CSSProperties } from 'react';
//import { Piece } from '../ChessBoardClass';
import './CSS/ChessPiece.css';
import { Piece } from '../Classes/ChessBoard';
import { forEachChild } from 'typescript';


export const pieceStyle: CSSProperties= {
  width: "96px",
  height: "96px",
};
//   

interface pieceProps {
  piece: Piece
  onStartDragging : (thisPiece: Piece | null, e: React.MouseEvent) => void
}

export default function ChessPiece(props: pieceProps) {
  const grab = (chessPiece: Piece | null, e: React.MouseEvent) => {
    console.log("grabbing " )
    
    props.onStartDragging(chessPiece, e);
    }

  

  return (
    <div className="chessPiece centered" onMouseDown={e => grab(props.piece, e)}>
        {props.piece.imageURL && <img draggable={false} src={props.piece.imageURL} alt="chessPiece" style={pieceStyle} ></img>}
    </div>
  );
}

