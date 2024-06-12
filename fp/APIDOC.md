# BALLER BROWSER API Documentation
API for BALLER BROWSER. Enables users to  search for NBA players, view player details, manage user accounts, and handle user lineups. User can save lineups to their user storage.

## Search, Filter, Sort players
**Request Format:** /search/:sortOrder?sortBy=:sortBy&filters=:filters

**Request Type:** Get

**Parameters:**
Query parameters:
  - sortBy: The stat/criteria to sort search results by (team, pts, trb, ast, player, etc). Defaults to player name if not specified.
  - sortOrder: Sort order for search results. Values must be ASC or DESC.
  - filters: Stringified (can be URL encoded) JSON object containing search filters. Can optionally include "player", "team_code", "pos", "price", "pts", "trb", or "ast" values. Player searched for any player including the "player" text. Team code searches for the specific team code (e.g., "LAL" for Los Angeles Lakers). Position must be in an array and contain the positions wanted, ["PG"] or ["PG","SG"]. The other stats use a [min, max] structure while accepting if any min/max values are null.

**Returned Data Format**: JSON

**Description:** Returns NBA player search results based on the provided search parameters.

**Example Request:** /search/ASC?&filters={"team_code":"LAC"}

**Example Response:**

```json
[
  {
    "player_name": "Amir Coffey",
    "playerId": 1629599,
    "teamId": 1610612746,
    "team_name": "Los Angeles Clippers",
    "team_code": "LAC",
    "price": 1500,
    "pos": "SF",
    "age": "26",
    "pts": 6.6,
    "trb": 2.1,
    "ast": 1.1,
    "stl": 0.6,
    "blk": 0.2
  },
  {
    "player_name": "Bones Hyland",
    "playerId": 1630538,
    "teamId": 1610612746,
    "team_name": "Los Angeles Clippers",
    "team_code": "LAC",
    "price": 1600,
    "pos": "PG",
    "age": "23",
    "pts": 6.9,
    "trb": 1.5,
    "ast": 2.5,
    "stl": 0.7,
    "blk": 0.1
  },
  ...

```

**Error Handling:**
Error 400: Incorrect sort order or sort by parameters.
- "Sort order or sort by parameters may be incorrect."
Error 400: Incorrect filter JSON.
- "Filters parameter is unparseable."
Error 500: Non-specific server error.
 - "An error occurred on the server. Try again later."


## Get Player Details
**Request Format:** /player/:playerId

**Request Type:** Get

**Path Parameters:**
  - playerId (required): ID of the player.

**Returned Data Format**: JSON

**Description:** Using the given playerid, gets information about that player.

**Example Request:** /player/1629057

**Example Response:**

```json
{
  "player_name": "Robert Williams III",
  "playerId": 1629057,
  "teamId": 1610612757,
  "team_name": "Portland Trail Blazers",
  "team_code": "POR",
  "price": 2100,
  "pos": "C",
  "age": "26",
  "pts": 6.8,
  "trb": 6.3,
  "ast": 0.8,
  "stl": 1.2,
  "blk": 1.2,
  "tov": 1.2,
  "pf": 2.8,
  "fg": 2.8,
  "fga": 4.3,
  "fg_": 0.654,
  "col_3p": 0,
  "col_3pa": 0,
  "col_3p_": null,
  "ft": 1.2,
  "fta": 1.5,
  "ft_": 0.778,
  "height": "6-9",
  "weight": "249",
  "college": "Texas A&M",
  "country": "USA",
  "draft_year": "2018",
  "draft_pick": "1-27",
  "fun_fact": "Robert Williams III went to Texas A&M for college and was born in The USA. In 2018 he was pick 27 in Round 1. Robert Williams III currently plays for the Portland Trail Blazers. He weighs 249 lbs and his height is 6'9\"."
}
```

**Error Handling:**
Error 400: Couldn't find the specified playerId.
 - ""Could not find player [playerId]"
Error 500: Non-specific server error.
 - "An error occurred on the server. Try again later."


## Create User
**Request Format:** /user/create

**Request Type:** POST

**Body Parameters:**
 - username: The username of the new user.
 - password: The password of the new user.
 - email: The email of the new user.

**Returned Data Format**: Plain text

**Description:** Using the username, password and email, creates a new user in the users.db database.

**Example Request:** /user/create with body values of username="bron", password="testtest", email="test@gmail.com".


**Example Response:**

``` text
"Welcome to BALLER//BROWSER, Bron."
```

**Error Handling:**
Error 400: Invalid username (already taken) or invalid email.
 - "Provided username is already taken."
 - "Please provide a real email."
Error 400: Missing password, email or username.
 - "Please provide a password, email and username."
Error 500: Internal server error.
 - "Server error occurred."


## Login User
**Request Format:** /user/login

**Request Type:** POST

**Body Parameters:**
 - username: The username of the new user.
 - password: The password of the new user.

**Returned Data Format**: Plain Text

**Description:** Logs in the user according to the given username and password.

**Example Request:** /user/login with body values username="bron", password="testtest".

**Example Response:**

```
"Welcome Bron, you successfully logged in."
```

**Error Handling:**
Error 400: Missing password or username, or username can't be found.
 - "Please provide both a password and username."
Error 500: Internal server error or can't get db with the username.
 - "Server error occurred."
 - "Provided user is not found on server."



## Logout User
**Request Format:** /user/login

**Request Type:** POST

**Body Parameters:**
 - username: The username of the new user.

**Returned Data Format**: Plain Text

**Description:** Logs out the current user.

**Example Request:** /user/login with body values username="bron", password="testtest".

**Example Response:**

```
"Welcome Bron, you successfully logged in."
```

**Error Handling:**
Error 400: No username parameter.
 - "Please provide a username."
Error 500: User couldn't be fround on the database or server error.
 - "Provided user is not found on server."
 - "Server error occurred."



 ## Add a lineup to the user
**Request Format:** /lineup/add

**Request Type:** POST

**Body Parameters:**
 - teamString: The array of playerIds (lineup).

**Returned Data Format**: Plain Text

**Description:** Adds a lineup to the current user.

**Example Request:** /user/login with body values username="bron", password="testtest".

**Example Response:**

```text
Successfully purchased players and added lineup to slot 1.
Your confirmation number for this transaction is 1623187123770.
```

**Error Handling:**
Error 400: "No user login."
Error 400: Ran out of lineups to save to.
 - "Not enough storage to add this lineup (Max 3). Please delete a team to make room."
 Error 400: Can't afford plauer purchase
 - "Man, no other way to tell you this: you are broke! Come back later when you got the dough. Then you can have the players."
Error 500: User couldn't be found on the database or server error.
 - "Provided user is not found on server."
 - "Server error occurred."



  ## Get lineup of user
**Request Format:** /lineup/get/:lineupNumber

**Request Type:** Get

**Parameters:**
 - lineupNumber: Number of the lineup to retrieve that must have values 1-3.

**Returned Data Format**: Plain Text

**Description:** Gets the specified lineup of the user.

**Example Request:** /lineup/get/1

**Example Response:**

```JSON
["1629014", "1629014", "1629014", "203924", "1631101"]
```

**Error Handling:**
Error 400: "No user logged in."
Error 400: lineupNumber is not 1, 2 or 3.
 - "Please provide a lineup number 1-3."
Error 400: Lineup is empty
 - "Lineup 1 is empty."
Error 500: Server error.
 - "Server error occurred."


  ## Deletes a lineup of the user.
**Request Format:** /lineup/delete

**Request Type:** POST

**Parameters:**
 - lineupNumber: Number of the lineup to delete that must have values 1-3.

**Returned Data Format**: Plain Text

**Description:** Deletes the specified lineup of the user.

**Example Request:** /lineup/delete with linupNumber=2 as a body parameter.

**Example Response:**

```text
Successfully deleted lineup 2.
```

**Error Handling:**
Error 400: "No user logged in."
Error 400: lineupNumber is not 1, 2 or 3.
 - "Please provide a lineup number 1-3."
Error 500: Server error.
 - "Server error occurred."


   ## Gets the order history of the user.
**Request Format:** /user/orderhistory

**Request Type:** Get

**Returned Data Format**: JSON

**Description:** Gets the purchase history for the current user.

**Example Request:** /user/orderhistory

**Example Response:**

```json
[
  {
    "confirmationNum": 1717472248771,
    "players": [
      "1629014",
      "1629014",
      "1629014",
      "1629014",
      "1629014",
      "1629014",
      "1629014"
    ]
  },
  ...
  {
    "confirmationNum": 1717487152235,
    "players": [
      "1630703"
    ]
  }
]
```

**Error Handling:**
Error 400: "No user logged in."
Error 400: Empty order history.
 - "Order history is empty! Buy something!"
 - "Please provide a lineup number 1-3."
Error 500: Server error.
 - "Server error occurred."