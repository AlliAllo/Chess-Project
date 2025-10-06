import React, { ReactNode, CSSProperties, useState, useEffect } from 'react';
import { Piece } from '../Classes/ChessBoard';
import './CSS/Tile.css';
import ChessPiece from "./ChessPieceComponent"

interface TileProps {
  piece: Piece | null
  tileIsWhite: boolean | undefined
  legalTile: boolean | undefined
  grabbedPiece?: Piece | null
  children?: ReactNode
  x: number
  y: number
  color?: string
  sizeOverride?: number
  unhighlightTrigger?: number

  onStartDragging: ((thisPiece: Piece | null, e: React.MouseEvent) => void) | undefined
  onDrop: ((x: number, y: number) => void) | undefined
  onPieceClick?: ((thisPiece: Piece | null, e: React.MouseEvent) => void) | undefined
  onPromotionClick?: (promotion: string) => void
}
  
  
export default function Tile(props: TileProps) {

  const [highlightColor, setColor] = useState<string | undefined>();

  // Effect to unhighlight tile when unhighlightTrigger changes
  useEffect(() => {
    if (props.unhighlightTrigger !== undefined && props.unhighlightTrigger > 0) {
      setColor(undefined);
    }
  }, [props.unhighlightTrigger]);


  const drop = (grabbedPiece: Piece | null | undefined, e: React.MouseEvent) => {

    if (grabbedPiece && props.onDrop){
      props.onDrop(props.x, props.y) 
    }
  };
  
  const tileColor = props.color ? props.color : props.tileIsWhite ? 'hsl(90deg 27.12% 46.27%)' : 'hsl(60deg 45.16% 87.84%)'
  
  

  const tileStyle: CSSProperties = {
    backgroundColor: highlightColor ? highlightColor : tileColor,
    width: props.sizeOverride ? `${props.sizeOverride}px` : undefined,
    height: props.sizeOverride ? `${props.sizeOverride}px` : undefined,
  };

  function highlightTile(e: React.MouseEvent) {
    // Prevent the default right-click menu from showing up
    e.preventDefault();

    if (highlightColor === "#eb7c6a" || highlightColor === "#d46b51") {
      setColor(tileColor)
      return;
    }
    tileColor === 'hsl(90deg 27.12% 46.27%)' ? setColor("#d46b51") : setColor("#eb7c6a") 
  }

  /**
   * Function for highlighting squares. It is incomplete.
   * @returns 
   */
  /*
  function selectedTile() {
    if (highlightColor === "#bbca2b" || highlightColor === "rgb(246 246 104") {
      setColor(tileColor)
      return;
    }

    tileColor === 'hsl(90deg 27.12% 46.27%)' ? setColor("#bbca2b") : setColor("rgb(246 246 104") 

  }
  */

  
  const xNotation = ["a", "b", "c", "d", "e", "f", "g", "h"]
  
  const NotationStyle: CSSProperties = {
    color: props.tileIsWhite ? 'hsl(60deg 45.16% 87.84%)' : 'hsl(90deg 27.12% 46.27%)',
    
  }

  
  return (
    <div draggable={false} className="tile" style={tileStyle} tabIndex={2}
    onMouseUp={e => drop(props.grabbedPiece, e)} 
    //onMouseDown={selectedTile}
    onContextMenu={e => highlightTile(e)}>
        {props.piece  && <ChessPiece piece={props.piece}  onStartDragging={props.onStartDragging} onPieceClick={props.onPieceClick} onPromotionClick={props.onPromotionClick}/>}
        {props.legalTile && <div className="legalTile"></div>}
        {props.y === 0 && <div style={NotationStyle} className="xNotation">{xNotation[props.x]}</div>}
        {props.x === 0 && <div style={NotationStyle} className="yNotation">{props.y+1}</div>}

    </div>
);
}

