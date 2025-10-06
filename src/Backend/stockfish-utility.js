const { spawn } = require('child_process');
const path = require('path');

function ask(fen, elo) {
    return new Promise((resolve, reject) => {
        const stockfishPath = path.join(__dirname, '../stockfish/stockfish_app.exe');
        const stockfish = spawn(stockfishPath);

        let stockfishOutput = '';

        stockfish.stdout.on('data', (data) => {
            stockfishOutput += data.toString();

            const lines = stockfishOutput.split('\n');
            const bestMoveLine = lines.find(line => line.startsWith('bestmove'));
            const bestMove = bestMoveLine ? bestMoveLine.split(' ')[1] : null;
            
            if (bestMove !== null) {
                stockfish.kill();
                // Resolve the promise with the best move
                resolve(bestMove);
            }
        });

        stockfish.stderr.on('data', (data) => {
            console.error(`Stockfish error: ${data}`);
            reject(data.toString());
        });

        stockfish.stdin.write(`position fen ${fen}\n`);

        // Set the difficulty of the stockfish engine. (Anything below 1320 requires some adjustments to the "skill" option)
        if (elo < 1320) {
            const skill = Math.round((elo / 1320) * 5); 
            stockfish.stdin.write(`setoption name Skill Level value ${skill}\n`);
        } else {
            stockfish.stdin.write('setoption name UCI_LimitStrength value true\n');
            stockfish.stdin.write(`setoption name UCI_Elo value ${elo}\n`);
        }

        stockfish.stdin.write(`position fen ${fen}\n`);
        stockfish.stdin.write('go movetime 100\n'); // 100 milliseconds
         

                
    });
}

module.exports = { ask };