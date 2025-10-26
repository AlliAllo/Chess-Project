import { ChessBoard } from "./ChessBoard"
import { Piece } from "./ChessBoard";

/*
Here we create the ChessGame. 
*/

export type Chessboard = (Piece | null)[][];
export type Square = [number, number]

interface MoveRecord {
  piece: Piece;             // The piece that moved
  from: Square;             // Original square
  to: Square;               // Target square
  previousFen: string;
  capturedPiece?: Piece;    // Any captured piece
  isEnPassant?: boolean;
  isCastling?: boolean;
  isPromotion?: boolean;
  castlingRookFrom?: Square;
  castlingRookTo?: Square;
  promotionSymbol?: string; // Promotion info
  
}

type ChessGameOptions = { fen?: string; lightWeightMode?: boolean; clone?: boolean};


export class ChessGame{
    private chessWidth: number;
    private chessHeight: number;
    private ChessBoard: ChessBoard;
    private chessBoard: Chessboard;
    private turn: number = 0
    private check: boolean = false
    private checkMate: boolean = false
    private staleMate: boolean = false
    private winner: boolean | null = null // True means white, false means black.
    private draw: boolean = false
    private threeFoldRepetition: boolean = false
    private fen: string 
    private PGN: string = ""
    private listOfOpponentMarkedSquares: Square[]  // This will represent the squares that are marked by the opponent player.
    private mapOfOpponentMarkedSquares: Map<Piece, Square[]>  // Note
    private whiteKingPosition: Square // Position of the white king.
    private blackKingPosition: Square 
    private absolutePinnedPieces: Piece[] = [] // This will be a list of pieces that are pinned.
    private doubleCheck: boolean = false
    private kingAttacker: Piece | null = null // This will be used to store the piece that is attacking the king.
    private promotion: boolean = false
    private promotionInformation: {piece: Piece, move: Square} | null = null
    private positionHistory: string[]
    private positionCounts: Map<string, number> = new Map();
    private lightWeightMode: boolean = false // If true, some calculations will be skipped to improve performance. This mostly includes UI related calculations, PGN generation, FEN updates, etc.
    private clone: boolean = false // If true, the game is a clone used for perft testing and similar purposes.

    constructor({ fen, lightWeightMode = false, clone = false }: ChessGameOptions = {}) {
        this.chessWidth = 8;
        this.chessHeight = 8;

        this.fen = fen ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        this.lightWeightMode = lightWeightMode ?? false;
        this.clone = clone ?? false;

        this.fen.trim();
        
        

        this.positionCounts.set(this.fen.split(" ").slice(0, 4).join(" "), 1); // Initialize position count for starting position. Used for threefold repetition.
        
        this.positionHistory = [this.fen];

        // Starting position
        this.ChessBoard = new ChessBoard(fen);
        this.chessBoard = this.ChessBoard.getBoard();

        this.whiteKingPosition = this.ChessBoard.getKingPositions().whiteKingPosition;
        this.blackKingPosition = this.ChessBoard.getKingPositions().blackKingPosition;

        this.listOfOpponentMarkedSquares = [];
        this.mapOfOpponentMarkedSquares = new Map<Piece, Square[]>();

        if (!this.clone) this.calcLegalMoves();
    }


    getBoard(): Chessboard {
        return this.chessBoard;
    }

    getCheck(): boolean {
      return this.check;
    }

    getDraw(): boolean {
      return this.draw;
    }

    getCheckMate(): boolean {
      return this.checkMate;
    }

    getAttacker(): Piece | null {
      return this.kingAttacker;
    }

    getPromotion(): boolean {
      return this.promotion;
    }

    getWhiteKingPosition(): Square {
      return this.whiteKingPosition;
    }

    getBlackKingPosition(): Square {
      return this.blackKingPosition;
    }


    setPromotion(promotion: boolean): void {
      this.promotion = promotion;
    }

    getPromotionInformation(): {piece: Piece, move: Square} | null {
      return this.promotionInformation;
    }

    setPromotionInformationNull(): void {
      this.promotionInformation = null;
    }

    getPositionHistory(): string[] {
      return this.positionHistory;
    }

    getTurnFromFen(fen: string): string {
      return fen.split(" ")[1]; // The second part of the FEN string represents whose turn it is.
    }

    getCanCastleFromFen(fen: string): string {
      return fen.split(" ")[2]; // The third part of the FEN string represents castling rights.
    }

    getEnPassantFromFen(fen: string): string {
      return fen.split(" ")[3]; 
    }

    getHalfMoveClockFromFen(fen: string): number {
      return parseInt(fen.split(" ")[4]);
    }

    getFullMoveNumberFromFen(fen: string): number {
      return parseInt(fen.split(" ")[5]);
    }

    getFEN(): string {
      return this.fen;
    }

    getThreefoldRepetition(): boolean {
      return this.threeFoldRepetition;
    }

    updateFenAfterMove(): void {
      const fenParts = this.fen.split(" ");
      // Update board part
      fenParts[0] = this.getFENPositionFromBoard();

      this.fen = fenParts.join(" ");
    }
    

    setChessBoard(fen: string): void {
      const chessBoard = new ChessBoard(fen);
      this.chessBoard = chessBoard.getBoard();
      this.whiteKingPosition = chessBoard.getKingPositions().whiteKingPosition;
      this.blackKingPosition = chessBoard.getKingPositions().blackKingPosition;
      this.fen = fen;
      this.updateGameAfterLoadingPosition();
    }

    getFENPositionFromBoard(): string {
      let fen = "";
      for (let y = 7; y >= 0; y--) {
        let emptySquares = 0;
        for (let x = 0; x < this.chessWidth; x++) {
          const piece = this.chessBoard[x][y];
          if (piece === null) {
            emptySquares++;
          }
          else {
            if (emptySquares > 0) {
              fen += emptySquares;
              emptySquares = 0;
            }
            const symbol = piece.white ? piece.symbol : piece.symbol.toLowerCase();
            fen += symbol;
          }
        }
        if (emptySquares > 0) fen += emptySquares;
        if (y > 0) fen += "/";
      }
      
      return fen;
    }

    updateKingPosition(piece: Piece): void {
      if (piece.symbol !== "K") return;
      if (piece.white) this.whiteKingPosition = [piece.x, piece.y]
      else this.blackKingPosition = [piece.x, piece.y]
    }

    getFileFromX(x: number): string {
      return String.fromCharCode('a'.charCodeAt(0) + x);
    }

    getRankFromY(y: number): string {
      return (y + 1).toString();
    }

    squareToAlgebraicNotation(square: Square): string {
      const file = this.getFileFromX(square[0]);
      const rank = this.getRankFromY(square[1]);
      return file + rank;
    }

    algebraicNotationToSquare(notation: string): Square {
      const file = notation.charCodeAt(0) - 'a'.charCodeAt(0);
      const rank = parseInt(notation[1]) - 1;
      return [file, rank];
    }

    /**
     * Used for FEN notation. 
     * @param move The move that was made.
     */
    updateCanCastle(piece: Piece): void {
      const symbol = piece.symbol.toLowerCase();
      if (symbol !== "k" && symbol !== "r") return;

      const isWhite = piece.white;
      const fenParts = this.fen.split(" ");
      const row = isWhite ? 0 : 7;

      if (symbol === "k") {
          // Remove both king and queen castling rights for this color
          fenParts[2] = fenParts[2].replace(isWhite ? /[KQ]/g : /[kq]/g, "");
      }



      if (symbol === "r" && piece.y === row) {
        if (isWhite) {
            if (piece.x === 0) fenParts[2] = fenParts[2].replace("Q", "");
            if (piece.x === 7) fenParts[2] = fenParts[2].replace("K", "");
        } else {
            if (piece.x === 0) fenParts[2] = fenParts[2].replace("q", "");
            if (piece.x === 7) fenParts[2] = fenParts[2].replace("k", "");
        }
      }

      if (fenParts[2] === "") fenParts[2] = "-";
      this.fen = fenParts.join(" ");
    }


    castleKing(piece: Piece, move: Square): boolean {
      if (piece.symbol.toUpperCase() !== "K" || !(move[0] >= 6 || move[0] <= 2) || this.check) return false;
      if (piece.white && !this.getCanCastleFromFen(this.fen).includes(move[0] === 6 ? "K" : "Q")) return false;
      if (!piece.white && !this.getCanCastleFromFen(this.fen).includes(move[0] === 6 ? "k" : "q")) return false;
      
      const row = piece.white ? 0 : 7;
      const leftSideCastling = move[0] < 4
      const rook = leftSideCastling ? this.chessBoard[0][row] as Piece : this.chessBoard[7][row] as Piece;

      const newKingPosition = leftSideCastling ? 2 : 6;
      const newRookPosition = leftSideCastling ? 3 : 5;

      const newRook: Piece = { ...rook, x: newRookPosition};    
      const newKing: Piece = { ...piece, x: newKingPosition};

      this.chessBoard[piece.x][piece.y] = null;
      this.chessBoard[rook.x][rook.y] = null;

      this.chessBoard[newKingPosition][piece.y] = newKing;
      this.chessBoard[newRookPosition][piece.y] = newRook;

      const originalPieceLocation: Square = [piece.x, piece.y];
      this.addNotation(move, piece, false, !leftSideCastling, originalPieceLocation);
      this.updateGameAfterMove(newKing, false);

      return true;
      
    }

    enPassant(piece: Piece, move: Square): boolean {
      if (piece.symbol === "P" && this.chessBoard[move[0]][move[1]] === null && piece.x !== move[0]) {
        const direction = piece.white ? 1 : -1;
        const originalPieceLocation: Square = [piece.x, piece.y];
        const newPawn: Piece = { ...piece, x: move[0], y: move[1] };
        this.chessBoard[piece.x][piece.y] = null;
        this.chessBoard[move[0]][move[1]] = newPawn;
        this.chessBoard[move[0]][move[1] - direction] = null; // Capture the pawn.

        this.addNotation(move, piece, true, null, originalPieceLocation);
        this.updateGameAfterMove(piece, true);


        return true;
      }

      return false;
    }

    /**
     * This function is called in the frontend when the user selects a piece to promote to. 
     * @param newPieceType 
     * @returns 
     */
    makePawnPromotion(
      newPieceType: string,
      computerMove: boolean,
      options?: {
        position?: Square,
        destination?: Square,
        perftTest?: boolean
      }
    ): MoveRecord | false {
      if (!this.promotionInformation && !computerMove && !options?.perftTest) return false;

      let piece: Piece;
      let move: Square;

      if (options?.perftTest || (this.promotionInformation === null && computerMove && options?.position)) {
        piece = this.chessBoard[options?.position![0]][options?.position![1]] as Piece;
        move = options?.destination!;
      } else {
        piece = this.promotionInformation!.piece;
        move = this.promotionInformation!.move;
      }

      const capturedPiece: Piece | null = this.chessBoard[move[0]][move[1]];
      const newValue = this.ChessBoard.getPieceSymbolToValue().get(newPieceType) as number;
      const newImageURL = this.ChessBoard.getPieceSymbolToImageURL().get(newPieceType)?.get(piece.white) as string;

      // Create promoted piece
      const newPiece: Piece = {
        ...piece,
        symbol: newPieceType,
        x: move[0],
        y: move[1],
        value: newValue,
        imageURL: newImageURL,
      };

      // Update board
      const originalPieceLocation: Square = [piece.x, piece.y];
      this.chessBoard[piece.x][piece.y] = null;
      this.chessBoard[move[0]][move[1]] = newPiece;

      const capture = capturedPiece !== null;

      this.addNotation(move, piece, capture, null, originalPieceLocation, newPieceType);
      this.updateGameAfterMove(newPiece, capture);

      // Create move record (for unmakeMove)
      const moveRecord: MoveRecord = {
        from: originalPieceLocation,
        to: [move[0], move[1]],
        piece: piece,
        capturedPiece: capturedPiece ?? undefined,
        isEnPassant: false,
        isCastling: false,
        previousFen: this.fen,
      };


      return moveRecord;
    }

    /**
     * 
     * @description Checks if a pawn has made a double move. If so, it updates the en passant target square in the FEN string.
     */
    checkIfPawnMakesDoubleMove(piece: Piece, move: Square): void {
      if (piece.symbol === "P" && Math.abs(piece.y - move[1]) === 2) {
        const row = !this.whoseTurn() ? 5 : 2;

        this.updateEnPassantFEN([piece.x, row]);
        return;
      }

      this.updateEnPassantFEN(undefined);
    }

    makeMove(piece: Piece, move: Square, options?: { computerMove: boolean, promotionType?: string} ): MoveRecord | null {
      if (piece.white !== this.whoseTurn()) return null;
      if (!piece.legalMoves.some(a => a[0] === move[0] && a[1] === move[1])) return null;
      if (piece.x === move[0] && piece.y === move[1]) return null; 
      if (piece.symbol === "P" && (move[1] === 0 || move[1] === 7) && !this.promotion && !options?.computerMove) { // Pawn promotion
        // We'll need to store some information about the pawn promotion.
        this.promotionInformation = {piece: piece, move: move};
        this.promotion = true;
        return null;
      }
      if (this.checkMate || this.staleMate || this.draw) return null;
      
      const priorFen = this.fen;

      this.checkIfPawnMakesDoubleMove(piece, move);
      
      //console.log(this.fen);

      if (options?.promotionType) {
        this.makePawnPromotion(
          options?.promotionType!,
          options?.computerMove ?? false,
          { position: [piece.x, piece.y], destination: [move[0], move[1]], perftTest: true }
        );
      }

      const enPassant = this.enPassant(piece, move);
      const castling = this.castleKing(piece, move);

      const capture: boolean = this.chessBoard[move[0]][move[1]] !== null;
      const capturedPiece = this.chessBoard[move[0]][move[1]];
      
      if (!castling && !enPassant && !options?.promotionType){ // Normal move

        const originalPieceLocation: Square = [piece.x, piece.y];
        const newPiece: Piece = { ...piece, x: move[0], y: move[1]};    
        this.chessBoard[piece.x][piece.y] = null; 
        this.chessBoard[move[0]][move[1]] = newPiece;

        this.addNotation(move, piece, capture, null, originalPieceLocation);
        this.updateGameAfterMove(newPiece, capture); 
 
      }

      //console.log(this.fen);



      const record: MoveRecord = {
        from: [piece.x, piece.y],
        to: [move[0], move[1]],
        piece,
        capturedPiece: capturedPiece ?? undefined,
        isEnPassant: enPassant,
        isCastling: castling,
        previousFen: priorFen,
      };

      return record;
    }

    unMakeMove(move: MoveRecord) {
      const { piece, from, to, capturedPiece, isEnPassant, isCastling, previousFen, isPromotion, promotionSymbol } = move;

      console.log("Unmaking move:", move);
      console.log("Current FEN before unmake:", this.fen);
      console.log("Previous FEN to revert to:", previousFen);
      console.log(isEnPassant, isCastling, isPromotion);

      // Move piece back
      this.chessBoard[from[0]][from[1]] = piece;
      piece.x = from[0];
      piece.y = from[1];

      // Remove from destination
      this.chessBoard[to[0]][to[1]] = null;

      // Restore captured piece
      const enPassantCaptureSquare = isEnPassant ? this.algebraicNotationToSquare(this.getEnPassantFromFen(previousFen)) : undefined;
      if (capturedPiece) {
        if (isEnPassant && enPassantCaptureSquare) {
          this.chessBoard[enPassantCaptureSquare[0]][enPassantCaptureSquare[1]] = capturedPiece;
        } else {
          this.chessBoard[to[0]][to[1]] = capturedPiece;
        }
      }

      // Restore rook if castling
      const castlingRookFrom = isCastling && to[0] === 6 ? [7, from[1]] : isCastling && to[0] === 2 ? [0, from[1]] : undefined;
      const castlingRookTo = isCastling && to[0] === 6 ? [5, from[1]] : isCastling && to[0] === 2 ? [3, from[1]] : undefined;
      if (isCastling && castlingRookFrom && castlingRookTo) {
        const rook = this.chessBoard[castlingRookTo[0]][castlingRookTo[1]];
        if (rook) {
          this.chessBoard[castlingRookFrom[0]][castlingRookFrom[1]] = rook;
          this.chessBoard[castlingRookTo[0]][castlingRookTo[1]] = null;
          rook.x = castlingRookFrom[0];
          rook.y = castlingRookFrom[1];
        }
      }

      

      this.fen = previousFen;

      if (piece.symbol === "K") {
        this.updateKingPosition(piece);
      }

      this.updateGameAfterUnmakeMove();

    }


    updateGameAfterUnmakeMove(): void {
      this.removePriorMoveFromPGN(); 
      this.updateTurnCount(true);
      this.calcLegalMoves();

      this.positionHistory.pop();

    }


    updateGameAfterLoadingPosition(): void {
      this.calcLegalMoves();
    }

    removePriorMoveFromPGN(): void {
      const moves = this.PGN.trim().split(" ");
      if (moves.length === 0) return;
      const lastMove = moves.pop();
      this.PGN = moves.join(" ");
      if (lastMove && lastMove.endsWith("...")) {
        this.PGN = this.PGN.trim();
      }
    }

    updateGameAfterMove(piece: Piece, capture: boolean): void {
      this.check = false;
      this.doubleCheck = false;
      this.promotion = false;
      this.promotionInformation = null;

      this.updateTurnCount();

      this.updateKingPosition(piece);
      this.updateCanCastle(piece);

      this.calcLegalMoves();

      if (!this.lightWeightMode) {
        this.halfMoveClockIncrement(piece, capture);
        this.updateFenAfterMove();
        this.positionHistory.push(this.getFENPositionFromBoard());
        this.checkThreefoldRepetition();
      }

      this.checkForCheckMateOrDraw();

    }


    halfMoveClockIncrement(piece: Piece, capture: boolean): void {
      if (!(piece.symbol === "P" || capture)) return;
      
      const fenParts = this.fen.split(" ");
      let halfmoveClock = parseInt(fenParts[4], 10) || 0;

      // Reset on pawn move or capture, otherwise increment
      halfmoveClock = (piece.symbol === "P" || capture) ? 0 : halfmoveClock + 1;

      fenParts[4] = halfmoveClock.toString();
      this.fen = fenParts.join(" ");

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
     * @returns True if it is white's turn, false if it is black's turn.
     */
    whoseTurn(): boolean {
      return this.getTurnFromFen(this.fen) === "w" ? true : false; 
    }

    /**
     * @description updates the turn field variable and the FEN string accordingly.
     */
    updateTurnCount(backwards?: boolean): void {
      const fenParts = this.fen.split(" ");
      const increment = fenParts[1] === "b" ? backwards ? -1 : 1 : 0 // Increment fullmove when black moves.
      fenParts[5] = (parseInt(fenParts[5])+increment).toString();
      fenParts[1] = fenParts[1] === "w" ? "b" : "w"; // invert
      this.fen = fenParts.join(" ");
    }

    updateEnPassantFEN(square: Square | undefined, ): void {
      const fenParts = this.fen.split(" ");
      fenParts[3] = square ? this.squareToAlgebraicNotation(square) : "-"
      this.fen = fenParts.join(" ");
    }


    calcAbsolutePinnedPieces(king: Piece) {
      // Absolute pins: pieces that cannot move without exposing their king to check.
      // A piece is pinned if it’s between its own king and an opposing sliding piece (R, B, Q)
      // along one of the 8 directions. Only one piece may be between them.

      const directionalCheck = (direction: [number, number]) => {
        let possiblePinnedPiece: Piece | null = null;

        for (let i = 1; i <= 7; i++) {
          const x = king.x + i * direction[0];
          const y = king.y + i * direction[1];

          // Stop if we go off the board
          if (x < 0 || x >= 8 || y < 0 || y >= 8) break;

          const nextTile = this.chessBoard[x][y];
          if (!nextTile) continue; // 
          
          if (!possiblePinnedPiece && nextTile.white !== king.white) break; // Enemy piece found before possible pinned piece → not a pin

          if (nextTile.white === king.white) {
            // First friendly piece in this direction → candidate for being pinned
            if (!possiblePinnedPiece) {
              possiblePinnedPiece = nextTile;
            } else {
              // Two friendly pieces block line so not a pin
              break;
            }
          } else {
            // Enemy piece found
            if (possiblePinnedPiece) {
              const isDiagonal = direction[0] !== 0 && direction[1] !== 0;
              const enemySymbol = nextTile.symbol.toUpperCase();

              // Check if the enemy piece can attack along this line
              if (
                enemySymbol === "Q" ||
                (enemySymbol === "R" && !isDiagonal) ||
                (enemySymbol === "B" && isDiagonal)
              ) {
                // The friendly piece is pinned.
                possiblePinnedPiece.pinAngle = direction;
                this.absolutePinnedPieces.push(possiblePinnedPiece);
              
            }
            break;
          }
        }
      }}

      // Check all 8 directions
      directionalCheck([1, 0]);
      directionalCheck([-1, 0]);
      directionalCheck([0, 1]);   
      directionalCheck([0, -1]);  
      directionalCheck([1, 1]);   
      directionalCheck([-1, 1]);  
      directionalCheck([1, -1]);  
      directionalCheck([-1, -1]); 
      
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
            const enPassantSquare = this.getEnPassantFromFen(this.fen);
            if (enPassantSquare === "-") continue;

            const [file, rank] = this.algebraicNotationToSquare(enPassantSquare);
            const inCheckAfterEnPassant = this.clone ? false : this.isInCheckAfterEnPassant(piece, [file, rank]);
            // If the pawn can capture en passant
            if (Math.abs(piece.x - file) === 1 && piece.y === rank - direction && !inCheckAfterEnPassant) {
              piece.legalMoves.push([file, rank]);
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
        moveList.forEach(move => {
          if (move[0] === kingPosition[0] && move[1] === kingPosition[1]) {
            this.check = true;
            if (this.kingAttacker !== null) {
              this.doubleCheck = true;
              // When a double check is detected, add the new attacker's legal moves to the marked squares.

              // Add the lineofattack addional square to the list of opponent marked squares. 
              // This needs to be done before updating the attacker. This avoids the redundance of having to track 2 attackers.
              const lineOfAttack = this.getLineOfAttack();

              // Remove the attackers square from the line of attack. 
              // This is done due to the fact that the king might be able to capture the attacker.
              const lineOfAttackWithoutAttackerSquare = lineOfAttack.slice(1); 
            
              this.listOfOpponentMarkedSquares.push(...lineOfAttackWithoutAttackerSquare);
              this.mapOfOpponentMarkedSquares.set(this.kingAttacker!, lineOfAttackWithoutAttackerSquare);

              this.kingAttacker = piece;
            } 

            this.kingAttacker = piece;
          }
        }) 
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
        if (piece.white === this.whoseTurn()) return; // Only consider opponent pieces.
        if (piece.symbol === "P") {
          this.pawnOpponentSquares(piece);
          return;
        }
        this.listOfOpponentMarkedSquares.push(...piece.legalMoves);
        this.mapOfOpponentMarkedSquares.set(piece, piece.legalMoves);
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
      if (this.kingAttacker === null || this.kingAttacker.symbol === "N" || this.kingAttacker.symbol === "P") return []; // Knights can't be blocked.
      
      const kingPosition = this.whoseTurn() ? this.whiteKingPosition : this.blackKingPosition
      const attacker = this.kingAttacker! as Piece
      const x =  kingPosition[0] - attacker.x 
      const y =  kingPosition[1] - attacker.y
      const direction: Square = [x, y]
      direction[0] = x < 0 ? -1 : x > 0 ? 1 : 0;
      direction[1] = y < 0 ? -1 : y > 0 ? 1 : 0;

      const lineOfAttack: Square[] = []
      lineOfAttack.push([attacker.x, attacker.y]) // Add attackers position to the line of attack. Useful for enabling the capture of the attacker.

      // We aren't afraid of going out of bounds here, since we are only looking at the line of attack. This ends up making the code a lot simpler.
      for (let i = 1; i <= 7; i++){
        lineOfAttack.push([attacker.x+i*direction[0], attacker.y+i*direction[1]])
        if (attacker.x+i*direction[0] === kingPosition[0] && attacker.y+i*direction[1] === kingPosition[1]) {
          lineOfAttack.push([attacker.x+(i+1)*direction[0], attacker.y+(i+1)*direction[1]]) 
          break;
        }
      }
      
      return lineOfAttack
    }

    doubleCheckFilterKingMoves(king: Piece): void {
      // When the king is in double check, no other piece can move. The king may only move out of the way.
      this.getListOfPiecesFromBoard().forEach(piece => {
        if (piece.symbol === "K") return;
        piece.legalMoves = [];
      })

      king.legalMoves = king.legalMoves.filter(kingMove => {
        return !this.listOfOpponentMarkedSquares.some(square => kingMove[0] === square[0] && kingMove[1] === square[1])   
      })
    }

    filterPieceMovesIfInCheck(piece: Piece): void {
      if (!this.check) return;

      // Limit movement of all pieces to the line of attack. Aka only let pieces block the check.
      const lineOfAttack = this.getLineOfAttack();


      if (this.doubleCheck) {
        this.doubleCheckFilterKingMoves(piece);
      }
      else {
        this.getListOfPiecesFromBoard().forEach(piece => {
          if (piece.symbol === "K") return;
          if (this.kingAttacker?.symbol === "N" || this.kingAttacker?.symbol === "P") {  // Special case for knights and pawns.
            piece.legalMoves = piece.legalMoves.filter(pieceMove => {
              return pieceMove[0] === this.kingAttacker?.x && pieceMove[1] === this.kingAttacker?.y
            })
          }
          else {
            piece.legalMoves = piece.legalMoves.filter(pieceMove => {
              const adjustedLineOfAttack = lineOfAttack.slice(0, lineOfAttack.length-1) // Remove the last square from the line of attack. This is the square beyond the king.
              return adjustedLineOfAttack.some(square => pieceMove[0] === square[0] && pieceMove[1] === square[1])   
            })}
          })
        }

      // Allow the king to move OUT of the line of attack. Opposite of all other pieces.
      piece.legalMoves = piece.legalMoves.filter(kingMove => {
        if (kingMove[0] === this.kingAttacker?.x && kingMove[1] === this.kingAttacker?.y) return true; // If the king can capture the attacker, then allow it to do so.
        return !lineOfAttack.some(square => kingMove[0] === square[0] && kingMove[1] === square[1])   
      })


    }

    // 
    filterPinnedPiecesMoves(): void {
      // Based on the pinned pieces, we can limit the movement of the pinned pieces.

      if (this.absolutePinnedPieces.length === 0) return;

      this.absolutePinnedPieces.forEach(pinnedPiece => {
        pinnedPiece.legalMoves = pinnedPiece.legalMoves.filter(square => {
          const [dx, dy] = pinnedPiece.pinAngle!;

          for (let dir = -1; dir <= 1; dir += 2) { // -1 = towards king, 1 = towards attacker
            for (let i = 1; i <= 7; i++) {
              const x = pinnedPiece.x + i * dx * dir;
              const y = pinnedPiece.y + i * dy * dir;

              if (x < 0 || x > 7 || y < 0 || y > 7) break; // off-board

              if (square[0] === x && square[1] === y) return true;
            }
          }

          return false;
        });
      });
    }


    addCastlingMoves(king: Piece): void {
      if (this.check) return;

      const fenCastling = this.getCanCastleFromFen(this.fen);

      // Skip if neither castling right exists for this color
      if (king.white && !fenCastling.includes("K") && !fenCastling.includes("Q")) return;
      if (!king.white && !fenCastling.includes("k") && !fenCastling.includes("q")) return;


      // --- Queenside / Left castling ---
      const row = king.white ? 0 : 7;

      const leftRook = this.chessBoard[0][row];
      const emptyLaneLeft = this.chessBoard[1][row] === null && this.chessBoard[2][row] === null && this.chessBoard[3][row] === null;
      const leftSquares = [[2, row], [3, row]];
      const leftBlocked = this.listOfOpponentMarkedSquares.some(op => leftSquares.some(sq => op[0] === sq[0] && op[1] === sq[1]));

      const canCastleLeft = king.white ? fenCastling.includes("Q") : fenCastling.includes("q");
      if (!leftBlocked && leftRook && leftRook.symbol.toLowerCase() === "r" && emptyLaneLeft && canCastleLeft) {
          king.legalMoves.push([2, row]);
          // king.legalMoves.push([6, row], [7, row]);
      }

      // --- Kingside / Right castling ---
      const rightRook = this.chessBoard[7][row];
      const emptyLaneRight = this.chessBoard[5][row] === null && this.chessBoard[6][row] === null;
      const rightSquares = [[6, row], [5, row]];
      const rightBlocked = this.listOfOpponentMarkedSquares.some(op => rightSquares.some(sq => op[0] === sq[0] && op[1] === sq[1]));


      const canCastleRight = king.white ? fenCastling.includes("K") : fenCastling.includes("k");
      if (!rightBlocked && rightRook && rightRook.symbol.toLowerCase() === "r" && emptyLaneRight && canCastleRight) {
          king.legalMoves.push([6, row]);
          // king.legalMoves.push([6, row], [7, row]);
      }
    }

    checkIfInsuffientMaterial(): void {
      if (this.draw) return;

      // Check for insufficient material.
      let whiteOverallMaterial = 0;
      let blackOverallMaterial = 0;


      let existPawn = false;
      this.getListOfPiecesFromBoard().forEach(piece => {
        if (piece.symbol === "K" || !piece.value) return;

        piece.white ? whiteOverallMaterial += piece.value : blackOverallMaterial += piece.value;
        if (piece.symbol === "P") existPawn = true;

        if (whiteOverallMaterial > 3 && blackOverallMaterial > 3) return;
      })

      if ((whiteOverallMaterial > 3 && blackOverallMaterial > 3) || existPawn) return;

      console.log("Insufficient material detected.");
      this.draw = true;
    }

    checkIf50MoveRule(): void {
      if (this.draw) return;

      if (this.getHalfMoveClockFromFen(this.fen) >= 50) {console.log("50MoveRule"); this.draw = true;}

    }


    checkThreefoldRepetition(): void {
      // Use full FEN expcept for halfmove clock and fullmove number.
      const positionKey = this.fen.split(" ").slice(0, 4).join(" ");

      if (!this.positionCounts) this.positionCounts = new Map<string, number>();

      const count = (this.positionCounts.get(positionKey) || 0) + 1;
      this.positionCounts.set(positionKey, count);

      if (count >= 5) {
        this.draw = true;
        this.threeFoldRepetition = true;
        console.log("Threefold repetition detected.");
      }
    }


    checkForCheckMateOrDraw(): void {

      const hasLegalMoves = this.getListOfPiecesFromBoard().some(
        piece => piece.legalMoves.length > 0 && piece.white === this.whoseTurn()
      );
      
      if (hasLegalMoves) return;

      if (hasLegalMoves === false && this.check) {
        this.checkMate = true;
        this.winner = !this.whoseTurn();
      }
      if (hasLegalMoves === false && !this.check) {
        this.draw = true;
        //console.log("Stalemate")
      }

      this.checkIfInsuffientMaterial();
      this.checkIf50MoveRule();

      this.updatePGNWithResult();


    }

    

  
    /**
     * Calculates the legal moves for each piece in the chessboard. This effects the legalMoves array for each piece.
     */
    calcLegalMoves(): void{
      this.listOfOpponentMarkedSquares = [];
      this.mapOfOpponentMarkedSquares = new Map<Piece, Square[]>();
      this.absolutePinnedPieces = [];
      this.kingAttacker = null;

      const kingPosition = this.whoseTurn() ? this.whiteKingPosition : this.blackKingPosition
      
      const king = this.chessBoard[kingPosition[0]][kingPosition[1]] as Piece
      
      if (!king || king.symbol !== "K") {
        console.log("King position:", kingPosition);
        console.log(this.fen);
        throw new Error("King not found on the board.");
      }

      this.calcAbsolutePinnedPieces(king)

      this.calcPseudoLegalMoves();

      this.filterOutOfBoundsMoves();
      this.markOpponentSquares(); // We do this before filtering moves where the piece would capture its own pieces. This is important.
      this.filterCaptureOwnPiecesMoves();

      this.checkIfPlayerIsInCheck(); // Fix this position.
      this.filterKingMovesBasedOnOpponentMarkedSquares(king)
      this.filterPieceMovesIfInCheck(king);
      this.filterPinnedPiecesMoves();

      this.addCastlingMoves(king);

    }


  /**
   * Determines if disambiguation is needed for a move and returns the appropriate disambiguation string.
   * @param pieceMoved The piece being moved
   * @param destination The destination square
   * @returns Disambiguation string (file, rank, or both) or empty string if not needed
   */
  getDisambiguation(pieceMoved: Piece, destination: Square, originalPieceLocation: Square): string {
    if (pieceMoved.symbol === "K") return ""; // Kings don't need disambiguation.
    
    // Find all pieces of the same type and color that can move to the destination
    const sameTypePieces = this.getListOfPiecesFromBoard().filter(piece => 
      piece.symbol === pieceMoved.symbol && 
      piece.white === pieceMoved.white && 
      !(piece.x === destination[0] && piece.y === destination[1]) && 
      piece.legalMoves.some(move => move[0] === destination[0] && move[1] === destination[1])
    );

    
    // If no other piece can make this move, no disambiguation needed
    if (sameTypePieces.length <= 0) return "";

    // Check if pieces are on different files
    const differentFiles = sameTypePieces.some(piece => piece.x !== originalPieceLocation[0]);
    
    // Check if pieces are on different ranks
    const differentRanks = sameTypePieces.some(piece => piece.y !== originalPieceLocation[1]);
    
    // File (a–h) and rank (1–8)
    const fileRank = this.squareToAlgebraicNotation([pieceMoved.x, pieceMoved.y]);

    const file = fileRank.charAt(0);
    const rank = fileRank.charAt(1);

    // Special handling for knights. Prefer file when both differ according to Chess.com.
    if (pieceMoved.symbol === "N") {
      if (differentFiles && differentRanks) return file;
      if (differentRanks) return rank;
      if (differentFiles) return file;
      return "";
    }

    // For other pieces, include both if necessary
    let disambiguation = "";
    if (differentFiles) disambiguation += file;
    if (differentRanks) disambiguation += rank;

    return disambiguation;
  }

  addNotation(square: Square, pieceMoved: Piece, capture: boolean, castle: boolean | null, originalPieceLocation: Square, promotionPieceType?: string): void {
    if (this.lightWeightMode) return;

    const actualTurn = this.getFullMoveNumberFromFen(this.fen);

    const pieceFile = this.getFileFromX(originalPieceLocation[0]);

    // Converts a move type to a notation.
    const fileNotation = this.getFileFromX(square[0]);

    if (this.whoseTurn()){ // White's turn
      this.PGN += actualTurn + ". "
    }
  
    if (castle === true) this.PGN += "O-O"
    else if (castle === false) this.PGN += "O-O-O"
    else {
      if (pieceMoved.symbol === "P"){
        if (capture){
          this.PGN += pieceFile
        }
      }
      else {
        this.PGN += pieceMoved.symbol // Piece that is moving.
        
        // Add disambiguation if needed
        const disambiguation = this.getDisambiguation(pieceMoved, square, originalPieceLocation);
        if (disambiguation) {
          this.PGN += disambiguation;
        }
      }
      
      if (capture) this.PGN += "x"

      this.PGN += fileNotation+(square[1]+1 ) // This is the location for the move.
    }

    if (promotionPieceType) this.PGN += "=" + promotionPieceType;

    if (this.check || this.doubleCheck) this.PGN += "+"

    this.PGN += " "

  }

  updatePGNWithResult(): void {
    if (this.lightWeightMode) return;

    if (this.checkMate){
      this.PGN = this.PGN.trim(); // Remove trailing space
      this.PGN += "# "
      this.PGN += this.whoseTurn() ? "0-1" : "1-0"
    }
    else if (this.draw){
      this.PGN += "1/2-1/2"
    }
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

    isInCheckAfterEnPassant(piece: Piece, move: Square): boolean {
      const captureSquare = this.algebraicNotationToSquare(this.getEnPassantFromFen(this.fen));
      //const capturedPiece = this.chessBoard[captureSquare[0]][captureSquare[1]];
      const row = piece.white ? 4 : 3;

      // Simulate the en passant move
      const clonedGame = this.getClonedGame();

      /* console.log(
        "Destination:", clonedGame.chessBoard[move[0]][move[1]],
        "Original piece square:", clonedGame.chessBoard[piece.x][piece.y],
        "Captured pawn square:", clonedGame.chessBoard[captureSquare[0]][row]
      ); */
      clonedGame.chessBoard[move[0]][move[1]] = clonedGame.chessBoard[piece.x][piece.y];
      clonedGame.chessBoard[piece.x][piece.y] = null;
      clonedGame.chessBoard[captureSquare[0]][row] = null;

      clonedGame.listOfOpponentMarkedSquares = [];
      clonedGame.mapOfOpponentMarkedSquares = new Map<Piece, Square[]>();
      clonedGame.absolutePinnedPieces = [];


      clonedGame.clone = true; // Mark as clone to avoid infinite recursion.
      clonedGame.whiteKingPosition = this.whiteKingPosition;
      clonedGame.blackKingPosition = this.blackKingPosition;
      //clonedGame.updateTurnCount();
      clonedGame.calcPseudoLegalMoves();
      clonedGame.filterOutOfBoundsMoves();
      clonedGame.markOpponentSquares(); 
      clonedGame.filterCaptureOwnPiecesMoves();
      clonedGame.checkIfPlayerIsInCheck();

      //console.log(clonedGame.listOfOpponentMarkedSquares);
      
      // Check if the king is in check after the simulated move
      const inCheck = clonedGame.getCheck();

      return inCheck;
    }
  
    
    getClonedGame(): ChessGame {
    const cloned = new ChessGame();

    // Deep copy each piece so no shared references exist
    cloned.chessBoard = this.chessBoard.map(row =>
      row.map(piece => piece ? { ...piece, legalMoves: [...piece.legalMoves] } : null)
    );

    // Deep copy king positions
    cloned.whiteKingPosition = [...this.whiteKingPosition];
    cloned.blackKingPosition = [...this.blackKingPosition];

    // Copy turn and metadata
    cloned.fen = this.fen;

    return cloned;
  }

    
}