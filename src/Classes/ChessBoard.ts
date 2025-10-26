// Guide to chess notation: https://www.chess.com/terms/chess-notation
import { Square } from './ChessGame';
import { Chessboard } from './ChessGame';

const isNode = typeof window === 'undefined';

const WhiteKing = isNode ? '' : require('../Assets/wk.png');
const WhitePawn = isNode ? '' : require('../Assets/wp.png');
const WhiteRook = isNode ? '' : require('../Assets/wr.png');
const WhiteBishop = isNode ? '' : require('../Assets/wb.png');
const WhiteQueen = isNode ? '' : require('../Assets/wq.png');
const WhiteKnight = isNode ? '' : require('../Assets/wn.png');

const BlackKing = isNode ? '' : require('../Assets/bk.png');
const BlackPawn = isNode ? '' : require('../Assets/bp.png');
const BlackRook = isNode ? '' : require('../Assets/br.png');
const BlackBishop = isNode ? '' : require('../Assets/bb.png');
const BlackQueen = isNode ? '' : require('../Assets/bq.png');
const BlackKnight = isNode ? '' : require('../Assets/bn.png');

/* import WhiteKing from '../Assets/wk.png';
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
import BlackKnight from '../Assets/bn.png';   */



export interface Piece{
    x: number // position
    y: number // position
    imageURL: string | null
    value?: number
    white: boolean
    symbol: string // K, P, N  etc.
    legalMoves: Square[]
    pinAngle?: [number, number]

  }
  


export class ChessBoard {
    private pieces: Piece[] = [];
    private pieceSymbolToValue: Map<string, number>;
    private pieceSymbolToImageURL: Map<string, Map<boolean, string | null>>;
    // [y][x] - [0][0] = top left
    private board: (Piece | null)[][] = []
    private kingPositions: {whiteKingPosition: Square, blackKingPosition: Square} = {whiteKingPosition: [4,0], blackKingPosition: [4,7]}

    
    constructor(fen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
      this.pieceSymbolToValue = new Map<string, number>([
        ['K', 10000],
        ['Q', 9],
        ['R', 5],
        ['B', 3],
        ['N', 3],
        ['P', 1]]);
      

      this.pieceSymbolToImageURL = new  Map<string, Map<boolean, string | null>>([
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

    getPieceSymbolToImageURL(): Map<string, Map<boolean, string | null>> {
      return this.pieceSymbolToImageURL;
    }

    getKingPositions(): {whiteKingPosition: Square, blackKingPosition: Square} {
      return this.kingPositions;
    }

    /**
     * Create board based on a FEN string. Only takes into account the pieces, not the turn, castling rights, etc. 
     * @param fen 
     */
    createBoard(fullFen: string): void {
      this.board = Array(8).fill(null).map(() => Array(8).fill(null));

      // Include some sort of test that FEN/PGN is valid
      // We start with only FEN notation for creating board.
      let x: number = 0
      let y: number = 7
      let white: boolean 

      const fen = fullFen.split(" ")[0];

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

          if (char === "K") {
            // Store king position for quick access later.
            if (white) this.kingPositions.whiteKingPosition = [x, y]
            else this.kingPositions.blackKingPosition = [x, y]
          }

          const value = this.pieceSymbolToValue.get(char) as number
          const imageURL = this.pieceSymbolToImageURL.get(char)?.get(white) as string
          const piece: Piece = {imageURL: imageURL, x: x, y: y, value: value, white: white, symbol: char, legalMoves: []}

          this.board[x][y] = piece 
          // remember how board looks. We start top left and loop right. Then down and repeat. Piece, Piece... 6 times, Piece, 7 times, Null.. 7 times.
          this.pieces.push(piece)
          x++;
          
        }
      }
    }

    
  }