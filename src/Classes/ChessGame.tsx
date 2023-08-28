import { abort } from "process";
import { ChessBoard } from "./ChessBoard"
import { Piece } from "./ChessBoard";
import { Move } from "./Move";

/*
Here we create the ChessGame. 
*/

type Board = (Piece | null)[][];

export class ChessGame{
    private chessWidth: number
    private chessHeight: number
    private chessBoardClass: ChessBoard
    private chessBoard: (Piece | null)[][];
    private moves: Move | null
    private pieces: Piece[]
    private turn: number = 0
    private check: boolean = false
    private checkMate: boolean = false
    private staleMate: boolean = false
    private moveCount: number = 0 // This is used for the 50 move rule. - When piece is captured counter is reset.
    private threeFoldRepetition: boolean = false
    private castling: boolean = false
    private queencastling: boolean = false
    private kingcastling: boolean = false
    private promotion: boolean = false
    private winner: boolean | null = null // True means white, false means black.
    private draw: boolean = false
    private fen: string 
    private PGN: string
    private opponentMarkedSquares: Set<Move>  // This will represent the squares that are marked by the opponent player.
    private whiteKingPosition: Move // Position of the white king.
    private blackKingPosition: Move 
    private absolutePinnedPieces: Piece[] = [] // This will be a list of pieces that are pinned.
    private depth: number
    private doubleCheck: boolean = false
   


    constructor(){
        this.chessWidth = 8
        this.chessHeight = 8
        this.moves = null
        
        this.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
        this.depth = 3 // Look 3 moves ahead and evaluate the board.
        this.PGN = ""

        // Starting position
        this.chessBoardClass = new ChessBoard(this.fen)
        this.chessBoard = this.chessBoardClass.getBoard();
        this.pieces = this.chessBoardClass.getPieces();
        this.opponentMarkedSquares = new Set<Move>()
        this.whiteKingPosition = [4, 0] // Starting position for the white king. This will be updated if the king makes a move.
        this.blackKingPosition = [4, 7]
    }

    getBoard(): (Piece | null)[][] {
        return this.chessBoard;
    }

    // Changes the board in the position given in the parameter.
    makeMove(board: Board, piece: Piece | null, move: Move): Board {
      if (piece) board[move[0]][move[1]] = piece
      else board[move[0]][move[1]] = null

      if (piece?.symbol === "K"){
        if (piece.white) this.whiteKingPosition = move
        else this.blackKingPosition = move
      }

      return board

    }

    getPieces(): Piece[] {
        return this.pieces;
    }

    getPGN(): string {
      return this.PGN;
    }

    getFen() {
        return this.fen;
    }

    getopponentMarkedSquares(){
      return this.opponentMarkedSquares
    }

    getTurn() {
      return this.turn;
    }

    /**
     * @returns True if it is black's turn, false if it is white's turn.
     */
    whoseTurn(): boolean {
      return this.turn % 2 === 0;
    }

    /**
     * Gets the pinned pieces from a board.
     * @param board 
     * @param kingPosition 
     */
    calcAbsolutePinnedPieces(board: Board, kingPosition: Move) {
      // Absolute pin - Create a list of pinned pieces, who's movement will then be limited.
      // A piece is pinned if it is the same color as the king and the piece is between the king and the opponent piece. Only 1 piece can be between the king and the opponent piece. 
      const king = board[kingPosition[0]][kingPosition[1]]! as Piece
      let possiblePinnedPiece: Piece | null = null
      for (let j = 1; j <= 7-king.x; j++) {
          const nextTile = board[king.x+j][king.y]
          if (nextTile !== null && nextTile !== undefined){
            if (nextTile.white === king.white && !possiblePinnedPiece){
              possiblePinnedPiece = nextTile! as Piece
            }
            else{
              if (possiblePinnedPiece && nextTile.white !== king.white && (nextTile.symbol === "R" || nextTile.symbol === "Q")){
                possiblePinnedPiece.pinAngle = [1, 0]
                this.absolutePinnedPieces.push(possiblePinnedPiece) 
                break;
              }
            }
          }
      }
      possiblePinnedPiece = null

      for (let j = 1; j <= 7-king.x; j++) {
        const nextTile = board[king.x][king.y+j]
        if (nextTile !== null && nextTile !== undefined){
          if (nextTile.white === king.white && !possiblePinnedPiece){
            possiblePinnedPiece = nextTile! as Piece
          }
          else{
            if (possiblePinnedPiece && nextTile.white !== king.white && (nextTile.symbol === "R" || nextTile.symbol === "Q")){
              possiblePinnedPiece.pinAngle = [0, 1]
              this.absolutePinnedPieces.push(possiblePinnedPiece) 
              break;
            }
          }
        }
      }
      possiblePinnedPiece = null
      for (let j = 1; j <= king.x; j++) {
        const nextTile = board[king.x-j][king.y]
        if (nextTile !== null && nextTile !== undefined){
          if (nextTile.white === king.white && !possiblePinnedPiece){
            possiblePinnedPiece = nextTile! as Piece
          }
          else{
            if (possiblePinnedPiece && nextTile.white !== king.white && (nextTile.symbol === "R" || nextTile.symbol === "Q")){
              possiblePinnedPiece.pinAngle = [-1, 0]
              this.absolutePinnedPieces.push(possiblePinnedPiece) 
              break;
            }
          }
        }
      }
      possiblePinnedPiece = null
      for (let j = 1; j <= king.y; j++) {
        const nextTile = board[king.x][king.y-j]
        if (nextTile !== null && nextTile !== undefined){
          if (nextTile?.white === king.white && !possiblePinnedPiece){
            possiblePinnedPiece = nextTile! as Piece
          }
          else{
            if (possiblePinnedPiece && nextTile?.white !== king.white && (nextTile?.symbol === "R" || nextTile?.symbol === "Q")){
              possiblePinnedPiece.pinAngle = [0, -1]
              this.absolutePinnedPieces.push(possiblePinnedPiece)
              break;
            }
          }
        }
      }
      possiblePinnedPiece = null
      for (let j = 1; j <= 7-king.x; j++) {
        const nextTile = board[king.x+j][king.y+j]
        if (nextTile !== null && nextTile !== undefined){
          if (nextTile.white === king.white && !possiblePinnedPiece){
            possiblePinnedPiece = nextTile! as Piece
          }
          else{
            if (possiblePinnedPiece && nextTile.white !== king.white && (nextTile.symbol === "B" || nextTile.symbol === "Q")){
              possiblePinnedPiece.pinAngle = [1, 1]
              this.absolutePinnedPieces.push(possiblePinnedPiece)
              break;
            }
          }
        }
      }
      possiblePinnedPiece = null
      for (let j = 1; j <= king.x; j++) {
        const nextTile = board[king.x-j][king.y+j]
        if (nextTile !== null && nextTile !== undefined){
          if (nextTile?.white === king.white && !possiblePinnedPiece){
            possiblePinnedPiece = nextTile! as Piece
          }
          else{
            if (possiblePinnedPiece && nextTile.white !== king.white && (nextTile.symbol === "B" || nextTile.symbol === "Q")){
              possiblePinnedPiece.pinAngle = [-1, 1]
              this.absolutePinnedPieces.push(possiblePinnedPiece)
              break;
            }
          }
        }
      }
      possiblePinnedPiece = null
      for (let j = 1; j <= 7-king.x; j++) {
        const nextTile = board[king.x+j][king.y-j]
        if (nextTile){
          if (nextTile.white === king.white && !possiblePinnedPiece){
            possiblePinnedPiece = nextTile! as Piece
          }
          else{
            if (possiblePinnedPiece && nextTile.white !== king.white && (nextTile.symbol === "B" || nextTile.symbol === "Q")){
              possiblePinnedPiece.pinAngle = [1, -1]
              this.absolutePinnedPieces.push(possiblePinnedPiece)
              break;
            }
          }
        }
      }
      possiblePinnedPiece = null
      for (let j = 1; j <= king.x; j++) {
        const nextTile = board[king.x-j][king.y-j]
        if (nextTile !== null && nextTile !== undefined){
          if (nextTile.white === king.white && !possiblePinnedPiece){
            possiblePinnedPiece = nextTile! as Piece
          }
          else{
            if (possiblePinnedPiece && nextTile.white !== king.white && (nextTile.symbol === "B" || nextTile.symbol === "Q")){
              possiblePinnedPiece.pinAngle = [-1, -1]
              this.absolutePinnedPieces.push(possiblePinnedPiece)
              break;
            }
          }
        }
      }
    }
  
    calcLegalMoves(board: Board): void{
      this.opponentMarkedSquares.clear()
      this.absolutePinnedPieces = []

      const kingPosition = this.whoseTurn() ? this.whiteKingPosition : this.blackKingPosition
      const oppositeKingPosition = this.whoseTurn() ? this.blackKingPosition : this.whiteKingPosition
      this.calcAbsolutePinnedPieces(board, kingPosition)

      // Here we calculate all the legal moves for each piece in the chessboard.
      for (let y = 7; y >= 0; y--) {
        for (let x = 0; x < this.chessWidth; x++) {
          if (board[x][y] && board[x][y]?.symbol){
            // Here we use casting to make sure that the piece is a Piece and not null.
            const piece: Piece = board[x][y] as Piece;
            // We need to empty the legalMoves array before we calculate the legal moves for the piece.
            piece.legalMoves = [];

            const symbol = piece.symbol;
            
            if (symbol === "R"){ // Rook
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y])
                if (board[x+j][y] !== null){
                  break;
                }  
              }
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y])
                if (board[x-j][y] !== null){
                  break;
                }
              }
              for (let j = 1; j <= 7-y; j++) {
                piece.legalMoves.push([x, y+j])
                if (board[x][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= y; j++) {
                piece.legalMoves.push([x, y-j])
                if (board[x][y-j] !== null){
                  break;
                }
              }

            } // End of Rook          
            if (piece.symbol === "B"){ // Bishop
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y+j])
                if (board[x+j][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y+j])
                if (board[x-j][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y-j])
                if (board[x+j][y-j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y-j])
                if (board[x-j][y-j] !== null){
                  break;
                }
              } 
            } // End of Bishop
            if (piece.symbol === "Q") { // Queen
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y])
                if (board[x+j][y] !== null){
                  break;
                }
              }
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y])
                if (board[x-j][y] !== null){
                  break;
                }
              }
              for (let j = 1; j <= 7-y; j++) {
                piece.legalMoves.push([x, y+j])
                if (board[x][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= y; j++) {
                piece.legalMoves.push([x, y-j])
                if (board[x][y-j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y+j])
                if (board[x+j][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y+j])
                if (board[x-j][y+j] !== null){
                  break;
                }
              }
              for (let j = 1; j <= 7-x; j++) {
                piece.legalMoves.push([x+j, y-j])
                if (board[x+j][y-j] !== null){
                  break;
                }
              }  
              for (let j = 1; j <= x; j++) {
                piece.legalMoves.push([x-j, y-j])
                if (board[x-j][y-j] !== null){
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

                // Castling
                if (!(piece.hasMoved === true)){
                  const row = piece.white ? 0 : 7;
                  const leftRook = board[0][row];

                  if (!(leftRook?.hasMoved) && board[1][row] === null && board[2][row] === null && board[3][row] === null){
                    piece.legalMoves.push([2, row])
                  }
                  const rightRook = board[7][row];
                  if (!(rightRook?.hasMoved) && board[5][row] === null && board[6][row] === null){
                    piece.legalMoves.push([6, row])
                  }
                }


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
              if (board[x][y+direction] === null){
                piece.legalMoves.push([x, y+direction])
                if (y === row && board[x][y+direction*2] === null){
                  piece.legalMoves.push([x, y+direction*2])
                }
              }
              if (x < 7 && board[x+1][y+direction] !== null){
                piece.legalMoves.push([x+1, y+direction])
              }
              if (x > 0 && board[x-1][y+direction] !== null){
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
              if (board[move[0]][move[1]] === null){
                return true
              }
              else{
                if (board[move[0]][move[1]]?.white !== piece.white){
                  return true
                }
                else{
                  return false
                }
              }
            })

            
            // Check if the users king is in the set of marked squares.
            this.opponentMarkedSquares.forEach(move => {
              if (move[0] === kingPosition[0] && move[1] === kingPosition[1]) {
                this.check = true
              }
            });


            // Mark squares the opponent has access to.
            if (piece.white != this.whoseTurn()){
              for (let z = 0; z < piece.legalMoves.length; z++){
                const move = piece.legalMoves[z]
                this.opponentMarkedSquares.add(move)
              }
            }

            
            const king = board[kingPosition[0]][kingPosition[1]]! as Piece
            king.legalMoves = king.legalMoves.filter(move => {
              this.opponentMarkedSquares.forEach(markedSquare => {
                console.log(markedSquare)
                if (move[0] === markedSquare[0] && move[1] === markedSquare[1]) return false
                return true
              })
            })
            

            // Based on the marked squares from the opponent, king can either move in a unmarked square or have other piece block the check. 
            if (this.check) {
              console.log("Check")
              // Here we force cast the piece to be a Piece and not null. As we know that the piece is a king.
              
              // Remove all moves that do not block the check, or that don't eliminate the piece that is checking the king.
              
              // Figure out which piece is checking the king. (There can be 2).
              let attackers: [Piece | null, Piece | null] = [null, null]
          
              if (piece.legalMoves.includes(kingPosition)){
                if (attackers[0] === null) attackers[0] = piece
                else {
                  attackers[1] = piece
                  this.doubleCheck = true
              }
              }
              // If there is 2 attackers, then we can't block the check.

              piece.legalMoves = piece.legalMoves.filter(move => {
                if (attackers[0]?.legalMoves.includes(move)) return true               
                return false
              })
              
              
            }
            // If a side has no legal moves, then it is checkmate.



            
            // Based on the pinned pieces, we can limit the movement of the pinned pieces.
            // Start by getting the angle of the pin.
            // This code is very ugly. I will try to clean it up later.
            if (this.absolutePinnedPieces.length > 0){
              this.absolutePinnedPieces.forEach(pinnedPiece => {
                pinnedPiece.legalMoves = pinnedPiece.legalMoves.filter(move => {
                  const angle = pinnedPiece.pinAngle! as [number, number] // example [1, 0] = horizontal pin

                  if (angle[0] === 1 && angle[1] === 0 ){
                    for (let i = pinnedPiece.x+1; i < 7; i++){
                      if (move[0] === i && move[1] === pinnedPiece.y) return true
                    }
                  }
                  if (angle[0] === -1 && angle[1] === 0 ){
                    for (let i = pinnedPiece.x-1; i > 0; i--){
                      if (move[0] === i && move[1] === pinnedPiece.y) return true
                    }
                  }
                  if (angle[0] === 0 && angle[1] === 1 ){
                    for (let i = pinnedPiece.y+1; i < 7; i++){
                      if (move[0] === pinnedPiece.x && move[1] === i) return true
                    }
                  }
                  if (angle[0] === 0 && angle[1] === -1 ){
                    for (let i = pinnedPiece.y-1; i > 0; i--){
                      if (move[0] === pinnedPiece.x && move[1] === i) return true
                    }
                  }
                  if (angle[0] === 1 && angle[1] === 1 ){
                    for (let i = 1; i < 7; i++){
                      if (move[0] === pinnedPiece.x+i && move[1] === pinnedPiece.y+i) return true
                    }
                  }
                  if (angle[0] === -1 && angle[1] === 1 ){
                    for (let i = 1; i < 7; i++){
                      if (move[0] === pinnedPiece.x - i && move[1] === pinnedPiece.y+i) return true
                    }
                  }
                  if (angle[0] === 1 && angle[1] === -1 ){
                    for (let i = 1; i < 7; i++){
                      if (move[0] === pinnedPiece.x+i && move[1] === pinnedPiece.y-i) return true
                    }
                  }
                  if (angle[0] === -1 && angle[1] === -1 ){
                    for (let i = 1; i < 7; i++){
                      if (move[0] === pinnedPiece.x-i && move[1] === pinnedPiece.y-i) return true
                    }
                  }
                  return false
                })
              })
            }




          
            
        }
      }
    }


    // Print the marked squares.
    this.opponentMarkedSquares.forEach(function(value){
      //console.log(value)
    })
  }
  
  newTurn(move: Move, pieceMoved: Piece, capture: boolean, check: boolean, castle: boolean | null){
    this.turn++
    pieceMoved.hasMoved = true;


    this.addNotation(move, pieceMoved, capture, check, castle)
  }
  getNotationFromMove(move: Move): string{
    let notation: string
    notation = String.fromCharCode(97 + (move[0]))+(8-move[1])
    return notation
  }
  addNotation(move: Move, pieceMoved: Piece, capture: boolean, check: boolean, castle: boolean | null){
    // Move needs more information. We need to know exatcly which piece is moving. Not just the type of piece.
    const actualTurn = Math.ceil(this.turn/2)

    // This converts a move type to a notation.
    const row = String.fromCharCode(97 + (move[0]))

    if (!this.whoseTurn()){ // White's turn
      this.PGN += actualTurn + ". "
    }
    else{ // Black's turn
      
    }
    if (castle === true) this.PGN += "O-O"
    else if (castle === false) this.PGN += "O-O-O"
    else {
    
    if (pieceMoved.symbol === "P"){
      if (capture){
        this.PGN += row
      }
    }
    else this.PGN += pieceMoved.symbol // This is the piece that is moving.
    if (capture) this.PGN += "x"

    this.PGN += row+(move[1]+1 ) // This is the location for the move.
    }


    if (check) this.PGN += "+"
    this.PGN += " "

    // Check for checkmate, draw, or win.
    if (this.checkMate) this.PGN += "#"
    
    if (this.draw) this.PGN += "1/2-1/2"
    if (this.winner) this.PGN += "1-0"
    if (this.winner === false) this.PGN += "0-1"
    

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