const express         = require('express');
const PORT            = process.env.PORT || 5000;

const LichessApi      = require('./api/lichess-api');
const StockFishPlayer = require('./bots/stockfish-player');
const ShallowRedBot   = require('./bots/shallow-red-bot');

const token           = process.env.API_TOKEN;

/**
 * Start a ShallowRedBot (lichess account defined by API_TOKEN) that listens for challenges
 * and spawns games for unrated challenges. A player object must be supplied that can
 * produce the next move to play given the previous moves.
 * 
 * Token can be created on BOT accounts at https://lichess.org/account/oauth/token/create
 * Put the token in the shell environment with
 * 
 * export API_TOKEN=xxxxxxxxxxxxxx
 * yarn install
 * yarn start
 * 
 * TODO: Change yarn to npm and unrated to rated
 * 
 */

    async function startBot(token, player) {
        if (token) {
            const robot = new ShallowRedBot(new LichessApi(token), player);
            const username = (await robot.start()).data.username;
            return `<a href="https://lichess.org/@/${username}">${username}</a> on lichess.</h1><br/>`;
        }
    }

    async function begin() {
        var links = "<h1>Challenge:</h1><br/>";

        links += await startBot(token, new StockFishPlayer());

        // heroku wakeup server (not necessary otherwise)

        express()
            .get("/", (req, res) => res.send(links))
            .listen(PORT, () => console.log(`Shallow Red Bot started and listening on ${PORT}`));
    }
  
  begin();
