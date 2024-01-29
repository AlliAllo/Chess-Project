import React, { ReactNode, useRef, useCallback, useState, CSSProperties, useEffect } from 'react';
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

function stockfishMoveToXY(move: string): [number, number] {
  const x: number = move[0].charCodeAt(0) - 97;
  const y = parseInt(move[1], 10) - 1; // Adjust to 0-based index
  return [x, y];
}


export default function ChessBoardComponent(props: Props) {
  const ghostPiece = useRef<HTMLDivElement>(null);

  const [grabbedPiece, setGrabbedPiece] = useState<Piece | null>(null);
  const [chessGame, setChessGame] = useState<ChessGame>(game);
  const [promotion, setPromotion] = useState(chessGame.getPromotion());
  const [check, setCheck] = useState(false);
  const [attacker , setAttacker] = useState<Piece | null>(null);
  const [positionNumber, setPositionNumber] = useState<number>(0);
  const [playerColor, setPlayerColor] = useState<boolean>(true); // true = white, false = black
  const [playerTurn, setPlayerTurn] = useState<boolean>(chessGame.whoseTurn()); // true = white, false = black

  console.log(playerTurn)

  const currentFen = chessGame.getPositionHistory()[chessGame.getPositionHistory().length - 1];
  // const onDrop = useCallback((e: React.KeyboardEvent) => {
  //   loadChessBoard(e);
  // }, []);
  
  useEffect(() => {
    props.getAlgebraicNotation(chessGame.getPGN());
  }, [chessGame, props]);
  
  const fetchMoveFromBackend = async (fen: string, depth: number) => {
    try {
      const response = await fetch('http://localhost:3001/getMove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fen, depth }),
      });
  
      const data = await response.json();
      const move = data.move;
      return await move;
    } catch (error) {
      console.error('Error fetching move from backend:', error);
    }
  };


  const onStartDragging = useCallback((thisPiece: Piece | null, e: React.MouseEvent) => {
    setGrabbedPiece(thisPiece);
    move(e);
      }, [setGrabbedPiece]);

  // This is where we drop the piece. Very important function :)
  const onDrop = useCallback((x: number, y: number) => {
    if (!(grabbedPiece)) return;
    if (positionNumber === chessGame.getPositionHistory().length - 1 && playerColor === game.whoseTurn()  && chessGame.makeMove(grabbedPiece, [x, y])) {
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

  }, [grabbedPiece, positionNumber, chessGame, playerColor, props]);

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
    if (ghostPiece.current){
      ghostPiece.current.style.top = `${e.clientY  - ghostPiece.current.clientHeight / 2}px`; 
      ghostPiece.current.style.left = `${e.clientX - ghostPiece.current.clientWidth / 2}px`;
    }
  };

  // Check the condition after the move is fetched and computerMove is updated
  if (playerColor !== chessGame.whoseTurn()) {
    fetchMoveFromBackend(currentFen, 10).then(
      function(move) {  
        if (playerColor === chessGame.whoseTurn()) return
        if (move === null || move === undefined) {
          alert("error in fetching move");
          return;
        }
        
        const position = stockfishMoveToXY(move[0] + move[1]);
        const destination = stockfishMoveToXY(move[2] + move[3]);
        console.log(position, destination);
        console.log(chessGame.whoseTurn(), playerColor);
        
        const piece = chessGame.getBoard()[position[0]][position[1]] as Piece;
        if (piece === null) return;

        if (piece.symbol === "K" && Math.abs(position[0] - destination[0]) <= 2) {
          console.log("caslting")
          console.log(chessGame.castleKing(piece, destination))
        } else {
          console.log(chessGame.makeMove(piece, destination));
        }
        setPlayerTurn(chessGame.whoseTurn());
        setChessGame(chessGame);
        setAttacker(chessGame.getAttacker());
        setCheck(chessGame.getCheck());
        setPositionNumber(chessGame.getPositionHistory().length - 1);
        setPromotion(chessGame.getPromotion());
        props.getAlgebraicNotation(chessGame.getPGN());

      },
      function(error) { console.log(error); }
    )
  }


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
          key={x + y*8}
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

  const tileElements = document.getElementsByClassName("tile");
  const ghostPieceStyle: CSSProperties = {
    position: "fixed",
    width: `${tileElements ? tileElements[0]?.clientWidth*5 : 0}px`,
    height: `${tileElements ? tileElements[0]?.clientHeight*2 : 0}px`,
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
          <ConfettiExplosion style={confettiStyle} force={1} duration={2200} particleCount={35} width={1000}/>
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
