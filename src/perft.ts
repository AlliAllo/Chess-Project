// perft.test.ts
import { ChessGame } from "./Classes/ChessGame";
require.extensions['.png'] = () => {};

function squareToAlgebraicNotation(x: number, y: number): string {
  const file = String.fromCharCode("a".charCodeAt(0) + x);
  const rank = (y + 1).toString();
  return file + rank;
}

function perft(game: ChessGame, depth: number, rootDepth = depth): number {
  if (depth === 0) return 1;

  let nodes = 0;
  const pieces = game.getListOfPiecesFromBoard();

  for (const piece of pieces) {
    if (piece.white !== game.whoseTurn()) continue;

    for (const move of piece.legalMoves) {
      // Detect if move is a pawn promotion
      const isPromotion =
        piece.symbol === "P" && (move[1] === 0 || move[1] === 7);

      if (isPromotion) {
        // Branch out for all 4 promotion types
        for (const promo of ["Q", "R", "B", "N"]) {
          const newGame = game.getClonedGame();
          newGame.calcLegalMoves();
          const pieceCopy = newGame.getBoard()[piece.x][piece.y];
          if (!pieceCopy) continue;

          // Make promotion move explicitly
          newGame.makeMove(pieceCopy, move, { computerMove: true, promotionType: promo });

          const childNodes = perft(newGame, depth - 1, rootDepth);
          nodes += childNodes;

          // Print debug info at root level
          if (depth === rootDepth && childNodes !== 1) {
            const moveStr = `${squareToAlgebraicNotation(piece.x, piece.y)}${squareToAlgebraicNotation(move[0], move[1])}${promo.toLowerCase()}`;
            console.log(`${moveStr}: ${childNodes}`);
          }
        }
      } else {
        // Regular move
        const newGame = game.getClonedGame();
        newGame.calcLegalMoves();
        const pieceCopy = newGame.getBoard()[piece.x][piece.y];
        if (!pieceCopy) continue;

        if (newGame.makeMove(pieceCopy, move, { computerMove: true })) {

          const childNodes = perft(newGame, depth - 1, rootDepth);
          nodes += childNodes;

          // Print debug info at root level
          /* if (depth === rootDepth && childNodes !== 1) {
            const moveStr = `${squareToAlgebraicNotation(piece.x, piece.y)}${squareToAlgebraicNotation(move[0], move[1])}`;
            console.log(`${moveStr}: ${childNodes}`);
          } */  
        }
      }
    }
  }

  return nodes;
}

// === Example usage ===

//const NODES = 4; // depth

//const fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - "; 
//const fen = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1 "; 
//const fen = "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1"; 
//const fen = "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8  "; 
// const fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - "; 
// const fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - "; 
// const fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - "; 

const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const pos2 = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - ";
const pos3 = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1 ";
const pos4 = "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1";
const pos5 = "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8 ";
const pos6 = "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10";

type TestPosition = {
  fen: string;
  expectedNodes: number[];
  depth: number;
};


const depth = 5;
//const pos4 = "r6r/p1pkqpb1/bn2pnp1/3P4/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQ - 0 2"
const testPositions: TestPosition[] = [
  //{ fen: defaultFen, expectedNodes: [20, 400, 8902, 197281, 4865609], depth: depth },
  { fen: pos2, expectedNodes: [48, 2039, 97862, 4085603, 193690690], depth: depth },
  { fen: pos3, expectedNodes: [14, 191, 2812, 43238, 674624], depth: depth },
  { fen: pos4, expectedNodes: [6, 264, 9467, 422333, 15833292], depth: depth },
  { fen: pos5, expectedNodes: [44,  1486 , 62379, 2103487, 89941194], depth: depth },
  { fen: pos6, expectedNodes: [46, 2079, 89890, 3894594, 164075551 ], depth: depth },
];

// Decide which tests to run
//const testsToRun = testPositions; // Run all tests
const testsToRun = [testPositions[2]];

const doAllDepths = true;

let totalFails = 0; 
console.time("Running perft tests...");

for (const { fen, expectedNodes, depth } of testsToRun) {
  const game = new ChessGame({ fen, lightWeightMode: true });
  let fails = 0;
  for (let d = depth; d > 0; d--) {
    console.time(`perft depth ${d}`);
    const nodes = perft(game, d);
    console.timeEnd(`perft depth ${d}`);
    const expected = expectedNodes[d - 1];
    if (nodes !== expected) fails++;
    console.log(`FEN: ${fen} | Depth: ${d} | Nodes: ${nodes} | Expected: ${expected} | ${nodes === expected ? "PASS" : "FAIL"}`
    );
    if (!doAllDepths) break;
  }
  if (fails === 0) {
    console.log(`All tests passed for FEN: ${fen}`);
  } else {
    console.log(`${fails} tests failed for FEN: ${fen}`);
  }
  console.log("--------------------------------------------------");
  totalFails += fails;
}
console.timeEnd("Perft tests completed.");
console.log("Fails:" + totalFails);

