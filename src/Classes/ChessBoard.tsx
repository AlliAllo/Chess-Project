// Guide to chess notation: https://www.chess.com/terms/chess-notation
import { Square } from './ChessGame';
import { Chessboard } from './ChessGame';

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
       


export interface Piece{
    x: number // position
    y: number // position
    imageURL: string | null
    value?: number
    white: boolean
    hasMoved?: boolean
    symbol: string // K, P, N  etc.
    legalMoves: Square[]

    pinAngle?: [number, number]


  }
  



export class ChessBoard {
    private pieces: Piece[] = [];
    private pieceSymbolToValue: Map<string, number>;
    private pieceSymbolToImageURL: Map<string, Map<boolean, string>>;
    // [y][x] - [0][0] = top left
    private board: (Piece | null)[][] = []

  
    constructor(fen: string){
      this.pieceSymbolToValue = new Map<string, number>([
        ['K', Number.MAX_SAFE_INTEGER],
        ['Q', 9],
        ['R', 5],
        ['B', 3],
        ['N', 3],
        ['P', 1]]);

      this.pieceSymbolToImageURL = new  Map<string, Map<boolean, string>>([
        ['K', new Map([[true, WhiteKing], [false, BlackKing]])],
        ['Q', new Map([[true, WhiteQueen], [false, BlackQueen]])],
        ['R', new Map([[true, WhiteRook], [false, BlackRook]])],
        ['B', new Map([[true, WhiteBishop], [false, BlackBishop]])],
        ['N', new Map([[true, WhiteKnight], [false, BlackKnight]])],
        ['P', new Map([[true, WhitePawn], [false, BlackPawn]])]]);


      //initialize the board
      this.createBoard(fen);


    }
    

    getBoard(): Chessboard {
      return this.board;
    }

    getPieces(): Piece[] {
      return this.pieces;
    }

    getPieceSymbolToValue(): Map<string, number> {
      return this.pieceSymbolToValue;
    }

    getPieceSymbolToImageURL(): Map<string, Map<boolean, string>> {
      return this.pieceSymbolToImageURL;
    }

    /**
     * Create board based on a FEN string.
     * @param fen 
     */
    createBoard(fen: string): void {
      this.board = Array(8).fill(null).map(() => Array(8).fill(null));

      // "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
      // Include some sort of test that FEN/PGN is valid
      // We start with only FEN notation for creating board.
      let x: number = 0
      let y: number = 7
      let white: boolean 

      for (let i = 0; i < fen.length; i++) {
        let char = fen.charAt(i)
        if (char === "/" ){
          x = 0
          y--;
        }
        
        else if (parseInt(char) >= 1 && parseInt(char) <= 8) {
          x += (parseInt(char)) 
        }

        else {
          if (char === char.toLowerCase()) white = false
          else white = true

          char = char.toUpperCase()

          if (x === 8){
            x = 7
          }

          const value = this.pieceSymbolToValue.get(char) as number
          const imageURL = this.pieceSymbolToImageURL.get(char)?.get(white) as string
          const hasMoved = false
          const piece: Piece = {imageURL: imageURL, x: x, y: y, value: value, white: white, hasMoved: hasMoved, symbol: char, legalMoves: []}

          this.board[x][y] = piece 
          // remember how board looks. We start top left and loop right. Then down and repeat. Piece, Piece... 6 times, Piece, 7 times, Null.. 7 times.
          this.pieces.push(piece)
          x++;
          
        }
      }
    }

    
  }