import { ChessBoard } from "./ChessBoard"
import { Piece } from "./ChessBoard";

/*
Here we create the ChessGame. 
*/

export type Chessboard = (Piece | null)[][];
export type Square = [number, number]

export class ChessGame{
    private chessWidth: number
    private chessHeight: number
    private chessBoard: Chessboard;
    private pieces: Piece[]
    private turn: number = 0
    private check: boolean = false
    private checkMate: boolean = false
    private staleMate: boolean = false
    private moveCount: number = 0 // This is used for the 50 move rule. - When piece is captured counter is reset.
    private threeFoldRepetition: boolean = false
    private promotion: boolean = false
    private winner: boolean | null = null // True means white, false means black.
    private draw: boolean = false
    private fen: string 
    private PGN: string = ""
    private listOfOpponentMarkedSquares: Square[]  // This will represent the squares that are marked by the opponent player.
    private mapOfOpponentMarkedSquares: Map<Piece, Square[]>  // Note
    private whiteKingPosition: Square // Position of the white king.
    private blackKingPosition: Square 
    private absolutePinnedPieces: Piece[] = [] // This will be a list of pieces that are pinned.
    private depth: number = 3 // How many moves to look ahead.
    private doubleCheck: boolean = false
    private kingAttacker: Piece | null = null // This will be used to store the piece that is attacking the king.
    private doubleSquarePawnMove: boolean = false // This will be used to check if a pawn has moved 2 squares. This is used for en passant.  
    private doubleSquarePawnXPosition: number = 0 // This will be used to check if a pawn has moved 2 squares. This is used for en passant.  



    constructor(){
        this.chessWidth = 8
        this.chessHeight = 8
        
        this.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"

        // Starting position
        this.chessBoard = new ChessBoard(this.fen).getBoard();
        this.pieces = new ChessBoard(this.fen).getPieces();
        this.listOfOpponentMarkedSquares = [];
        this.mapOfOpponentMarkedSquares = new Map<Piece, Square[]>();
        this.whiteKingPosition = [4, 0] // Starting position for the white king. This will be updated if the king makes a move.
        this.blackKingPosition = [4, 7]
    }


    getBoard(): Chessboard {
        return this.chessBoard;
    }

    updateKingPosition(piece: Piece): void {
      if (piece.symbol !== "K") return;
      if (piece.white) this.whiteKingPosition = [piece.x, piece.y]
      else this.blackKingPosition = [piece.x, piece.y]
    }

    castleKing(piece: Piece, move: Square): boolean {
      if (piece.symbol === "K" && (move[0] <= 6 || move[0] >= 2) && !this.check) {
        const row = piece.white ? 0 : 7;
        const leftSideCastling = move[0] < 4
        const rook = leftSideCastling ? this.chessBoard[0][row] as Piece : this.chessBoard[7][row] as Piece;

        const newKingPosition = leftSideCastling ? 2 : 6;
        const newRookPosition = leftSideCastling ? 3 : 5;

        const newRook: Piece = { ...rook, x: newRookPosition, hasMoved: true };    
        const newKing: Piece = { ...piece, x: newKingPosition, hasMoved: true };

        this.chessBoard[piece.x][piece.y] = null;
        this.chessBoard[rook.x][rook.y] = null;

        this.chessBoard[newKingPosition][piece.y] = newKing;
        this.chessBoard[newRookPosition][piece.y] = newRook;

        this.updateKingPosition(newKing);
        this.addNotation(move, piece, false, !leftSideCastling);


        return true;
      }
      return false;
    }

    enPassant(piece: Piece, move: Square): boolean {
      if (piece.symbol === "P" && this.doubleSquarePawnMove && this.chessBoard[move[0]][move[1]] === null && piece.x !== move[0]) {
        const direction = piece.white ? 1 : -1;
        this.chessBoard[piece.x][piece.y] = null;
        this.chessBoard[move[0]][move[1]] = piece;
        this.chessBoard[move[0]][move[1] - direction] = null;

        this.addNotation(move, piece, true, null);

        return true;
      }

      return false;
    }

    makeMove(piece: Piece, move: Square): boolean {
      if (piece.white !== this.whoseTurn()) return false;
      if (!piece.legalMoves.some(a => a[0] === move[0] && a[1] === move[1])) return false;
      if (piece.x === move[0] && piece.y === move[1]) return false;
      this.turn++;

      const capture: boolean = this.chessBoard[move[0]][move[1]] !== null;

      const enPassant = this.enPassant(piece, move);
      const castling = this.castleKing(piece, move);

      if (!castling && !enPassant){
        const newPiece: Piece = { ...piece, x: move[0], y: move[1], hasMoved: true };    
        this.chessBoard[piece.x][piece.y] = null; 
        this.chessBoard[move[0]][move[1]] = newPiece;

        this.updateKingPosition(newPiece);
        this.addNotation(move, piece, capture, null);

      }
      
      if (piece.symbol === "P" && Math.abs(piece.y - move[1]) === 2) {
        this.doubleSquarePawnMove = true;
        this.doubleSquarePawnXPosition = piece.x;
      }


      this.calcLegalMoves();
      this.check = false;
      this.doubleCheck = false;
      return true;
    }

    getPGN(): string {
      return this.PGN;
    }

    getFen() {
        return this.fen;
    }

    getListOfOpponentMarkedSquares(){
      return this.listOfOpponentMarkedSquares;
    }

    getMapOfOpponentMarkedSquares(){
      return this.mapOfOpponentMarkedSquares;
    }

    getTurn() {
      return this.turn;
    }

    getListOfPiecesFromBoard(): Piece[] {
      const pieces: Piece[] = []
      for (let y = 7; y >= 0; y--) {
        for (let x = 0; x < this.chessWidth; x++) {
          if (this.chessBoard[x][y] !== null) {
            pieces.push(this.chessBoard[x][y] as Piece)
          }
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
     * Updates the pinned pieces.
     * @param this.chessboard 
     * @param kingPosition 
     */
    calcAbsolutePinnedPieces(king: Piece) {
      // Absolute pin - Create a list of pinned pieces, who's movement will then be limited.
      // A piece is pinned if it is the same color as the king and the piece is between the king and the opponent piece. Only 1 piece can be between the king and the opponent piece. 

      const directionalCheck = (direction: [number, number] ) => {
        let possiblePinnedPiece: Piece | null = null
        const symbol = direction[0] === 0 || direction[1] === 0 ? "R" : "B"
        const indexingCondition = null
        for (let i = 1; i <= 7; i++) { // Loop until we hit the edge of the board.
          if (0 >= king.x + i * direction[0] || 8 <= king.x + i * direction[0]
            || 0 >= king.y + i * direction[1] || 8 <= king.y + i * direction[1]
          ) break;
          const nextTile = this.chessBoard[king.x + i * direction[0]][king.y + i * direction[1]]
          if (nextTile === null || nextTile === undefined) continue;

          if (nextTile.white === king.white && !possiblePinnedPiece){
            possiblePinnedPiece = nextTile as Piece
          }
          else{
            if (possiblePinnedPiece && nextTile.white !== king.white && (nextTile.symbol === symbol || nextTile.symbol === "Q")){            
              possiblePinnedPiece.pinAngle = direction;
              this.absolutePinnedPieces.push(possiblePinnedPiece);
            }
            break;
          }
        }
      }

      directionalCheck([1, 0])
      directionalCheck([-1, 0])
      directionalCheck([0, 1])
      directionalCheck([0, -1])
      directionalCheck([1, 1])
      directionalCheck([-1, 1])
      directionalCheck([1, -1])
      directionalCheck([-1, -1])


    }

    calcPseudoLegalMoves(){
      for (let y = 7; y >= 0; y--) {
        for (let x = 0; x < this.chessWidth; x++) {
          if (this.chessBoard[x][y] === null) continue;

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

            // En passant
            const enPassantRow = piece.white ? 4 : 3;
            if (this.doubleSquarePawnMove && piece.x === this.doubleSquarePawnXPosition + 1 && piece.y === enPassantRow){
              piece.legalMoves.push([piece.x-1, piece.y+direction])
            } 
            if (this.doubleSquarePawnMove && piece.x === this.doubleSquarePawnXPosition - 1 && piece.y === enPassantRow){
              piece.legalMoves.push([piece.x+1, piece.y+direction])
            } 
            

          } // End of Pawn
          
        }
      }
    }

    filterOutOfBoundsMoves(): void {
      this.getListOfPiecesFromBoard().forEach(piece => {
        piece.legalMoves = piece.legalMoves.filter(move => {
          if (move[0] >= 0 && move[0] <= 7 && move[1] >= 0 && move[1] <= 7){
            return true
          }
          else return false
        })
      })
    }

    /**
     * Filters the moves where the piece would capture its own pieces.
     * @param piece 
     */
    filterCaptureOwnPiecesMoves(): void {
      this.getListOfPiecesFromBoard().forEach(piece => {
        piece.legalMoves = piece.legalMoves.filter(move => {
          if (this.chessBoard[move[0]][move[1]]?.white !== piece.white){
            return true
          }
          else return false
        })
      })
    }

    checkIfPlayerIsInCheck(): void {
      const kingPosition = this.whoseTurn() ? this.whiteKingPosition : this.blackKingPosition

      this.mapOfOpponentMarkedSquares.forEach((moveList, piece) => {
        if (moveList.some(move => move[0] === kingPosition[0] && move[1] === kingPosition[1])) {
          this.check = true;
          if (this.kingAttacker !== null) this.doubleCheck = true;
          this.kingAttacker = piece 
        }
      })
    }

    /**
     * Mark the squares a pawn can capture. This is used to filter the king's moves.
     * @param pawn 
     */
    pawnOpponentSquares(pawn: Piece): void {
      const direction = pawn.white ? 1 : -1;
      this.listOfOpponentMarkedSquares.push([pawn.x+1, pawn.y+direction]);
      this.listOfOpponentMarkedSquares.push([pawn.x-1, pawn.y+direction]);
      this.mapOfOpponentMarkedSquares.set(pawn, [[pawn.x+1, pawn.y+direction], [pawn.x-1, pawn.y+direction]]);
    }

    markOpponentSquares(): void { // This function will mark the squares that the opponent can move to.
      // This function will be used to convert from psuedo legal moves to legal moves.
      this.getListOfPiecesFromBoard().forEach(piece => {
        if (piece.white === this.whoseTurn()) return;
        if (piece.symbol === "P") {
          this.pawnOpponentSquares(piece);
          return;
        }
        for (let z = 0; z < piece.legalMoves.length; z++){
          const move = piece.legalMoves[z];
          this.listOfOpponentMarkedSquares.push(move);
          this.mapOfOpponentMarkedSquares.set(piece, piece.legalMoves);
        }
      })
    }

    /**
     * Here we filter the king's moves based on the opponent's marked squares. In other words, the king is not allowed  to enter a square that an opponent piece can move to.
     * @param king 
     */
    filterKingMovesBasedOnOpponentMarkedSquares(king: Piece): void {
      king.legalMoves = king.legalMoves.filter(kingMove => {
        return !this.listOfOpponentMarkedSquares.some(move => {
          return move[0] === kingMove[0] && move[1] === kingMove[1];
        });
      });
    }

    /**
     * 
     * @returns A list of squares from the attacker to the king and 1 square beyond. Including the attackers position.
     */
    getLineOfAttack(): Square[] {
      const kingPosition = this.whoseTurn() ? this.whiteKingPosition : this.blackKingPosition
      if (this.kingAttacker === null) return [];
      const attacker = this.kingAttacker! as Piece
      const x =  kingPosition[0] - attacker.x 
      const y =  kingPosition[1] - attacker.y
      const direction: Square = [x, y]
      direction[0] = x < 0 ? -1 : x > 0 ? 1 : 0;
      direction[1] = y < 0 ? -1 : y > 0 ? 1 : 0;

      const lineOfAttack: Square[] = []
      // We aren't afraid of going out of bounds here, since we are only looking at the line of attack. This ends up making the code a lot simpler.
      for (let i = 1; i <= 7; i++){
        lineOfAttack.push([attacker.x+i*direction[0], attacker.y+i*direction[1]])
      }
      
      lineOfAttack.push([attacker.x, attacker.y]) // Add attackers position to the line of attack.

      return lineOfAttack
    }

    doubleCheckFilterKingMoves(king: Piece): void {
      king.legalMoves = king.legalMoves.filter(kingMove => {
        return !this.listOfOpponentMarkedSquares.some(square => kingMove[0] === square[0] && kingMove[1] === square[1])   
      })
    }

    filterPieceMovesIfInCheck(king: Piece): void {
      if (!this.check) return;
      if (this.doubleCheck) {
        this.doubleCheckFilterKingMoves(king);
        return;
      }

      // Limit movement of all pieces to the line of attack. Aka only let pieces block the check.
      const lineOfAttack = this.getLineOfAttack();

        this.getListOfPiecesFromBoard().forEach(piece => {
          if (piece.symbol === "K") return;
          if (this.kingAttacker?.symbol === "N") {  // Special case for knights.
            piece.legalMoves = piece.legalMoves.filter(pieceMove => {
              return pieceMove[0] === this.kingAttacker?.x && pieceMove[1] === this.kingAttacker?.y
            })
          }
          else {
            piece.legalMoves = piece.legalMoves.filter(pieceMove => {
              return lineOfAttack.some(square => pieceMove[0] === square[0] && pieceMove[1] === square[1])   
            })
          }
        })
      
      // Allow the king to move OUT of the line of attack. Opposite of all other pieces.
      king.legalMoves = king.legalMoves.filter(kingMove => {
        if (kingMove[0] === this.kingAttacker?.x && kingMove[1] === this.kingAttacker?.y) return true; // If the king can capture the attacker, then it can move there.
        return !lineOfAttack.some(square => kingMove[0] === square[0] && kingMove[1] === square[1])   
      })


    }

    // 
    filterPinnedPiecesMoves(): void {
      // Based on the pinned pieces, we can limit the movement of the pinned pieces.
      // Start by getting the angle of the pin.
      // This code is very ugly. I will try to clean it up later.
      if (this.absolutePinnedPieces.length <= 0) return;

      this.absolutePinnedPieces.forEach(pinnedPiece => {
        pinnedPiece.legalMoves = pinnedPiece.legalMoves.filter(square => {
          const angle = pinnedPiece.pinAngle! as [number, number] // example [1, 0] = horizontal pin

          if (angle[0] === 1 && angle[1] === 0 ){
            for (let i = pinnedPiece.x+1; i < 7; i++){
              if (square[0] === i && square[1] === pinnedPiece.y) return true
            }
          }
          if (angle[0] === -1 && angle[1] === 0 ){
            for (let i = pinnedPiece.x-1; i > 0; i--){
              if (square[0] === i && square[1] === pinnedPiece.y) return true
            }
          }
          if (angle[0] === 0 && angle[1] === 1 ){
            for (let i = pinnedPiece.y+1; i < 7; i++){
              if (square[0] === pinnedPiece.x && square[1] === i) return true
            }
          }
          if (angle[0] === 0 && angle[1] === -1 ){
            for (let i = pinnedPiece.y-1; i > 0; i--){
              if (square[0] === pinnedPiece.x && square[1] === i) return true
            }
          }
          if (angle[0] === 1 && angle[1] === 1 ){
            for (let i = 1; i < 7; i++){
              if (square[0] === pinnedPiece.x+i && square[1] === pinnedPiece.y+i) return true
            }
          }
          if (angle[0] === -1 && angle[1] === 1 ){
            for (let i = 1; i < 7; i++){
              if (square[0] === pinnedPiece.x - i && square[1] === pinnedPiece.y+i) return true
            }
          }
          if (angle[0] === 1 && angle[1] === -1 ){
            for (let i = 1; i < 7; i++){
              if (square[0] === pinnedPiece.x+i && square[1] === pinnedPiece.y-i) return true
            }
          }
          if (angle[0] === -1 && angle[1] === -1 ){
            for (let i = 1; i < 7; i++){
              if (square[0] === pinnedPiece.x-i && square[1] === pinnedPiece.y-i) return true
            }
          }
          return false
        })
      }) 
    }

    addCasltingMoves(king: Piece): void {
       // Left side castling
       const row = king.white ? 0 : 7;
       const leftRook = this.chessBoard[0][row];
       const emptyLane = this.chessBoard[1][row] === null && this.chessBoard[2][row] === null && this.chessBoard[3][row] === null;

       // Make sure opponent is not attacking the squares that the king will move through.
       const emptySquares1: Square[] = [[0, row], [1, row], [2, row], [3, row]];
       if (this.listOfOpponentMarkedSquares.some(opSquare => emptySquares1.some(emptySquare => opSquare[0] === emptySquare[0] && opSquare[1] === emptySquare[1]))) return;


       if (leftRook && leftRook.symbol === "R" && leftRook.hasMoved === false && emptyLane){
         king.legalMoves.push([2, row])
         king.legalMoves.push([1, row])
         king.legalMoves.push([0, row])
       }

        // Right side castling
        const rightRook = this.chessBoard[7][row];
        const emptyLane2 = this.chessBoard[5][row] === null && this.chessBoard[6][row] === null;

        const emptySquares2: Square[] = [[7, row], [6, row], [5, row]];
        if (this.listOfOpponentMarkedSquares.some(opSquare => emptySquares2.some(emptySquare => opSquare[0] === emptySquare[0] && opSquare[1] === emptySquare[1]))) return;
        if (rightRook && rightRook.symbol === "R" && rightRook.hasMoved === false && emptyLane2){
          king.legalMoves.push([6, row])
          king.legalMoves.push([7, row])
        }
    }

  
    /**
     * Calculates the legal moves for each piece in the chessboard. This effectts the legalMoves array in each piece.
     */
    calcLegalMoves(): void{
      this.listOfOpponentMarkedSquares = [];
      this.mapOfOpponentMarkedSquares = new Map<Piece, Square[]>;
      this.absolutePinnedPieces = [];
      this.kingAttacker = null;

      const kingPosition = this.whoseTurn() ? this.whiteKingPosition : this.blackKingPosition
      const king = this.chessBoard[kingPosition[0]][kingPosition[1]]! as Piece
      //const oppositeKingPosition = this.whoseTurn() ? this.blackKingPosition : this.whiteKingPosition

      this.calcAbsolutePinnedPieces(king)

      this.calcPseudoLegalMoves();

      this.filterOutOfBoundsMoves();

      this.filterCaptureOwnPiecesMoves();
      this.markOpponentSquares();
      this.checkIfPlayerIsInCheck(); // Fix this position.
      this.filterKingMovesBasedOnOpponentMarkedSquares(king)
      this.filterPieceMovesIfInCheck(king);
      this.filterPinnedPiecesMoves();

      this.addCasltingMoves(king);
      
      console.log(this.absolutePinnedPieces)

    }


  addNotation(square: Square, pieceMoved: Piece, capture: boolean, castle: boolean | null){
    // Move needs more information. We need to know exatcly which piece is moving. Not just the type of piece.
    const actualTurn = Math.ceil(this.turn/2)

    const pieceNotation = String.fromCharCode(97 + pieceMoved.x)

    // This converts a move type to a notation.
    const squareNotation = String.fromCharCode(97 + square[0])

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
        this.PGN += pieceNotation
      }
    }
    else this.PGN += pieceMoved.symbol // This is the piece that is moving.
    if (capture) this.PGN += "x"

    this.PGN += squareNotation+(square[1]+1 ) // This is the location for the move.
    }


    if (this.check) this.PGN += "+"
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