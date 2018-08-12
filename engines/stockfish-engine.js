const stockfish  = require("stockfish");
const _          = require("lodash");
let bestRegex    = /bestmove\s+(\S+)/;
let moveRegex    = /makemove\s+(\S+)/;

class StockfishEngine {
    constructor(options = {}, api) {
        let self = this;
        this.engine = stockfish();
        this.options = _.defaults(options, {
            depth: 10,
        });

        // Variables to manage state
        this.initializing = true;
        this.position = 'startpos';
        this.last_command;
        this.best_move;
        this.moves = [];

        this.api = api;
        this.gameId;

        // Initialize engine to UCI standard
        this.send('uci', () => {
            console.log('Stockfish Engine initialized');
        });

        // Parse output from Stockfish engine
        this.engine.onmessage = (line) => {
            console.log('Line: ' + line);

            // Check if we've just exited initialization, invoke initiliazation callback if so
            if (this.initializing && this.last_command === 'uci' && line.indexOf('uciok') > -1) {
                this.initializing = false;

                // If we have a regular command callback, invoke it and erase it
                if (_.isFunction(this.callback)) {
                    this.callback();
                    this.callback = null;
                }

                // If we have an initialization callback, invoke it
                if (_.isFunction(this.options.initialized)) {
                    console.log('Invoking initialization callback');
                    this.options.initialized();
                }
            } else if (this.isFinished(line)) { // If we've just finished an engine command
                console.log('Command finished!');
                
                if(_.isFunction(this.callback)) {
                    console.log('Executing the callback that came with the command');
                    this.callback(this.best_move);
                    this.callback = null;
                }
            }
        }
    }

    /**
     * Send a message to the Stockfish engine
     * @param {String} command The UCI-compatible command to feed the engine
     * @param {Function} callback (Optional) The callback to invoke upon completion
     */
    send(commmand, callback) {
        if (_.isFunction(callback)) {
            console.log('Setting command callback');
            this.callback = callback;
        } else if (!_.isFunction(callback) && this.callback) {
            console.log('No callback. Clearing callback from previous command');
            this.callback = null;
        }

        // In some cases, intercept command and extend with config settings
        if (_.contains(command, 'makemove')) { // Check if we're sending `makemove` command, handle specially
            const move = moveRegex.exec(command)[1];
            this.moves.push(move);
            command = `position ${this.position} moves ${this.moves.join(' ')}`;
        } else if (command === 'go') {
            command = `go depth ${this.options.depth}`;
        }

        console.log('Sending ' + command); // Output command to console
        this.last_command = command; // Save last command
        this.engine.postMessage(command); // Send command to engine

        // Handle special case of `position` command, immediately invoke callback
        if (command.indexOf('position ') === 0) {
            console.log('Invoking callback immediately for position change');
            this.parsePositionChange(command); // Parse position change, save state
            if (_.isFunction(callback)) {
                setTimeout(() => { // Workaround because this isn't exactly synchronous
                    callback();
                }, 100);
                this.callback = null;
            }
        }
    }

    /**
     * Find the next best move and make it
     * and send the best move to the game on lichess
     */
    findAndMakeBestMove() {
        let self = this;
        self.send('go', () => {
            self.send(`makemove ${self.best_move}`, () => {
                self.api.makeMove(self.gameId, self.best_move);
            });
        });
    }

    /**
     * Parse output from engine, check if command has finished
     * @param {String} line The engine output string to parse
     * @returns {Boolean}
     */
    isFinished(line) {
        if (this.last_command === 'd' && line.indexOf('Legal uci moves') > -1) {
            return true;
        } else if (this.last_command.indexOf('go depth') === 0 && line.indexOf('bestmove:') > -1) {
            return true;
        } else if (this.last_command === 'eval' && line.indexOf('Total Evaluation:') > -1) {
            return true;
        } else if (line.indexOf('bestmove') > -1) {
            let match = bestRegex.exec(line)[1];
            if (match) { // Parse the bestmove from engine output
                this.best_move = match;
                console.log('Best', match);
            }
            return true;
        } else {
            return false;
        }
    }

    /**
     * Parse the position change command to save FEN and individual moves
     * @param {String} command The command to parse
     */
    parsePositionChange(command) {
        if (!_.contains(command, 'moves')) { // If command doesn't have moves, just save position
            const fen = command.slice(9);
            console.log('Parsed position: ', fen);
            this.position = fen;
        } else {
            const moveIndex = command.indexOf('moves');
            const fen = command.slice(9, moveIndex);
            let moves = command.slice(moveIndex + 6);
            moves = moves.split(' ');
            console.log('Parsed position: ', fen);
            console.log('Parsed moves: ', moves);
            this.position = fen;
            this.moves = moves;
        }
    }

    /**
     * Set the depth the engine should search to
     * @param {Number} depth The depth to search to
     */
    setDepth(depth) {
        console.log(`Engine search depth changed to: ${depth}`);
        this.options.depth = depth;
    }

    /**
     * Set the current game id
     * @param {String} gameId The game id
     */
    setGameId(gameId) {
        this.gameId = gameId;
    }
}

module.exports = StockfishEngine;
