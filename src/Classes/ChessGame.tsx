import { abort } from "process";
import { ChessBoard } from "./ChessBoard"
import { Piece } from "./ChessBoard";
import { Move } from "./Move";

/*
Here we create the ChessGame. 
*/

type chessboard = (Piece | null)[][];

export class ChessGame{
    private chessWidth: number
    private chessHeight: number
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
        this.depth = 3 // Look 3 moves ahead and evaluate the this.chessboard.
        this.PGN = ""

        // Starting position
        this.chessBoard = new ChessBoard(this.fen).getBoard();
        this.pieces = new ChessBoard(this.fen).getPieces();
        this.opponentMarkedSquares = new Set<Move>()
        this.whiteKingPosition = [4, 0] // Starting position for the white king. This will be updated if the king makes a move.
        this.blackKingPosition = [4, 7]
    }


    getBoard(): (Piece | null)[][] {
        return this.chessBoard;
    }

    makeMove(piece: Piece, move: Move): boolean {
      if (piece.white !== this.whoseTurn()) return false;
      if (!(piece.legalMoves.some(a => a[0] === move[0] && a[1] === move[1]))) return false;
      if (piece.x === move[0] && piece.y === move[1]) return false;

      const capture: boolean = this.chessBoard[move[0]][move[1]] !== null
      const check: boolean = this.check
      this.chessBoard[move[0]][move[1]] = piece
      this.chessBoard[piece.x][piece.y] = null
      piece.x = move[0]
      piece.y = move[1]
      
      this.calcLegalMoves();

      this.turn++
      piece.hasMoved = true;
     
      this.addNotation(move, piece, capture, check, null)

      return true;
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

    getListOfPiecesFromBoard(): Piece[] {
      const pieces: Piece[] = []
      for (let y = 7; y >= 0; y--) {
        for (let x = 0; x < this.chessWidth; x++) {
          if (this.chessBoard[x][y] == null) break;
          pieces.push(this.chessBoard[x][y] as Piece)
        }
      }
      return pieces
    }

    /**
     * @returns True if it is black's turn, false if it is white's turn.
     */
    whoseTurn(): boolean {
      return this.turn % 2 === 0;
    }

    /**
     * Gets the pinned pieces from a this.chessboard.
     * @param this.chessboard 
     * @param kingPosition 
     */
    calcAbsolutePinnedPieces(kingPosition: Move) {
      // Absolute pin - Create a list of pinned pieces, who's movement will then be limited.
      // A piece is pinned if it is the same color as the king and the piece is between the king and the opponent piece. Only 1 piece can be between the king and the opponent piece. 
      const king = this.chessBoard[kingPosition[0]][kingPosition[1]]! as Piece
      let possiblePinnedPiece: Piece | null = null
      for (let j = 1; j <= 7-king.x; j++) {
          const nextTile = this.chessBoard[king.x+j][king.y]
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
        const nextTile = this.chessBoard[king.x][king.y+j]
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
        const nextTile = this.chessBoard[king.x-j][king.y]
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
        const nextTile = this.chessBoard[king.x][king.y-j]
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
        const nextTile = this.chessBoard[king.x+j][king.y+j]
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
        const nextTile = this.chessBoard[king.x-j][king.y+j]
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
        const nextTile = this.chessBoard[king.x+j][king.y-j]
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
        const nextTile = this.chessBoard[king.x-j][king.y-j]
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

    calcPseudoLegalMoves(){
      for (let y = 7; y >= 0; y--) {
        for (let x = 0; x < this.chessWidth; x++) {
          if (this.chessBoard[x][y] == null) break;

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

              // Castling
              if (!(piece.hasMoved === true)){
                const row = piece.white ? 0 : 7;
                const leftRook = this.chessBoard[0][row];

                if (!(leftRook?.hasMoved) && this.chessBoard[1][row] === null && this.chessBoard[2][row] === null && this.chessBoard[3][row] === null){
                  piece.legalMoves.push([2, row])
                }
                const rightRook = this.chessBoard[7][row];
                if (!(rightRook?.hasMoved) && this.chessBoard[5][row] === null && this.chessBoard[6][row] === null){
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
          
        }
      }
    }

    filterOutOfBoundsMoves(piece: Piece): void {
      piece.legalMoves = piece.legalMoves.filter(move => {
        if (move[0] >= 0 && move[0] <= 7 && move[1] >= 0 && move[1] <= 7){
          return true
        }
        else{
          return false
        }
      })
    }

    filterCaptureOwnPiecesMoves(piece: Piece): void {
      piece.legalMoves = piece.legalMoves.filter(move => {
        if (this.chessBoard[move[0]][move[1]]?.white !== piece.white){
          return true
        }
        else return false
        
      })
    }

    checkIfPlayerIsInCheck(): void {
      const kingPosition = this.whoseTurn() ? this.whiteKingPosition : this.blackKingPosition

      this.opponentMarkedSquares.forEach(move => {
        if (move[0] === kingPosition[0] && move[1] === kingPosition[1]) {
          this.check = true
        }
      });
    }

    markOpponentSquares(piece: Piece): void {
      if (piece.white != this.whoseTurn()){
        for (let z = 0; z < piece.legalMoves.length; z++){
          const move = piece.legalMoves[z]
          this.opponentMarkedSquares.add(move)
        }
      }
    }

    filterKingMovesBasedOnOpponentMarkedSquares(king: Piece): void {
      const kingPosition = this.whoseTurn() ? this.whiteKingPosition : this.blackKingPosition

      king.legalMoves = king.legalMoves.filter(move => {
        console.log(this.opponentMarkedSquares.has(move));
        if (this.opponentMarkedSquares.has(move)){
          return false
        }
        else{
          return true
        }
      })
    }

    // INCOMPLETE
    filterKingMovesIfInCheck(piece: Piece, kingPosition: Move): void {
      if (!(this.check)) return;
      console.log("Check")

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


      // IF A SIDE HAS NO LEGAL MOVES, THEN IT IS CHECKMATE.


    }

    filterPinnedPiecesMoves(piece: Piece): void {
      // Based on the pinned pieces, we can limit the movement of the pinned pieces.
      // Start by getting the angle of the pin.
      // This code is very ugly. I will try to clean it up later.
      if (this.absolutePinnedPieces.length <= 0) return;

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

  
    /**
     * Calculates the legal moves for each piece in the chessboard. This effectts the legalMoves array in each piece.
     */
    calcLegalMoves(): void{
      this.opponentMarkedSquares.clear()
      this.absolutePinnedPieces = []

      const kingPosition = this.whoseTurn() ? this.whiteKingPosition : this.blackKingPosition
      const king = this.chessBoard[kingPosition[0]][kingPosition[1]]! as Piece
      const oppositeKingPosition = this.whoseTurn() ? this.blackKingPosition : this.whiteKingPosition
      this.calcAbsolutePinnedPieces(kingPosition)

      this.calcPseudoLegalMoves();

      this.checkIfPlayerIsInCheck();
      this.getListOfPiecesFromBoard().forEach(piece => {
        this.filterOutOfBoundsMoves(piece);
        this.filterCaptureOwnPiecesMoves(piece);
        this.markOpponentSquares(piece);
        this.filterKingMovesIfInCheck(piece, kingPosition);
        this.filterPinnedPiecesMoves(piece);
      });
                  
      this.filterKingMovesBasedOnOpponentMarkedSquares(king)

    
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