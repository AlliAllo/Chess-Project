import React, { ReactNode, useRef, useCallback, useState, CSSProperties, useEffect } from 'react';
import Tile from './TileComponent';
import PawnPromotion from './PawnPromotionComponent';

import { Piece } from '../Classes/ChessBoard';
import { Square } from '../Classes/ChessGame';

import './CSS/ChessBoard.css';
import { ChessGame } from '../Classes/ChessGame';

import ConfettiExplosion from 'react-confetti-explosion';

import { useGameContext } from './GameContext';



interface Props {
  children?: ReactNode
  onKeyPressed: (e: React.KeyboardEvent) => void
  getAlgebraicNotation: (PGN: string) => void
  // onKeyPress: (e: React.KeyboardEvent) => void
}

let promotionSquareX = 1000;

function stockfishMoveToXY(move: string): Square {
  const x: number = move[0].charCodeAt(0) - 97;
  const y = parseInt(move[1], 10) - 1; // Adjust to 0-based index
  return [x, y];
}

export enum GameType {
  HumanVsHuman = "Human vs Human",
  HumanVsComputer = "Human vs Computer",
  ComputerVsComputer = "Computer vs Computer",
  SingleHuman = "Single Human",
}

let chessGame = new ChessGame();

export default function ChessBoardComponent(props: Props) {
  const ghostPiece = useRef<HTMLDivElement>(null);

  const [grabbedPiece, setGrabbedPiece] = useState<Piece | null>(null);
  const [promotion, setPromotion] = useState(chessGame.getPromotion());
  const [check, setCheck] = useState(false);
  const [attacker , setAttacker] = useState<Piece | null>(null);
  const [positionNumber, setPositionNumber] = useState<number>(0);
  const [playerColor, setPlayerColor] = useState<boolean>(true); // true = white, false = black
  const [computerHasMadeMove, setComputerHasMadeMove] = useState(false);
  const [unHighlightAll, setUnhighlightAll] = useState(0);
  const [lastMove, setLastMove] = useState<{from: Square, to: Square} | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);

  const { gameType } = useGameContext();

  const token = localStorage.getItem("token");


  // Color constants for move highlighting
  const MOVE_COLORS = {
    LIGHT: '#b9ca43',
    DARK: '#f5f682'
  };


  const resetGame = () => {
    chessGame = new ChessGame();
    setGrabbedPiece(null);
    setPromotion(false);
    setCheck(false);
    setAttacker(null);
    setPositionNumber(0);
    setPlayerColor(true);
    setComputerHasMadeMove(false);
    setLastMove(null);
    setSelectedPiece(null);
  }

  const chessboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set focus on the chessboard element
    if (chessboardRef.current) {
      chessboardRef.current.focus();
    }
  }, [grabbedPiece]);

  useEffect(() => {
    // When the game type changes, reset the game
    resetGame();
  }, [gameType]);

  useEffect(() => {
  }, [props.onKeyPressed]);

  const latestFen = chessGame.getPositionHistory()[chessGame.getPositionHistory().length - 1];
  // const onDrop = useCallback((e: React.KeyboardEvent) => {
  //   loadChessBoard(e);
  // }, []);
  
  useEffect(() => {
    props.getAlgebraicNotation(chessGame.getPGN());
  }, [props, positionNumber]);

  useEffect(() => {
  const logGame = async () => {
    if (!token) return; // not logged in
    

    try {
      const res = await fetch('https://localhost:3001/games/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          PGN: chessGame.getPGN(),
          result: chessGame.getCheckMate()
            ? (playerColor ? '0-1' : '1-0')
            : '1/2-1/2'
        })
      });

      const data = await res.json();
      if (res.ok) console.log('Game logged!', data.game._id);
    } catch (err) {
      console.error('Error logging game:', err);
    }
  }

  if (chessGame.getCheckMate() || chessGame.getDraw()) {
    logGame();
  }
}, [positionNumber]);



  const fetchMoveFromBackend = async (fen: string, elo: number) => {
    try {
      const response = await fetch('https://localhost:3001/getMove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fen, elo }),
      });
      
      const data = await response.json();
      const move = data.move;
      console.log(move);
      return move;
    } catch (error) {
      console.error('Error fetching move from backend:', error);
    }
  };


  const onStartDragging = useCallback((thisPiece: Piece | null, e: React.MouseEvent) => {
    setGrabbedPiece(thisPiece);
    move(e);
      }, [setGrabbedPiece]);

  const onPieceClick = useCallback((thisPiece: Piece | null, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!thisPiece) return;
    
    const isCorrectColor: Boolean = chessGame.whoseTurn() === playerColor;
    const isSingleHuman: Boolean = gameType === GameType.SingleHuman;
    const isInLatestFen: Boolean = chessGame.getPositionHistory().length - 1 === positionNumber;
    
    // Only allow selecting pieces if it's the correct turn
    if (isInLatestFen && (isCorrectColor || isSingleHuman) && !promotion) {
      setSelectedPiece(thisPiece);
    }
  }, [playerColor, gameType, positionNumber, promotion]);


  // This is where we drop the piece. Very important function :)
  const onDrop = useCallback((x: number, y: number) => {
    const isCorrectColor: Boolean = chessGame.whoseTurn() === playerColor;
    const isSingleHuman: Boolean = gameType === GameType.SingleHuman;
    const isInLatestFen: Boolean = chessGame.getPositionHistory().length - 1 === positionNumber;

    // Handle piece selection (click to select, then click destination)
    if (selectedPiece && !grabbedPiece) {
      if (isInLatestFen && (isCorrectColor || isSingleHuman) && !promotion && chessGame.makeMove(selectedPiece, [x, y])) {
        // Track the last move for highlighting
        setLastMove({from: [selectedPiece.x, selectedPiece.y], to: [x, y]});
        // Call the usecallback hook to update the notation of the game.
        props.getAlgebraicNotation(chessGame.getPGN())
        setPositionNumber(chessGame.getPositionHistory().length - 1);
        setSelectedPiece(null); // Clear selection after move
      }
    }
    // Handle drag and drop
    else if (grabbedPiece) {
      if (isInLatestFen && (isCorrectColor || isSingleHuman) && !promotion && chessGame.makeMove(grabbedPiece, [x, y])) {
        // Track the last move for highlighting
        setLastMove({from: [grabbedPiece.x, grabbedPiece.y], to: [x, y]});
        // Call the usecallback hook to update the notation of the game.
        props.getAlgebraicNotation(chessGame.getPGN())
        setPositionNumber(chessGame.getPositionHistory().length - 1);
        setSelectedPiece(null); // Clear selection after move
      }
    }
    
    setAttacker(chessGame.getAttacker());
    setCheck(chessGame.getCheck());
    setGrabbedPiece(null);
    setPromotion(chessGame.getPromotion());
    setComputerHasMadeMove(false);

    if (chessGame.getPromotion()) promotionSquareX = x;

  }, [grabbedPiece, selectedPiece, playerColor, gameType, positionNumber, promotion, props]);

  const onPromotionSelect = useCallback((promotionType: string) => {
    chessGame.makePawnPromotion(promotionType, false);
    setPromotion(chessGame.getPromotion());
    props.getAlgebraicNotation(chessGame.getPGN())
    setPositionNumber(chessGame.getPositionHistory().length - 1);
  } , [props]);

  const revertPromotion = useCallback(() => {
    if (!chessGame.getPromotion()) return;
    chessGame.setPromotionInformationNull();
    chessGame.setPromotion(false);
    setPromotion(chessGame.getPromotion());
  }, [setPromotion]);

  const move = (e: React.MouseEvent) => {
    if (ghostPiece.current){
      ghostPiece.current.style.top = `${e.clientY  - ghostPiece.current.clientHeight / 2}px`; 
      ghostPiece.current.style.left = `${e.clientX - ghostPiece.current.clientWidth / 2}px`;
    }
  }; 

  function handleMouseClicks(e: React.MouseEvent) {
    if (promotion) revertPromotion();
    
    // Unhighlight all tiles on left click
    if (e.button === 0) { // Left mouse button
      setUnhighlightAll(prev => prev + 1);
      // Clear selected piece when clicking on empty area
      setSelectedPiece(null);
    }
  }

  // Check the condition after the move is fetched and computerMove is updated
  if (playerColor !== chessGame.whoseTurn() && gameType === GameType.HumanVsComputer) {
    const elo = 700;

    fetchMoveFromBackend(latestFen, elo).then(
      function(move) {  
        if (playerColor === chessGame.whoseTurn() || chessGame.getCheckMate() || chessGame.getDraw()) return
        if (move === null || move === undefined) {
          alert("error in fetching move");
          return;
        }
        
        move = move.replace(/\s/g, "");
        
        console.log(move);
        const position: Square = stockfishMoveToXY(move[0] + move[1]);
        const destination: Square = stockfishMoveToXY(move[2] + move[3]);
        
        const piece = chessGame.getBoard()[position[0]][position[1]] as Piece;
        if (piece === null) return;

        let successfulMove: boolean = false;
        console.log(Math.abs(position[0] - destination[0]))
        if (piece.symbol === "K" && Math.abs(position[0] - destination[0]) >= 2) { // Castle
          console.log("castle");
          if (chessGame.castleKing(piece, destination)) successfulMove = true;
        } 
        else if (piece.symbol === "P" && Math.abs(position[0] - destination[0]) === 1 && chessGame.getBoard()[destination[0]][destination[1]] === null) { // En passant
          console.log("en passant");

          if (chessGame.enPassant(piece, destination)) successfulMove = true;
        }
        else if (piece.symbol === "P" && move.length === 5) { // Promotion
          console.log("promotion");

          if (chessGame.makePawnPromotion(move[4].toUpperCase(), true, position, destination)) successfulMove = true;

        }
        else { // Regular move
          if (chessGame.makeMove(piece, destination)) successfulMove = true;
        }

        if (successfulMove) {
          setLastMove({from: position, to: destination});
          setPositionNumber(chessGame.getPositionHistory().length - 1);
        }

        setAttacker(chessGame.getAttacker());
        setCheck(chessGame.getCheck());
        setPromotion(chessGame.getPromotion());
        props.getAlgebraicNotation(chessGame.getPGN());
        setComputerHasMadeMove(true);
      },
      function(error) { console.log(error); }
    )
  }


  const loadChessBoard = (e: React.KeyboardEvent) => {
  
    if ((e.key !== "ArrowLeft" && e.key !== "ArrowRight") || (!computerHasMadeMove && gameType !== GameType.SingleHuman)) return;

    e.preventDefault();

    const back = e.key === "ArrowLeft" ? true : false;

    if (back === true && positionNumber > 0) {
      const position = chessGame.getPositionHistory()[positionNumber - 1];
      setPositionNumber(positionNumber - 1);
      chessGame.setChessBoard(position);
      setLastMove(null); // Clear last move when navigating
    }
    if (back === false && positionNumber < chessGame.getPositionHistory().length - 1) {
      const position = chessGame.getPositionHistory()[positionNumber + 1];
      setPositionNumber(positionNumber + 1);
      chessGame.setChessBoard(position);
      setLastMove(null); // Clear last move when navigating
    }
  }
  
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

        const markOpponentSquares = false;

        const op = chessGame.getListOfOpponentMarkedSquares() as Square[];
        
        if (markOpponentSquares) {
          op.forEach(move => {
            if (move[0] === x && move[1] === y) {
              marked = "#5203fc";
            }
          })
        };

        // Check if this tile should be highlighted for last move
        let lastMoveHighlight = undefined;
        if (lastMove) {
          if ((lastMove.from[0] === x && lastMove.from[1] === y) || 
              (lastMove.to[0] === x && lastMove.to[1] === y)) {
            lastMoveHighlight = isWhite ? MOVE_COLORS.LIGHT : MOVE_COLORS.DARK;
          }
        }

        // Check if this tile should be highlighted for selected piece
        let selectedHighlight = undefined;
        if (selectedPiece && selectedPiece.x === x && selectedPiece.y === y) {
          selectedHighlight = isWhite ? MOVE_COLORS.LIGHT : MOVE_COLORS.DARK;
        }

        // Use last move highlight if available, otherwise use selected piece highlight
        const highlightColor = lastMoveHighlight || selectedHighlight || marked;
          
        
        piecesToDisplayJSX.push(
          <Tile
          piece={piece}
          legalTile={grabbedPiece?.legalMoves.some(a => a[0] === x && a[1] === y) || 
                   (selectedPiece ? selectedPiece.legalMoves.some(a => a[0] === x && a[1] === y) : false)}
          grabbedPiece={grabbedPiece}
          onStartDragging={onStartDragging}
          onDrop={onDrop}
          onPieceClick={onPieceClick}
          x={x} y={y} 
          color={highlightColor}
          key={x + y*8}
          tileIsWhite={isWhite}
          unhighlightTrigger={unHighlightAll} ></Tile>
        )
      
      }
  }

  const tileSize = document.getElementsByClassName("tile")[0]?.clientWidth;
  
  const topLeftTilePostion = document.getElementsByClassName("tile")[0]?.getBoundingClientRect();

  const confettiStyle: CSSProperties = {
    position: "absolute",
    top: attacker ? 100*attacker?.y + + 200 : "0px",
    left: attacker ? 100*attacker?.x + 830 : "0px",
    zIndex: 2,
  } 

  const tileElements = document.getElementsByClassName("tile");
  const ghostPieceStyle: CSSProperties = {
    position: "fixed",
    width: `${tileElements ? tileElements[0]?.clientWidth : 0}px`,
    height: `${tileElements ? tileElements[0]?.clientHeight : 0}px`,
  } 

  
  return (
      <React.Fragment>
        <div  
          ref={chessboardRef}
          draggable={false} 
          className="chessboard" 
          tabIndex={0} 
          onMouseMove={e => move(e)} 
          onKeyDown={e => loadChessBoard(e)}
          onMouseDown={e => handleMouseClicks(e)}> 
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
            <PawnPromotion 
                key={1} 
                tileSize={tileSize}
                topLeftTilePostion={topLeftTilePostion}
                whoIsPromoting={chessGame.getPromotionInformation()?.piece.white as boolean}
                onPromotionSelect={(promotion: string) => {onPromotionSelect(promotion)}}
                promotionSquareX={promotionSquareX}
                onRevert={() => revertPromotion()}
                >
            </PawnPromotion>}
        </div>
      </React.Fragment>
       
  );

}
