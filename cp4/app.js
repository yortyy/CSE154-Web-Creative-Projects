/**
 * This file, index.js, contains the server-side code for Lebron's Legacy, a basketball simulation
 * game featuring LeBron James. The simulation allows users to select a version of LeBron James
 * (Heat, Cavs, or Lakers) and simulate shooting basketball shots based on LeBron's shooting
 * attributes.
 */

"use strict";
const LEBRON_TYPE = {
  'heat': {
    'type': 'heat',
    'attributes': {
      'rim': 0.756,
      '3-10': 0.455,
      '10-16': 0.390,
      '16-3pt': 0.444,
      '3pt': 0.397
    }
  },
  'cavs': {
    'type': 'cavs',
    'attributes': {
      'rim': 0.722,
      '3-10': 0.357,
      '10-16': 0.335,
      '16-3pt': 0.414,
      '3pt': 0.316
    }
  },
  'lakers': {
    'type': 'lakers',
    'attributes': {
      'rim': 0.758,
      '3-10': 0.479,
      '10-16': 0.336,
      '16-3pt': 0.370,
      '3pt': 0.406
    }
  }
};
const PERC_RNDER = 100;
const pixelsToFeet = 24 / 280;
const hoopLocation = [375, 505];
const SHOT_DISTANCES = {
  'rim': 0,
  '3-10': 3,
  '10-16': 10,
  '16-3pt': 16,
  '3pt': 24
};
const SHOT_TYPES = ['3pt', '16-3pt', '10-16', '3-10', 'rim'];
const SHOT_TEXT = {
  'rim': "LeBron dunks with no regard for human life! 🔥",
  '3-10': "LeBron knocks down the shot in the post! 🏀",
  '10-16': "LeBron knocks down the mid-range shot! 🏀",
  '16-3pt': "LeBron knocks down the long mid-range shot! 🏀",
  '3pt': "LeBron knocks down the triple! 🏀🔥",
  'miss': "LeBron bricks the shot! 🧱"
};
const SERVER_ERROR_CODE = 500;
const CLIENT_ERROR_CODE = 400;

const express = require('express');
const app = express();
const multer = require('multer');
const fs = require('fs').promises;
app.use(multer().none());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get('/get/:type', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  res.type('JSON');
  let bronType = req.params.type;
  if (LEBRON_TYPE[bronType]) {
    res.send(LEBRON_TYPE[bronType]);
  } else {
    errorHandler(new Error("LeBron type not found."), res);
  }
});

app.post('/game/start', (req, res) => {
  let bronType = req.body.type;
  res.type('text');
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  let gameStatsJSON = fs.readFile('gamestats.json', 'utf8');
  gameStatsJSON
    .then(JSON.parse)
    .then(resp => {return startGame(resp, bronType);})
    .then(newGameId => res.send(newGameId))
    .catch(err => errorHandler(err, res));
});

app.post('/game/shoot', (req, res) => {
  res.type('text');
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  if (req.body.gameId && req.body.shotLocationX && req.body.shotLocationY) {
    let currentGameId = req.body.gameId;
    let shotLocation = [req.body.shotLocationX, req.body.shotLocationY];
    let distanceFromBasket = Math.floor(Math.sqrt(Math.pow(hoopLocation[0] - shotLocation[0], 2) +
                             Math.pow(hoopLocation[1] - shotLocation[1], 2)) * pixelsToFeet *
                             PERC_RNDER) / PERC_RNDER;
    let gameStatsJSON = fs.readFile('gamestats.json', 'utf8');
    gameStatsJSON
      .then(JSON.parse)
      .then(resp => {setShootStats(resp, res, currentGameId, shotLocation, distanceFromBasket);})
      .catch(err => {errorHandler(err, res);});
  } else {
    let errText = "Must send the Game ID, shot location X and shot location Y.";
    errorHandler(new Error(errText), res);
  }
});

app.get('/game/:gameId/stats', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  res.type('JSON');
  let currentGameId = req.params.gameId;
  let gameStatsJSON = fs.readFile('gamestats.json', 'utf8');
  gameStatsJSON
    .then(JSON.parse)
    .then(resp => {getGameStats(resp, currentGameId, res);})
    .catch(err => errorHandler(err, res));

});

/**
 * Starts a new game by initializing game statistics and storing them in a JSON file.
 * @param {JSON} gameStatsJSON - The JSON object containing current game statistics.
 * @param {string} bronType - The type of LeBron for the new game.
 * @returns {Promise<string>} - A promise that resolves to the ID of the new game.
 */
function startGame(gameStatsJSON, bronType) {
  return new Promise((resolve, reject) => {
    if (LEBRON_TYPE[bronType]) {
      let newGameId = (gameStatsJSON["gameIds"].length) + "";
      gameStatsJSON["gameIds"].push(newGameId);
      gameStatsJSON["gameStats"][newGameId] = {"type": bronType, "FGs": 0, "FGM": 0,
        "3PM": 0, "3PA": 0};
      let writePromise = fs.writeFile('gamestats.json', JSON.stringify(gameStatsJSON));
      writePromise
        .then(resolve(newGameId))
        .catch(reject(new Error("Write failed.")));
    } else {
      reject(new Error("LeBron type not found."));
    }
  });
}

/**
 * Evaluates a shot and updates game statistics based on the outcome of the shot, then
 * sends the corresponding response.
 * @param {JSON} gameStatsJSON - JSON object containing game statistics.
 * @param {Response} res - The response object to send the shot outcome.
 * @param {string} currentGameId - The ID of the current game session.
 * @param {number[]} shotLocation - The x and y coordinates of the shot location.
 * @param {number} distanceFromBasket - The distance from the basket in feet.
 */
function setShootStats(gameStatsJSON, res, currentGameId, shotLocation, distanceFromBasket) {
  let currentType = gameStatsJSON["gameStats"][currentGameId]["type"];
  let shotMadeType;
  for (let i = 0; i < SHOT_TYPES.length; i++) {
    if (distanceFromBasket >= SHOT_DISTANCES[SHOT_TYPES[i]]) {
      if (Math.random() < LEBRON_TYPE[currentType]["attributes"][SHOT_TYPES[i]]) {
        shotMadeType = SHOT_TYPES[i];
      } else if (SHOT_TYPES[i] === "3pt") {
        gameStatsJSON["gameStats"][currentGameId]["3PA"] += 1;
      }
      i = SHOT_TYPES.length;
    }
  }
  let resolveText = SHOT_TEXT[shotMadeType];
  if (shotMadeType) {
    if (shotMadeType === "3pt") {
      gameStatsJSON["gameStats"][currentGameId]["3PM"] += 1;
      gameStatsJSON["gameStats"][currentGameId]["3PA"] += 1;
    }
    gameStatsJSON["gameStats"][currentGameId]["FGs"] += 1;
    gameStatsJSON["gameStats"][currentGameId]["FGM"] += 1;
  } else {
    gameStatsJSON["gameStats"][currentGameId]["FGs"] += 1;
    resolveText = SHOT_TEXT["miss"];
  }
  let writePromise = fs.writeFile('gamestats.json', JSON.stringify(gameStatsJSON));
  writePromise
    .then(() => res.send(resolveText))
    .catch(() => {errorHandler(new Error("Write failed"), res);});
}

/**
 * Gets the game statistics for the requested game and sends them as a response.
 * If the game session ID is not found, it sends an error response.
 * @param {JSON} gameStatsJSON - JSON object containing game statistics.
 * @param {string} currentGameId - The ID of the game session to retrieve statistics for.
 * @param {Response} res - The response object to send the game statistics or error response.
 */
function getGameStats(gameStatsJSON, currentGameId, res) {
  if (gameStatsJSON["gameStats"][currentGameId]) {
    res.send(gameStatsJSON["gameStats"][currentGameId]);
  } else {
    errorHandler(new Error("Game ID not found."), res);
  }
}

/**
 * Handles errors according to the given error object. Sends a text message containing details
 * of the error. Also determines type of error.
 * @param {Error} err - The error object representing the error that occurred.
 * @param {Response} res - The response object to send the error response.
 */
function errorHandler(err, res) {
  let errText;
  let errCode;
  if (err.code === 'ENOENT') {
    errText = "File on server can't be found.\nThere seems to be an issue with the server!";
    errCode = SERVER_ERROR_CODE;
  } else if (err[0] === "L" || err[0] === "M" || err[0] === "G") {
    errText = err + "\nThere seems to be an issue with the client!";
    errCode = CLIENT_ERROR_CODE;
  } else if (err[0] === "W") {
    errText = err + "\nThere seems to be an issue with the server!";
    errCode = SERVER_ERROR_CODE;
  }
  console.error(err);
  res.status(errCode).send(errText);
}

app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT);