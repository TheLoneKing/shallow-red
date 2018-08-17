const StockFishEngine = require("../engines/stockfish-engine");

/**
 * Get the moves from stockfish engine
 */
class StockfishPlayer {
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
