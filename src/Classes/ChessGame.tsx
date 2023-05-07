import { ChessBoard } from "./ChessBoard"
import { Piece } from "./ChessBoard";
import { Move } from "./Move";

/*
Here we create the ChessGame. 
*/
export class ChessGame{
    private chessWidth: number
    private chessHeight: number
    private chessBoardClass: ChessBoard
    private chessBoard: (Piece | null)[][];
    private moves: Move | null
    private pieces: Piece[]
    private turn: number
    private check: boolean
    private checkMate: boolean
    private staleMate: boolean
    private fiftyMoveRule: boolean
    private threeFoldRepetition: boolean
    private castling: boolean
    private promotion: boolean
    private fen: string 
    private PGN: string

    private depth: number
   


    constructor(){
        this.chessWidth = 8
        this.chessHeight = 8
        this.moves = null
        this.turn = 1
        this.check = false
        this.checkMate = false
        this.staleMate = false
        this.fiftyMoveRule = false
        this.threeFoldRepetition = false
        this.castling = false
        this.promotion = false
        this.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
        this.depth = 3 // Look 3 moves ahead and evaluate the board.
        this.PGN = ""

        // Starting position
        this.chessBoardClass = new ChessBoard(this.fen)
        this.chessBoard = this.chessBoardClass.getBoard();
        this.pieces = this.chessBoardClass.getPieces();
        
    }

    getBoard(): (Piece | null)[][] {
        return this.chessBoard;
    }

    // Changes the board in the position given in the parameter.
    setBoard(piece: (Piece | null), x: number, y: number): void {
      if (piece) this.chessBoard[x][y] = piece
      else this.chessBoard[x][y] = null

    }

    getPieces(): Piece[] {
        return this.pieces;
    }


    getFen() {
        return this.fen;
    }

    

    filterLegalMoves(piece: Piece): Move[]{
      // Here we filter out all the moves where you capture your own piece.
      

      return piece.legalMoves
    }
  
    calcLegalMoves(){
      

      // Here we calculate all the legal moves for each piece in the chessboard.
      console.log("calcLegalMoves")
      for (let y = 7; y >= 0; y--) {
        for (let x = 0; x < this.chessWidth; x++) {
          if (this.chessBoard[x][y] && this.chessBoard[x][y]?.symbol){
            console.log(this.chessBoard[x][y]?.symbol)
            // Here we use casting to make sure that the piece is a Piece and not null.
            const piece: Piece = this.chessBoard[x][y] as Piece;
            // We need to empty the legalMoves array before we calculate the legal moves for the piece.
            piece.legalMoves = [];
            
            const symbol = piece.symbol;
            
            if (symbol === "R"){ // Rook
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y])
                if (this.chessBoard[x+j][y] !== null){
                  break;
                }  
              }
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y])
                if (this.chessBoard[x-j][y] !== null){
                  break;
                }
              }
              for (let j = 1; j <= 7-y; j++) {
                piece.legalMoves.push([x, y+j])
                if (this.chessBoard[x][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= y; j++) {
                piece.legalMoves.push([x, y-j])
                if (this.chessBoard[x][y-j] !== null){
                  break;
                }
              }

            } // End of Rook          
            if (piece.symbol === "B"){ // Bishop
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y+j])
                if (this.chessBoard[x+j][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y+j])
                if (this.chessBoard[x-j][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y-j])
                if (this.chessBoard[x+j][y-j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y-j])
                if (this.chessBoard[x-j][y-j] !== null){
                  break;
                }
              } 
            } // End of Bishop
            if (piece.symbol === "Q") { // Queen
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y])
                if (this.chessBoard[x+j][y] !== null){
                  break;
                }
              }
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y])
                if (this.chessBoard[x-j][y] !== null){
                  break;
                }
              }
              for (let j = 1; j <= 7-y; j++) {
                piece.legalMoves.push([x, y+j])
                if (this.chessBoard[x][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= y; j++) {
                piece.legalMoves.push([x, y-j])
                if (this.chessBoard[x][y-j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y+j])
                if (this.chessBoard[x+j][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y+j])
                if (this.chessBoard[x-j][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y-j])
                if (this.chessBoard[x+j][y-j] !== null){
                  break;
                }
              }  
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y-j])
                if (this.chessBoard[x-j][y-j] !== null){
                  break;
                }
              }

            } // End of Queen  
            if (piece.symbol === "K") { // King
                piece.legalMoves.push([x+1, y])
                piece.legalMoves.push([x-1, y])
                piece.legalMoves.push([x, y+1])
                piece.legalMoves.push([x, y-1])
                piece.legalMoves.push([x+1, y+1])
                piece.legalMoves.push([x-1, y+1])
                piece.legalMoves.push([x+1, y-1])
                piece.legalMoves.push([x-1, y-1])
            } // End of King
            if (piece.symbol === "N") { // Knight
              for (let i = -2; i <= 3; i++){
                for (let j = -2; j <= 3; j++){
                  if (i ** 2 + j ** 2 === 5){
                    piece.legalMoves.push([x+i, y+j])
                  }
                }
              }
            } // End of Knight
            if (piece.symbol === "P"){ // Pawn
              const direction = piece.white ? 1 : -1;
              const row = piece.white ? 1 : 6;
              if (this.chessBoard[x][y+direction] === null){
                piece.legalMoves.push([x, y+direction])
                if (y === row && this.chessBoard[x][y+direction*2] === null){
                  piece.legalMoves.push([x, y+direction*2])
                }
              }
              if (x < 7 && this.chessBoard[x+1][y+direction] !== null){
                piece.legalMoves.push([x+1, y+direction])
              }
              if (x > 0 && this.chessBoard[x-1][y+direction] !== null){
                piece.legalMoves.push([x-1, y+direction])
              }


        
            } // End of Pawn

            // Filter out move that are out of bounds. 
            piece.legalMoves = piece.legalMoves.filter(move => {
              if (move[0] >= 0 && move[0] <= 7 && move[1] >= 0 && move[1] <= 7){
                return true
              }
              else{
                return false
              }
            })

            // Filter out moves where you capture your own piece.
            piece.legalMoves = piece.legalMoves.filter(move => {
              if (this.chessBoard[move[0]][move[1]] === null){
                return true
              }
              else{
                console.log(this.chessBoard[move[0]][move[1]]?.white)
                if (this.chessBoard[move[0]][move[1]]?.white !== piece.white){
                  return true
                }
                else{
                  console.log("sheepap")
                  return false
                }
              }
            })


          }
        
        // After calculating all the legal moves for each piece, we need to update the board from the pieces.
    }
  }

  }
  
    
    moveMade(move: Move, capture: boolean){
      this.calcLegalMoves()
      this.turn = this.turn++ 
      this.addNotation(move, capture)
    }
    getNotationFromMove(move: Move): string{
      let notation: string
      notation = String.fromCharCode(97 + (move[0]))+(8-move[1])
      return notation
    }
    addNotation(move: Move, capture: boolean){
      // Move needs more information. We need to know exatcly which piece is moving. Not just the type of piece.
      this.PGN += this.turn + ". "
      this.PGN += this.getNotationFromMove(move)

      
    }
    
    /*
    getPGN(): string {
      let PGN: string[] = []
      
      for (let i = 1; i < this.moves.length+1; i++) {
        PGN.push(`${i}. `)
        let move = this.moves[i-1]
        let move2 = this.moves[i]
        
        PGN.push(move.getNotation() + " ")

        if (move.getNotation().includes("#")){
          PGN.push("1-0")
          break
        }
        PGN.push(move2.getNotation() + " ")
        if (move2.getNotation().includes("#")){
          PGN.push("0-1")
          break
        }
      }

      /*
      if (this.draw){
        PGN.push("1/2-1/2")
      }
      */
      
      //return PGN.join()
    //}
    //*/
    
}