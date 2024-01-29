const { spawn } = require('child_process');
const path = require('path');

function ask(fen, depth) {
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
                // Resolve the promise with the best move
                resolve(bestMove);
            }
        });

        stockfish.stderr.on('data', (data) => {
            console.error(`Stockfish error: ${data}`);
            reject(data.toString());
        });

        stockfish.stdin.write(`position fen ${fen}\n`);
        stockfish.stdin.write(`go depth ${depth}\n`);

        stockfish.kill();
    });
}

module.exports = { ask };