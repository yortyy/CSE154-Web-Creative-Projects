"use strict";

const express = require('express');
const app = express();

const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const multer = require('multer');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(multer().none());

(function init() {
  global._currentUser = undefined;
})();

const DEFAULT_FILTERS = {
  team_code: "",
  player: "",
  pos: ["PG", "SG", "SF", "PF", "C"],
  price: [0, 7000],
  pts: [0, 35],
  trb: [0, 14],
  ast: [0, 11],
};

const ACCENTED_PLAYER_MAP = {
  "Luka Doncic": "Luka Dončić",
  "Nikola Jokic": "Nikola Jokić",
  "Nikola Vucevic": "Nikola Vučević",
  "Dennis Schroder": "Dennis Schröder",
  "Bogdan Bogdanovic": "Bogdan Bogdanović",
  "Kristaps Porzingis": "Kristaps Porziņģis",
  "Jusuf Nurkic": "Jusuf Nurkić",
  "Bojan Bogdanovic": "Bojan Bogdanović",
  "Jonas Valanciunas": "Jonas Valančiūnas",
  "Vasilije Micic": "Vasilije Micić",
  "Nikola Jovic": "Nikola Jović",
  "Dario Saric": "Dario Šarić",
  "Davis Bertans": "Dāvis Bertāns",
  "Luka Samanic": "Luka Šamanić",
  "Moussa Diabate": "Moussa Diabaté",
  "Boban Marjanovic": "Boban Marjanović"
}

const ACCENTED_PLAYER_KEYS = Object.keys(ACCENTED_PLAYER_MAP);

const ACCENTS = ["c", "o", "n", "g", "u", "e", "s"];

const DEFAULT_FILTER_KEYS = Object.keys(DEFAULT_FILTERS);

/**
 * GET: Returns search results using the given search, sort and filter parameters.
 */
app.get("/search/:sortOrder", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  let sortOrder = req.params.sortOrder;
  let sortBy = req.query.sortBy;
  if(!sortBy) {
    sortBy = "player";
  }
  if((sortOrder !== "ASC" && sortOrder !== "DESC") || !DEFAULT_FILTER_KEYS.includes(sortBy)) {
    res.type("text").status(400).send("Sort order or sort by parameters may be incorrect.");
  } else {
    let filtersJSON;
    try {
      filtersJSON = await JSON.parse(req.query.filters);
      filtersJSON = fillMissingOrNullFilters(filtersJSON);
    } catch (err) {
      res.type("text").status(400).send("Filters parameter is unparseable.");
    }
    try {
      res.type("json");

      let db = await getDBConnection();
      let foundAccentPlayers = checkForAccents(filtersJSON["player"]);
      let accentSearch = "";
      for(let i = 0; i < foundAccentPlayers.length; i++) {
        accentSearch += "or m.player_name LIKE ? ";
      }
      let filters = getFiltersArray(filtersJSON, foundAccentPlayers);
      const query = "SELECT m.player_name, m.playerId, m.teamId, m.team_name, m.team_code, m.price, s.pos, s.age, s.pts, " +
                    "s.trb, s.ast, s.stl, s.blk FROM PlayerStatsRef s, PlayerMetaRef m WHERE s.player = m.player_name AND " +
                    "(m.player_name LIKE ? " + accentSearch + ") AND m.team_code LIKE ? AND (s.pos LIKE ? OR s.pos LIKE ? OR " +
                    "s.pos LIKE ? OR s.pos LIKE ? OR s.pos LIKE ?) AND m.price >= ? AND m.price " +
                    " <= ? AND s.pts >= ? AND s.pts <= ? AND s.trb >= ? AND s.trb <= ? AND s.ast " +
                    ">= ? AND s.ast <= ? ORDER BY " + sortBy + " " + sortOrder + ";";
      let result = await db.all(query, filters);
      res.send(result);
      await db.close();
    } catch(err) {
      console.error(err);
      res.type("text").status(500).send("An error occurred on the server. Try again later.");
    }
  }
});

/**
 * GET: Returns a single player's info using the player's playerId
 */
app.get("/player/:playerId", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  let playerId = req.params.playerId;
  try {
    let db = await getDBConnection();
    const query = "SELECT m.player_name, m.playerId, m.teamId, m.team_name, m.team_code, " +
                  "m.price, s.pos, s.age, s.pts, s.trb, s.ast, s.stl, s.blk, s.tov, s.pf, s.fg, " +
                  "s.fga, s.fg_, s.col_3p, s.col_3pa, s.col_3p_, s.ft, s.fta, s.ft_, b.height," +
                  "b.weight, b.college, b.country, b.draft_year, b.draft_pick, b.fun_fact FROM " +
                  "PlayerStatsRef s, PlayerMetaRef m, PlayerBioRef b WHERE s.player = m.player_name AND " +
                  "b.player_id = m.playerId AND m.playerId = ?;";
    let result = await db.get(query, playerId);
    await db.close();
    if(!result) {
      res.type("text")
        .status(400)
        .send("Could not find player \"" + playerId + ".\"");
    } else {
      res.type("json").send(result);
    }
  } catch(err) {
    console.error(err);
    res.type("text").status(500).send("An error occurred on the server. Try again later.");
  }
})

/**
 * POST: Creates a user with required body parameters: username, password, email
 */
app.post("/user/create", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  res.type("text");
  let username = req.body.username;
  let password = req.body.password;
  let email = req.body.email;
  if (username && password && email) {
    if(email.includes("@")) {
      try {
        let query = 'select * from users where username = ?'
        let db = await getUserDBConnection();
        let result = await db.all(query, username);
        if (result.length !== 0) {
          await db.close();
          res.status(400).send("Provided username is already taken.");
        } else {
          const insertQuery = "INSERT INTO users (username, password) VALUES (?, ?);";
          await db.run(insertQuery, [username, password]);
          await db.close();
          global._currentUser = username;
          res.send("Welcome to BALLER//BROWSER, " + username + ".");
        }
      } catch (error) {
        res.status(500).send("Server error occurred");
      }
    } else {
      res.status(400).send("Please provide a real email.");
    }
  } else {
    res.status(400).send("Please provide a password, email and username.");
  }
});

/**
 * POST: Login user with required body parameters: username, password
 */
app.post("/user/login", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    try {
      let query = 'select * from users where username = ? AND password = ?'
      let db = await getUserDBConnection();
      let result = await db.all(query, [username, password]);
      await db.close();
      if (result.length === 0) {
        res.type("text").status(500).send("Provided user is not found on server.");
      } else {
        global._currentUser = username;
        res.type("text").send("Welcome " + username + ", you successfully logged in.")
      }
    } catch (error) {
      res.type("text").status(500).send("Server error");
    }
  } else {
    res.type("text").status(400).send("Please provide both a password and username.");
  }
});

/**
 * POST: Logout user with required body parameter: username
 */
app.post("/user/logout", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  let username = req.body.username;
  if (username) {
    try {
      let query = 'select * from users where username = ?'
      let db = await getUserDBConnection();
      let result = await db.all(query, [username]);
      await db.close();
      if (result.length === 0) {
        res.type("text").status(500).send("Provided user is not found on server.");
      } else {
        global._currentUser = undefined;
        res.type("text").send("Successfully logged out user " + username +
                              ". The page should refresh soon");
      }
    } catch (error) {
      res.type("text").status(500).send("Server error");
    }
  } else {
    res.type("text").status(400).send("Please provide a user that will be logged out.");
  }
});

/**
 * POST: Adds a lineup to the next free spot of the user with required body parameters: teamString
 */
app.post("/lineup/add", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  let teamString = req.body.teamString;
  res.type("text");
  if(!global._currentUser) {
    res.status(400).send("No user logged in");
  } else if (teamString) {
    try {
      // make sure
      let userQuery = 'select * from users where username = ?'
      let db = await getUserDBConnection();
      let userresult = await db.all(userQuery, [global._currentUser]);
      if (userresult.length === 0) {
        await db.close();
        res.status(500).send("Provided user is not found on server.");
      } else {

        // find an open lineup column for this user
        let userRow = userresult[0];
        let lineupNum = findEmptyLineup(userRow);

        // (as per spec) success or fail transaction randomly
        let coinflip = Math.random() > 0.5 ? true : false;
        if (coinflip) {
          lineupNum = -1;
        }

        if (lineupNum > 0) {
          let lineup = "lineup" + lineupNum;
          let updateQuery = "update users set " + lineup + " = ? where username = ?";
          let updateresult = await db.run(updateQuery, [teamString, global._currentUser]);
          // update user history
          let confNum = await confirmationNumber();
          let playerIdsArr = teamString.split(",");

          let historyObj = {
            "confirmationNum": confNum,
            "players": playerIdsArr
          }

          // update user's order_history column
          let oldOrderHistStr = userRow["order_history"];
          let newOrderHistStr = "";
          if (oldOrderHistStr === null) {
            // if null, create a new array for history objects
            let orderHistArr = [historyObj];
            newOrderHistStr = JSON.stringify(orderHistArr);
          } else {
            // else append to the existing array
            let norderHistArr = JSON.parse(oldOrderHistStr);
            norderHistArr.push(historyObj);
            newOrderHistStr = JSON.stringify(norderHistArr);
          }

          let updateQueryOrderHistory = "update users set order_history = ? where username = ?";
          let updateresultOrderHistory = await db.run(updateQueryOrderHistory, [newOrderHistStr, global._currentUser]);

          await db.close();
          res.type("text").send("Successfully purchased players and added lineup to slot " + lineupNum + ". \n Your confirmation number for this transaction is " + confNum + ".");

        } else if (lineupNum === -1) {
          await db.close();
          res.type("text").status(400).send("Man, no other way to tell you this: you are broke! Come back later when you got the dough. Then you can have the players.");
        } else {
          await db.close();
          res.status(400).send("Not enough storage to add this lineup (Max 3). Please delete a team to make room.");
        }
      }
    } catch (error) {
      console.error(error)
      res.status(500).send("Server error");
    }
  } else {
    res.status(400).send("Please provide a lineup.");
  }
});

/**
 * GET: Gets the specified lineup of the user with required body parameters: lineupNumber
 */
app.get("/lineup/get/:lineupNumber", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  let lineupNumber = req.params.lineupNumber;
  if(!global._currentUser) {
    res.type("text").status(400).send("No user logged in");
  } else if (!lineupNumber || (lineupNumber != 1 && lineupNumber != 2 && lineupNumber != 3)) {
    res.type("text").status(400).send("Please provide a lineup number 1-3.");
  } else {
    try {
      let userQuery = 'select * from users where username = ?'
      let db = await getUserDBConnection();
      let userresult = await db.get(userQuery, [global._currentUser]);
      await db.close();
      if (userresult.length === 0) {
        res.type("text").status(400).send("Provided user is not found on server.");
      } else {
        let userLineup = userresult["lineup" + lineupNumber];
        if(userLineup) {
          res.type("json").send(userLineup.split(","));
        } else {
          res.type("text").status(400).send("Lineup " + lineupNumber + " is empty.");
        }
      }
    } catch (error) {
      console.error(error);
      res.type("text").status(500).send("Server error");
    }
  }
});

/**
 * POST: Deletes the specified lineup with required body parameters: lineupNumber
 */
app.post("/lineup/delete", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  let lineupNumber = req.body.lineupNumber;
  if(!global._currentUser) {
    res.type("text").status(400).send("No user logged in");
  } else if (!lineupNumber || (lineupNumber != 1 && lineupNumber != 2 && lineupNumber != 3)) {
    res.type("text").status(400).send("Please provide a lineup number 1-3.");
  } else {
    try {
      // sql injection should be safe by checking if lineupNumber is 1,2 or 3.
      let userQuery = "UPDATE users SET lineup" + lineupNumber + " = NULL WHERE username = ?;"
      let db = await getUserDBConnection();
      await db.run(userQuery, global._currentUser);
      res.type("text").send("Successfully deleted lineup " + lineupNumber + ".");
    } catch (error) {
      res.type("text").status(500).send("Server error");
    }
  }
});

/**
 * GET: Returns the order history of the user.
 */
app.get("/user/orderhistory", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yortyy.github.io');
  if(!global._currentUser) {
    res.type("text").status(400).send("No user logged in");
  } else {
    try {
      const historyQuery = 'select order_history from users where username = ?'
      let db = await getUserDBConnection();
      let result = await db.get(historyQuery, global._currentUser);
      await db.close();
      if(result["order_history"] !== null) {
        res.type("json").send(JSON.parse(result["order_history"]));
      } else {
        res.type("text").status(400).send("Order history is empty! Buy something!");
      }
    } catch (error) {
      console.error(error)
      res.type("text").status(500).send("Server error");
    }
  }
});

/**
 * Generates a unique confirmation number based on existing order history and the date.
 *
 * @returns {Number} The generated confirmation number.
 */
async function confirmationNumber() {
  const confirmationsQuery = 'select order_history from users where order_history IS NOT NULL'
  let db = await getUserDBConnection();
  let result = await db.all(confirmationsQuery);
  let confirmationNums = [];
  for(let i = 0; i < result.length; i++) {
    let confirmation = JSON.parse(result[i]["order_history"]);
    confirmationNums.push(confirmation["confirmationNum"]);
  }
  let newConfNum = Date.now() + Math.floor(Math.random() * 99999);
  while (confirmationNums.includes(newConfNum)) {
    newConfNum = Date.now() + Math.floor(Math.random() * 99999);
  }
  db.close();
  return newConfNum;
}

/**
 * Given a user row, finds a null column to add a new lineup to.
 * @param {Object} userRow The user row object from the database.
 * @returns {Number} The index of the null column or undefined if no null column is found.
 */
function findEmptyLineup(userRow) {
  for (let i = 1; i < 4; i++) {
    let currentRow = userRow["lineup" + i];
    if (currentRow === null) {
      return i;
    }
  }
  return undefined;
}

/**
 * Gets the exact user row of the given user. Returns this object.
 * @param {String} username exact username
 * @returns {Object} object if user is found, otherwise undefined
 */
async function getUserRow(username) {
  let userQuery = 'select * from users where username = ?'
  let db = await getUserDBConnection();
  let userresult = await db.all(userQuery, [username]);
  if (userresult.length > 0) {
    let userRow = userresult[0];
    return userRow;
  } else {
    return undefined;
  }
}

/**
 * Establishes a database connection to a database and returns the database object.
 * Any errors that occur during connection should be caught in the function
 * that calls this one.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'ballerbrowser.db',
    driver: sqlite3.Database
  });
  return db;
}

/**
 * Checks if the text has any characters that could contain accents on player names. If the text
 * contains possible accented characters (e, c, etc.), the map with accented names is searched for
 * and the found names that include the given text are returned.
 * @param {String} text - Text to search players for.
 * @returns {String[]} - String array of found names.
 */
function checkForAccents(text) {
  text = text.toLowerCase();
  let accents = false;
  for(let i = 0; i < ACCENTS.length; i++) {
    if(text.includes(ACCENTS[i])) {
      accents = true;
      i = ACCENTS.length;
    }
  }
  if(!accents) {
    return [];
  }
  let foundNames = [];
  for(let i = 0; i < ACCENTED_PLAYER_KEYS.length; i++) {
    if(ACCENTED_PLAYER_KEYS[i].toLowerCase().includes(text)) {
      foundNames.push(ACCENTED_PLAYER_MAP[ACCENTED_PLAYER_KEYS[i]]);
    }
  }
  return foundNames;
}

function fillMissingOrNullFilters(filtersJSON) {
  let filtersKeys = Object.keys(filtersJSON);

  //if a position is included, make it an array with just the given pos and extra ""
  if(filtersKeys.includes("pos")) {
    let posCount = filtersJSON["pos"].length;
    for(let i = posCount; i < 5; i++) {
      filtersJSON["pos"].push("");
    }
  }

  // Iterates through first two values which are text-based
  for(let i = 0; i < 3; i++) {
    let currentFilter = DEFAULT_FILTER_KEYS[i];
    // If a filter does not exist, fill in the default values
    if (!filtersKeys.includes(currentFilter)) {
      filtersJSON[currentFilter] = DEFAULT_FILTERS[currentFilter];
    }
  }

  // Iterates through rest of filters which are [min, max]
  for(let i = 3; i < DEFAULT_FILTER_KEYS.length; i++) {
    let currentFilter = DEFAULT_FILTER_KEYS[i];
    // If a filter, min or max does not exist, fill in the default values
    if (!filtersKeys.includes(currentFilter)) {
      filtersJSON[currentFilter] = DEFAULT_FILTERS[currentFilter];
    } else if(!filtersJSON[currentFilter][0]) {
      filtersJSON[currentFilter][0] = DEFAULT_FILTERS[currentFilter][0];
    } else if(!filtersJSON[currentFilter][1]) {
      filtersJSON[currentFilter][1] = DEFAULT_FILTERS[currentFilter][1];
    }
  }
  return filtersJSON;
}

function getFiltersArray(filtersJSON, foundAccentPlayers) {
  let filters = ['%' + filtersJSON["player"] + '%']
  for(let i = 0; i < foundAccentPlayers.length; i++) {
    filters.push('%' + foundAccentPlayers[i] + '%')
  }
  filters.push('%' + filtersJSON["team_code"] + '%');
  for(let i = 0; i < 5; i++) {
    if(filtersJSON["pos"][i]) {
      filters.push('%' + filtersJSON["pos"][i] + '%');
    } else {
      filters.push(filtersJSON["pos"][i]);
    }
  }
  for(let type = 3; type < 7; type++) {
    for(let i = 0; i < 2; i++) {
      filters.push(filtersJSON[DEFAULT_FILTER_KEYS[type]][i]);
    }
  }
  return filters;
}

/**
 * Establishes a database connection to a database and returns the database object.
 * Any errors that occur during connection should be caught in the function
 * that calls this one.
 * @returns {Object} - The database object for the connection.
 */
async function getUserDBConnection() {
  const db = await sqlite.open({
    filename: 'users.db',
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT);