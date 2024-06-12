# LeBron's Legacy API Documentation
*LeBron's Legacy API serves the purpose of giving attributes for different LeBrons, while also
allowing users to play the LeBron Legacy game. Users can shoot the ball at LeBron's shooting
percentage.*

## Get LeBron type
**Request Format:** */get/:type*

**Request Type:** *get*

**Returned Data Format**: *json*

**Description:** *Gets a json object of the requested LeBron type, which includes the LeBron type's attributes.*

**Example Request:** */get/heat*

**Example Response:**

```
{
  "type": "heat",
  "attributes": {
    "rim": 0.756,
    "3-10": 0.455,
    "10-16": 0.39,
    "16-3pt": 0.444,
    "3pt": 0.397
  }
}
```

**Error Handling:**
- If the LeBron type can't be found on the server: error 400 "LeBron type not found"


## *Start Game*
**Request Format:** */game/start with POST parameters of "type"*

**Request Type:** *post*

**Returned Data Format**: text

**Description:** *Starts the game, gives the client a unique gameId to play the game with and writes the gameId to the server's record. The client passes the "type" of LeBron.*

**Example Request:** */game/start with POST parameters of "type"="heat"*

**Example Response:**

```text
4
```

**Error Handling:**
- If the LeBron type can't be found on the server: error 400 "LeBron type not found. There seems to be an issue with the client!"
- If the gamestats.json file can't be found on the server: error 500 "File on server can't be found. There seems to be an issue with the server!"
- If the gamestats.json can't be written to: error 500 "Write failed. There seems to be an issue with the server!"


## *Shoot the ball*
**Request Format:** */game/shoot with POST parameters of "gameId", "shotLocationX" and "shotLocationY"*

**Request Type:** *post*

**Returned Data Format**: text

**Description:** *Uses the given gameId, shotLocationX and shotLocationY to calculate if the user
makes a shot. The distance from the basket is dependent on the court size, where each pixel is
24/280 feet and the hoop is located at (375, 505) in pixels. The distance from the basket is then
used to get the difficulty of the shot (3pt, 16ft to 3pt, etc.). The shot is then calculated
using real LeBron percentages of the type used in the user's settings from the gameId.*

**Example Request:** */game/shoot with POST parameters of "gameId"="4", "shotLocationX"=200 and "shotLocationY"=200*

**Example Response:**
*Fill in example response in the {}*

```
LeBron bricks the shot! 🧱
```

**Error Handling:**
- If the request is missing gameId, shotLocationX or shotLocationY: error 400 "Must send the Game ID, shot location X and shot location Y. There seems to be an issue with the client!"
- If the gamestats.json file can't be found on the server: error 500 "File on server can't be found. There seems to be an issue with the server!"
- If the gamestats.json can't be written to: error 500 "Write failed. There seems to be an issue with the server!"


## Get LeBron type
**Request Format:** */game/:gameId/stats*

**Request Type:** *get*

**Returned Data Format**: *json*

**Description:** *Gets a json object containing the game stats for the given gameId.*

**Example Request:** */game/4/stats*

**Example Response:**

```
{
  "team": "heat",
  "FGs": 10,
  "FGM": 6,
  "3PM": 6,
  "3PA": 10
}
```

**Error Handling:**
- If the LeBron type can't be found on the server: error 400 "LeBron type not found"
- If the requested gameId can't be found: error 400 "Game ID not found. There seems to be an issue with the client!"
- If the gamestats.json file can't be found on the server: error 500 "File on server can't be found. There seems to be an issue with the server!"
