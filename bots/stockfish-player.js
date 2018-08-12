const StockFishEngine = require("../engines/stockfish-engine");

/**
 * Get the moves from stockfish engine
 */
class StockfishPlayer {
    doNextMove(moves, callback) {
        // TODO: Integrate stockfish here
        if (moves !== undefined && moves.length > 0) {
            let lastMove = moves[moves.length - 1];
            this.engine.send(`makemove ${lastMove}`);
        }
        this.engine.send('go', callback);
    }

    getEngine() {
        return new StockFishEngine({
            initialized: () => {
                console.log("StockfishPlayer's engine initialized");
            }
        });
    }

    getReply(chat) {
        return "I am neither a human nor an AI";
    }
}

module.exports = StockfishPlayer;
