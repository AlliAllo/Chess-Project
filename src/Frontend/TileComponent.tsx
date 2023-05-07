import React, { ReactNode, CSSProperties } from 'react';
import { Piece } from '../Classes/ChessBoard';
import './CSS/Tile.css';
import ChessPiece from "./ChessPieceComponent"
import { Move } from '../Classes/Move';

interface TileProps {
  piece: Piece | null
  tileIsWhite: boolean
  legalTile: boolean | undefined
  grabbedPiece?: Piece | null
  children?: ReactNode
  x: number
  y: number

  onStartDragging: (thisPiece: Piece | null, e: React.MouseEvent) => void
  onDrop: (x: number, y: number) => void
}
  
  
export default function Tile(props: TileProps) {

  const drop = (grabbedPiece: Piece | null | undefined, e: React.MouseEvent) => {

    if (grabbedPiece ){
      props.onDrop(props.x, props.y) 
    }
  };

  const legalTileStyle: CSSProperties = props.legalTile ? { position: "relative",
  width: "40px",
  height: "40px",
  objectFit: "contain",
  backgroundColor: 'gray' 
  } : {};
  


  const tileStyle: CSSProperties = {
    width: '100px',
    height: '100px',
    backgroundColor: props.tileIsWhite ? 'hsl(90deg 27.12% 46.27%)' : 'hsl(60deg 45.16% 87.84%)',
    display: "grid",
    position: "relative",
  };



  return (
    <div draggable={false} className="tile" style={tileStyle} onMouseUp={e => drop(props.grabbedPiece, e)}>
        {props.piece  && <ChessPiece piece={props.piece}  onStartDragging={props.onStartDragging} />}
        {props.legalTile && <div className="legalTile centered" style={legalTileStyle}></div>}

    </div>
);
}

