// Guide to chess notation: https://www.chess.com/terms/chess-notation
import { Move } from './Move';
 

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
    white: boolean | undefined
    hasMoved?: boolean
    symbol: string | undefined // K, P, Kn  # = check, x = capture , White win = 1-0, Black win = 0-1, Draw = 1/2-1/2
    legalMoves: Move[]


  }
  



export class ChessBoard {
  
    private vSize = 8
    private hSize = 8
    private pieces: Piece[] = [];

  
    // [y][x] - [0][0] = top left
    
    private board: (Piece | null)[][] = []

  
    constructor(fen: string){

        //initialize the board with null values
        this.createBoard(fen) 
        
    }
    


    getBoard(): (Piece | null)[][] {
      return this.board;
    }

    getPieces(): Piece[] {
      return this.pieces;
    }
    /*
    Make chessboard by using FEN notation. Might include PGN later on.
    */
    createBoard(fen: string): void {
      this.board = Array(8).fill(null).map(() => Array(8).fill(null));

      // "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
      // Include some sort of test that FEN/PGN is valid
      // We start with only FEN notation for creating board.
      let x: number = 0
      let y: number = 7
      let imageURL: string = "Fail"
      let value: number = 0
      let white: boolean 
      let hasMoved: boolean
      let symbol: string = "symbol"

      /*
      const pieceFromSymbom = new Map<string, string>([
        ['K', `./Pieces/${white ? "white" : "black"}King.png`]
      ]);
      */


      for (var i = 0; i < fen.length; i++) {
        let char = fen.charAt(i)
        if (char === "/" ){
          x = 0
          y--;
        }
        
        else if (parseInt(char) >= 1 && parseInt(char) <= 8) {
          x += (parseInt(char)) 
        }

        else {
          if (char === char.toLowerCase()){
            white = false
            char = char.toUpperCase()

          }
          else{
            white = true
          }

          if (char === "R" ){
            symbol = char 
            value = 5
            imageURL = white ? WhiteRook : BlackRook
          }

          if (char === "N" ){
            symbol = char
            value = 3
            imageURL = white ? WhiteKnight : BlackKnight

  
          }
          if (char === "B" ){
            symbol = char
            value = 3
            imageURL = white ? WhiteBishop : BlackBishop

  
          }
          if (char === "Q"){
            symbol = char
            value = 9
            imageURL = white ? WhiteQueen : BlackQueen

  
          }
          if (char === "K"){
            symbol = char
            value = Number.MAX_SAFE_INTEGER
            imageURL = white ? WhiteKing : BlackKing

  
          }
          if (char === "P"){
            symbol = char 
            value = 1
            imageURL = white ? WhitePawn : BlackPawn
          }

          if (x === 8){
            x = 7
          }

          hasMoved = false
          const piece: Piece = {imageURL: imageURL, x: x, y: y, value: value, white: white, hasMoved: hasMoved, symbol: symbol, legalMoves: []}

          this.board[x][y] = piece 
          // remember how board looks. We start top left and loop right. Then down and repeat. Piece, Piece... 6 times, Piece, 7 times, Null.. 7 times.
          this.pieces.push(piece)
          x++;
          
        }
      }
    }

    
  }