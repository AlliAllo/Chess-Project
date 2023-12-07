//import { Piece } from '../ChessBoardClass';
import './CSS/ChessPiece.css';
import { Piece } from '../Classes/ChessBoard';
   

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
        {props.piece.imageURL && <img className='chessPieceIMG' draggable={false} src={props.piece.imageURL} alt="chessPiece" ></img>}
    </div>
  );
}

