
"use strict";
(function() {

  const API_URL = "https://cse154-ballerbrowser-api.onrender.com";

  const APIURL_LOGIN = API_URL + "/user/login";
  const APIURL_LOGOUT = API_URL + "/logout";
  const USER_WELCOME = "What's good, ";
  const USERNAME = "username";

  const NBA_HEADSHOT_IMAGE_URL = "https://cdn.nba.com/headshots/nba/latest/1040x760/";
  const NBA_LOGO_IMAGE_URL_ONE = "https://cdn.nba.com/logos/nba/";
  const NBA_LOGO_IMAGE_URL_TWO = "/primary/D/logo.svg";


  let _currentUser = undefined;

  window.addEventListener("load", init);

  /**
   * This initialization function adds the event listeners and stuff
   * @returns {void}
   */
  async function init() {
    qs("#top-lineup-section > select").addEventListener("change", fetchLineup);
    qs("#top-lineup-section > input").addEventListener("change", fetchLineup);
    qs("#info-popup > button").addEventListener("click", () => {
      qs("#info-popup").close();
      qs("body").classList.remove("stopScrolling");
    });

    // %% LOGIN
    id("login-form").addEventListener("submit", (event) => {
      console.log("bruh")
      event.preventDefault();
      submitLogin(event.currentTarget);
    });
    let possibleCachedUsername = localStorage.getItem("cachedUsername");
    if (possibleCachedUsername) {
      id("inputlogin-username").value = possibleCachedUsername;
    }

    // %% INFO POPUP
    qs("#info-popup > button").addEventListener("click", () => {
      qs("#info-popup").close();
      qs("body").classList.remove("stopScrolling");
    });

    // %% CREATE ACCOUNT
    id("create-acc-btn").addEventListener("click", () => {
      id("create-acc-popup").showModal();
      qs("body").classList.add("stopScrolling");
    });
    qs("#create-acc-popup > button").addEventListener("click", () => {
      qs("#create-acc-popup").close();
      qs("body").classList.remove("stopScrolling");
    });
    id("create-acc-form").addEventListener("submit", (event) => {
      event.preventDefault();
      createUser(event.currentTarget);
    });

    // %% ORDER HISTORY
    id("order-history-btn").addEventListener("click", orderHistoryPopup);
    qs("#order-history-popup > button").addEventListener("click", () => {
      qs("#order-history-popup").close();
      qs("body").classList.remove("stopScrolling");
    });

    id("delete-lineup-btn").addEventListener("click", deleteLineup);


    await fetchLineup();
  }

  async function deleteLineup() {
    let data = new FormData();
    data.append("lineupNumber", qs("#top-lineup-section > select").value);
    let result = await fetch(API_URL + "/lineup/delete", { method : "POST", body : data });
    await statusCheck(result);
    let resultText = await result.text();
    qs("#lineup-showcase > p").textContent = resultText;
    await fetchLineup();
  }

  async function fetchLineup() {
    if(_currentUser) {
      let lineupNumber = qs("#top-lineup-section > select").value;
      let isAutoBest = qs("#top-lineup-section > input").checked;
      try {
        qs("#lineup-showcase > p").textContent = "";
        let lineup = await fetch(API_URL + "/lineup/get/" + lineupNumber);
        await statusCheck(lineup);
        lineup = await lineup.json();
        let lineupJSONs = await generateLineup(lineup, isAutoBest);
        qs("#lineup-showcase > h1").classList.remove("hidden");
        qs("#lineup-showcase > h1 ~ h1").classList.remove("hidden");
        showcaseLineup(lineupJSONs);
      } catch (err) {
        console.error(err);
        qs("#lineup-showcase > h1").classList.add("hidden");
        qs("#lineup-showcase > h1 ~ h1").classList.add("hidden");
        qs("#lineup-showcase > p").textContent = err.message;
        id("starters").innerHTML = "";
        id("bench").innerHTML = "";
      }
    } else {
      qs("#lineup-showcase > h1").classList.add("hidden");
      qs("#lineup-showcase > h1 ~ h1").classList.add("hidden");
      qs("#lineup-showcase > p").textContent = "No user logged in";
      id("starters").innerHTML = "";
      id("bench").innerHTML = "";
    }
  }

  /**
   * Displays the best lineup using a given array of player IDs.
   * @param {String[]} bestLineup
   */
  function showcaseLineup(lineup) {
    id("starters").innerHTML = "";
    id("bench").innerHTML = "";
    let starterCount = 5;
    if(lineup.length < 5) {
      starterCount = lineup.length;
    }
    for(let i = 0; i < starterCount; i++) {
      id("starters").appendChild(createPlayerCard(lineup[i]));
    }
    for(let i = starterCount; i < lineup.length; i++) {
      id("bench").appendChild(createPlayerCard(lineup[i]));
    }
  }

  /**
   * Using the given array of player IDs, generates the best lineup
   * @param {String[]} lineup lineup of player IDs
   * @returns
   */
  async function generateLineup(lineup, isBest) {
    let lineupJSONs = [];
    for(let i = 0; i < lineup.length; i++) {
      let playerData = await fetch(API_URL + "/player/" + lineup[i]);
      await statusCheck(playerData);
      lineupJSONs.push(await playerData.json());
    }
    if(isBest) {
      lineupJSONs.sort(function(a, b){return (parseInt(a["price"]) - parseInt(b["price"]))});
    }
    let bestLineup = getStarters(lineupJSONs);
    for(let i = lineupJSONs.length - 1; i > 0; i--) {
      if(!bestLineup.includes(lineupJSONs[i])) {
        bestLineup.push(lineupJSONs[i]);
      }
    }
    return bestLineup;
  }

  function getStarters(lineupJSONs) {
    let bestLineup = ['','','','',''];
    for(let i = 0; i < lineupJSONs.length; i++) {
      if(lineupJSONs[i]["pos"] === "PG") {
        bestLineup[0] = lineupJSONs[i];
      } else if(lineupJSONs[i]["pos"] === "SG") {
        bestLineup[1] = lineupJSONs[i];
      } else if(lineupJSONs[i]["pos"] === "SF") {
        bestLineup[2] = lineupJSONs[i];
      } else if(lineupJSONs[i]["pos"] === "PF") {
        bestLineup[3] = lineupJSONs[i];
      } else if(lineupJSONs[i]["pos"] === "C") {
        bestLineup[4] = lineupJSONs[i];
      }
    }
    console.log(bestLineup);
    if(bestLineup.includes("")) {
      qs("#lineup-showcase > p").textContent = "Couldn't find all basketball positions! " +
                                               "Using positionless basketball!";
    }
    while (bestLineup.includes("")) {
      for(let i = 0; i < bestLineup.length; i++) {
        if(bestLineup[i] === "") {
          bestLineup.splice(i, 1);
        }
      }
    }
    console.log(bestLineup);

    // console.log(bestLineup);
    // console.log("missing pos: " + missingStarters);
    // if(missingStarters.length != []) {
    //   for(let i = 0; i < lineupJSONs.length; i++) {
    //     for(let j = 0; j < missingStarters.length; j++) {
    //       console.log("check pos: " + positions[missingStarters[j]]);
    //       if(lineupJSONs[i]["pos"] === positions[missingStarters[j]]) {
    //         bestLineup[missingStarters[j]] = lineupJSONs[i];
    //       }
    //     }
    //   }
    // }
    return bestLineup;
  }

  // %% ORDER HISTORY
  async function orderHistoryPopup() {
    id("order-history-text").textContent = "";
    id("order-history-list").innerHTML = "";
    try {
      let orderHistory = await fetch(API_URL + "/user/orderhistory");
      await statusCheck(orderHistory);
      orderHistory = await orderHistory.json();
      for(let i = 0; i < orderHistory.length; i++) {
        let orderItem = gen("section");
        orderItem.classList.add("order-history-item");
        makeElementAddTextAppendChild("p", orderHistory[i]["confirmationNum"], orderItem);
        for(let j = 0; j < orderHistory[i]["players"].length; j++) {
          let playerData = await fetch(API_URL + "/player/" + orderHistory[i]["players"][j]);
          await statusCheck(playerData);
          playerData = await playerData.json();
          let teamNameClass = playerData["team_name"].replace(/\s/g, "");
          orderItem.appendChild(makePlayerInCartCard(playerData["playerId"], teamNameClass,
                                playerData["player_name"], playerData["pos"], false));
        }
        id("order-history-list").appendChild(orderItem);
      }

      qs("body").classList.add("stopScrolling");
      id("order-history-popup").showModal();
    } catch (err) {
      console.error(err);
    }
  }


  function makePlayerInCartCard(playerId, teamNameClass, playerName, pos, isRemovable) {
    let playerInCart = gen("section");
    playerInCart.classList.add("pid" + playerId);
    playerInCart.classList.add(teamNameClass);
    playerInCart.classList.add("playerInCart");

    // image of player
    let cartPlayerImg = document.createElement("img");
    cartPlayerImg.src = NBA_HEADSHOT_IMAGE_URL + playerId + ".png";
    cartPlayerImg.alt = "Headshot image of " + playerName + ", NBA player.";
    let posAndButton = gen("section");
    makeElementAddTextAppendChild("p", pos, posAndButton);

    // button to remove player
    if(isRemovable) {
      let removeFromCartBtn = gen("button");
      removeFromCartBtn.textContent = "X";
      removeFromCartBtn.addEventListener("click", removeFromCart);
      posAndButton.appendChild(removeFromCartBtn);
    }

    playerInCart.appendChild(posAndButton);
    playerInCart.appendChild(cartPlayerImg);
    return playerInCart;
  }

  // %% LOGIN AND USER HANDLING
  /**
   * Handler for the create new user form. Handles user creation
   * requests to the API
   * @param {Element} form entire form tag
   */
  async function createUser(form) {
    try {
      let params = new FormData(form);
      let result = await fetch(API_URL + "/user/create", { method : "POST", body : params });
      await statusCheck(result);
      let resultText = await result.text();
      _currentUser = params.get(USERNAME);
      createAccountResponse(resultText);
    } catch (error) {
      id("create-acc-text").textContent = error.message;
    }
  }

  function createAccountResponse(resultText) {
    id("create-acc-text").textContent = resultText;
    id("create-acc-form").parentNode.remove();
    qs("#create-acc-popup > section > h1 + p + p").remove();
    let loginString = "Welcome " + _currentUser + ", you successfully logged in.";
    let welcomeImg = gen("img");
    welcomeImg.src = "imgs/lakersbg.gif"
    let welcomeImgButton = gen("button");
    welcomeImgButton.textContent = "Randomize Image";
    welcomeImgButton.addEventListener("click", setRandomWelcomePictures);
    qs("#create-acc-popup > section").appendChild(welcomeImg);
    qs("#create-acc-popup > section").appendChild(welcomeImgButton);
    handleLoginResponse(true, loginString, _currentUser);
  }

  function setRandomWelcomePictures() {
    let random = Math.random();
    if (random >= 0.8) {
      qs("#create-acc-popup img").src = "imgs/heatbg.gif"
    } else if (random >= 0.6) {
      qs("#create-acc-popup img").src = "imgs/cavsbg.gif"
    } else if (random >= 0.4) {
      qs("#create-acc-popup img").src = "imgs/lakersbg.gif"
    } else if (random >= 0.2) {
      qs("#create-acc-popup img").src = "imgs/kawhi.gif"
    } else {
      qs("#create-acc-popup img").src = "imgs/lastdance.gif"
    }
  }

  /**
   * Handler for the user login form. Handles login
   * requests to the API
   * @param {Element} form entire form tag
   */
  async function submitLogin(form) {
    try {
      let params = new FormData(form);
      let result = await fetch(APIURL_LOGIN, { method : "POST", body : params });
      await statusCheck(result);
      let resultText = await result.text();
      _currentUser = params.get(USERNAME);
      handleLoginResponse(true, resultText, _currentUser);
    } catch (error) {
      handleLoginResponse(false, error.message, undefined);
    }
  }


  /**
   * Handles the response from a login attempt.
   * @param {boolean} loginOk Indicates if the login was successful.
   * @param {string} responseText The response text to display.
   * @param {string} currentUser The current logged-in user.
   */
  function handleLoginResponse(loginOk, responseText, currentUser) {
    if (loginOk) {
      id("login-dropbtn").textContent = USER_WELCOME + currentUser;
      id("create-acc-btn").remove();
      qs("#login-status + p").remove();
      id("login-form").remove();
      let logoutBtn = gen("button");
      logoutBtn.id = "logout-btn";
      logoutBtn.textContent = "Logout";
      fetchLineup();
      logoutBtn.addEventListener("click", submitLogout);
      qs(".dropdown-content").appendChild(logoutBtn);
    }
    id("login-status").textContent = responseText
  }

  /**
   * Submits a logout request to the server.
   */
  async function submitLogout() {
    try {
      let params = new FormData();
      params.append(USERNAME, _currentUser);
      let result = await fetch(APIURL_LOGOUT, { method : "POST", body : params });
      await statusCheck(result);
      let resultText = await result.text();
      _currentUser = undefined;
      handleLogoutResponse(true, resultText);
    } catch (error) {
      handleLogoutResponse(false, error.message);
    }
  }

  /**
   * Handles the response from a logout attempt.
   * @param {boolean} logoutOk Indicates if the logout was successful.
   * @param {string} responseText The response text to display.
   */
  function handleLogoutResponse(logoutOk, responseText) {
    if (logoutOk) {
      id("login-dropbtn").textContent = "Login";
      id("logout-btn").remove();
      setTimeout(() => {location.reload()}, 2000);
    }
    id("login-status").textContent = responseText
  }

  // %% CREATE PLAYER CARD SECTION

  /**
   * Creates and returns a new Player card, from the given parameters.
   * @param {JSON} player The playerJSON object to make a player card out of.
   * @returns {Element} Player element (<section class="card">)
   */
  function createPlayerCard(player) {
    let playerStats = [player["pts"], player["trb"], player["ast"], player["stl"], player["blk"]];
    let card = gen("section");

    // add logo and team
    let logoAndTeam = createLogoAndTeam(player["team_name"], player["teamId"]);
    card.appendChild(logoAndTeam);

    // add headshot
    let headshot = getPlayerHeadshot(player["playerId"], player["player_name"], playerStats);
    card.appendChild(headshot);

    let nameStatsPriceArr = createPlayerNameStatsPrice(player["player_name"], player["pos"],
                                                       playerStats, player["price"]);
    card.appendChild(nameStatsPriceArr[0]);
    card.appendChild(nameStatsPriceArr[1]);

    // buttons
    card.appendChild(createCardShopButtons());

    // add playerId
    card.setAttribute('id', "pid" + player["playerId"]);

    card.classList.add("card");
    card.classList.add(player["team_name"].replace(/\s/g, "")); // removes spaces from teamname
    card.classList.add(player["team_name"].replace(/\s/g, "")+ "2"); // removes spaces from teamname
    return card;
  }

  /**
   * Given the player's id and their name, returns the
   * headshot image source link for that player.
   * @param {Number} playerId the official id of the player (<playerId>.png)
   * @param {*} playerName name of the player, used in the alt
   * @returns {String} img src for headshot
   */
  function getPlayerHeadshot(playerId, playerName, stats) {
    let centerSection = gen("section");
    centerSection.classList.add("centerSection");
    let badges = getBadgesList(stats, playerId);
    let headshot = getHeadshotImg(playerId, playerName);
    centerSection.appendChild(headshot);

    for(let i = 1; i <= badges.length; i++) { //creates badges
      let badgeImg = getBadgeImg(badges[i-1]);
      badgeImg.classList.add("badge" + i);
      centerSection.appendChild(badgeImg);
    }
    return centerSection;
  }

  /**
   * Generates an imgage element for a player's headshot,
   * using the given playerid and playername.
   * @param {string} playerId the official id of the player (<playerId>.png)
   * @param {string} playerName name of the player, used in the alt
   * @returns {HTMLImageElement} An img element with the player's headshot.
   */
  function getHeadshotImg(playerId, playerName) {
    let headshot = gen("img");
    headshot.classList.add("headshot");
    headshot.src = NBA_HEADSHOT_IMAGE_URL + playerId + ".png";
    headshot.alt = playerName + " headshot image";
    return headshot;
  }

  /**
   * Generates an img element for a player's badge,
   * using the given type of badge.
   * @param {string} badge - The type of badge to generate.
   * @returns {HTMLImageElement} An img element with the badge.
   */
  function getBadgeImg(badge) {
    let badgeImg = gen("img");
    badgeImg.classList.add("badge");
    badgeImg.src = "imgs/" + badge + ".png";
    badgeImg.alt = "badge showing that the player is great at " + badge;
    return badgeImg;
  }

  /**
   * Given an array of player stats and player number, returns
   * a corresponding list of badges.
   * @param {Number[]} stats array of player stats
   * @param {Number} playerId the official id of the player (<playerId>.png)
   * @returns
   */
  function getBadgesList(stats, playerId) {
    let badges = [];
    if(stats[0] >= 24) {
      badges.push("points");
    }
    if(stats[1] >= 9) {
      badges.push("rebounds");
    }
    if(stats[2] >= 8) {
      badges.push("assists");
    }
    if(stats[3] >= 1.5) {
      badges.push("steals");
    }
    if(stats[4] >= 1) {
      badges.push("blocks");
    }
    if(playerId === 2544) {
      badges.push("goat");
    }
    return badges;
  }

  /**
   * Creates a logo and team section element used solely in the
   * creation of new cards.
   * @param {String} teamName Name of the team
   * @param {Number} teamName Id of the team
   * @returns {Element} a section of the team's logo and name.
   */
  function createLogoAndTeam(teamName, teamId) {
    let logoAndTeam = gen("section");
    logoAndTeam.classList.add("logoAndTeam");
    logoAndTeam.appendChild(createLogo(teamName, teamId));
    makeElementAddTextAppendChild("p", teamName, logoAndTeam);
    return logoAndTeam;
  }

  /**
   * Using the given teamName or teamId, retrieves an image
   * element logo for the corresponding team.
   * @param {String} teamName name of team
   * @param {Number} teamId teamId
   * @returns {ImageElement}
   */
  function createLogo(teamName, teamId) {
    let logo = gen("img");
    logo.src = NBA_LOGO_IMAGE_URL_ONE + teamId + NBA_LOGO_IMAGE_URL_TWO;
    logo.alt = "Logo of " + teamName;
    return logo;
  }

  /**
   * Creates and returns a section of shop-related buttons that goes on
   * a card, used solely in the creation of new cards.
   * @returns {Element} <section> element containing the shop buttons, purchase and sell.
   */
  function createCardShopButtons() {
    let shop = gen("section");
    shop.classList.add("shop");

    // sell button
    let expandBtn = gen("button");
    expandBtn.textContent = "Expand";
    expandBtn.addEventListener("click", expandCard);
    shop.appendChild(expandBtn);
    return shop;
  }

  /**
   * Handler for when an expand button is clicked on a card,
   * retrieves the card's information and creates a pop-up
   * view dialog with more player information.
   */
  async function expandCard() {
    let popUp = qs("#info-popup");
    let playerId = this.parentNode.parentNode.id.substring(3);
    let playerData = await fetch(API_URL + "/player/" + playerId);
    await statusCheck(playerData);
    playerData = await playerData.json();
    let playerSection = genExpandedPlayerSection(playerData);
    playerSection.classList.add("player-section");
    popUp.replaceChild(playerSection, popUp.lastChild);
    popUp.showModal();
    popUp.classList.remove(popUp.classList[0]);
    popUp.classList.remove(popUp.classList[0]);
    popUp.classList.add(playerData["team_name"].replace(/\s/g, ""));
    popUp.classList.add(playerData["team_name"].replace(/\s/g, "") + "2");
    qs("body").classList.add("stopScrolling");
  }

/**
 * Generates an expanded player section with detailed information.
 * @param {Object} playerData The data of the player.
 * @returns {HTMLElement} A section element with the player's expanded information.
 */
  function genExpandedPlayerSection(playerData) {
    let playerSection = gen("section");
    playerSection.appendChild(getTopSection(playerData));
    playerSection.appendChild(getMiddleSection(playerData));
    let bottomSection = gen("section");
    bottomSection.classList.add("bottom-section");
    makeElementAddTextAppendChild("p", "Fun fact:", bottomSection)
    makeElementAddTextAppendChild("p", playerData["fun_fact"], bottomSection)
    playerSection.appendChild(bottomSection);
    return playerSection;
  }

  /**
   * Generates the top section of the player's information.
   * @param {Object} playerData The data of the player.
   * @returns {HTMLElement} A section element with the player's top information.
   */
  function getTopSection(playerData) {
    let topSection = gen("section");
    topSection.classList.add("top-section");
    makeElementAddTextAppendChild("h3", playerData["player_name"] + " | " +  playerData["pos"], topSection);
    makeElementAddTextAppendChild("h4", playerData["team_name"], topSection);
    return topSection
  }

  /**
   * Generates the middle section of the player's information.
   * @param {Object} playerData The data of the player.
   * @returns {HTMLElement} A section element with the player's middle information.
   */
  function getMiddleSection(playerData) {
    let middleSection = gen("section");
    middleSection.classList.add("middle-section");

    let cardPlayerImg = gen("img");
    cardPlayerImg.src = NBA_HEADSHOT_IMAGE_URL + playerData["playerId"] + ".png";
    middleSection.appendChild(cardPlayerImg);

    middleSection.appendChild(getBadgesSection(playerData));

    let baseStats = getBaseStatsSection(playerData);
    middleSection.appendChild(baseStats);

    middleSection.appendChild(getShootingSplits(playerData));
    makeElementAddTextAppendChild("span", "", middleSection)
    middleSection.appendChild(getMetaInfoSection(playerData));

    return middleSection;
  }

  /**
   * Generates the base stats section of the player's information.
   * @param {Object} playerData The data of the player.
   * @returns {HTMLElement} A section element with the player's base stats.
   */
  function getBaseStatsSection(playerData) {
    let baseStatsSection = gen("section");
    baseStatsSection.classList.add("base-stats");
    makeElementAddTextAppendChild("h5", "Per Game Stats", baseStatsSection)
    const baseStats = ["pts", "trb", "ast", "stl", "blk", "tov", "pf"]
    const baseStatsLabel = ["ppg", "rpg", "apg", "spg", "bpg", "tpg", "pfpg"]
    for(let i = 0; i < baseStats.length; i++) {
      let statText = playerData[baseStats[i]] + " " + baseStatsLabel[i];
      makeElementAddTextAppendChild("p", statText, baseStatsSection)
    }
    return baseStatsSection;
  }

  /**
   * Generates the shooting splits section of the player's information.
   * @param {Object} playerData The data of the player.
   * @returns {HTMLElement} A section element with the player's shooting splits.
   */
  function getShootingSplits(playerData) {
    let shootingSplitsContainer = gen("section");
    shootingSplitsContainer.classList.add("shooting-splits-container");
    makeElementAddTextAppendChild("h5", "Shooting Splits", shootingSplitsContainer);
    let shootingSplits = gen("section");
    shootingSplits.classList.add("shooting-splits");
    const splitStats = ["fg", "fga", "col_3p", "col_3pa", "ft", "fta"];
    const splitStatsPerc = ["fg_", "col_3p_", "ft_",];
    const splitStatsLabels = ["FGs", "3Ps", "FT"];
    const splitStatsPercLabels = ["% FG", "% 3P", "% FT"];
    for(let i = 0; i < splitStatsLabels.length; i++) {
      let statContainer = gen("section");
      let statText = playerData[splitStats[i * 2]] + "/" + playerData[splitStats[i * 2 + 1]] +
                  " " + splitStatsLabels[i];
      let statTextLabel = Math.round(playerData[splitStatsPerc[i]] * 100) + splitStatsPercLabels[i];;
      makeElementAddTextAppendChild("p", statText, statContainer);
      makeElementAddTextAppendChild("p", statTextLabel, statContainer);
      shootingSplits.appendChild(statContainer);
    }
    shootingSplitsContainer.appendChild(shootingSplits);
    return shootingSplitsContainer;
  }

  /**
   * Generates the meta information section of the player's information
   * @param {Object} playerData The data of the player
   * @returns {HTMLElement} A section element with the player's meta information
   */
  function getMetaInfoSection(playerData) {
    let metaInfoSection = gen("section");
    metaInfoSection.classList.add("meta-info");
    makeElementAddTextAppendChild("h5", "Other Info", metaInfoSection);
    let metaInfo = gen("section");
    makeElementAddTextAppendChild("p", "Age:", metaInfo);
    makeElementAddTextAppendChild("p", "Price:", metaInfo);
    makeElementAddTextAppendChild("p", "Height:", metaInfo);
    makeElementAddTextAppendChild("p", "Weight:", metaInfo);
    makeElementAddTextAppendChild("p", playerData["age"], metaInfo);
    makeElementAddTextAppendChild("p", "$" + playerData["price"], metaInfo);
    let heightString = playerData["height"].split("-")[0] + "\'" +
                       playerData["height"].split("-")[1] + "\"";
    makeElementAddTextAppendChild("p", heightString, metaInfo);
    makeElementAddTextAppendChild("p", playerData["weight"] + " lbs", metaInfo);
    makeElementAddTextAppendChild("p", "College:", metaInfo);
    makeElementAddTextAppendChild("p", "Country:", metaInfo);
    makeElementAddTextAppendChild("p", "Draft year:" , metaInfo);
    makeElementAddTextAppendChild("p", "Draft pick:", metaInfo);
    makeElementAddTextAppendChild("p", playerData["college"], metaInfo);
    makeElementAddTextAppendChild("p", playerData["country"], metaInfo);
    makeElementAddTextAppendChild("p", playerData["draft_year"], metaInfo);
    makeElementAddTextAppendChild("p", playerData["draft_pick"], metaInfo);
    metaInfoSection.appendChild(metaInfo)
    return metaInfoSection;
  }

  /**
   * Generates the badges section of the player's information
   * @param {Object} playerData The data of the player
   * @returns {HTMLElement} A section element with the player's badges
   */
  function getBadgesSection(playerData) {
    let badgesSectionContainer = gen("section");
    badgesSectionContainer.classList.add("badges-container");
    makeElementAddTextAppendChild("h5", "Badges", badgesSectionContainer);
    let badgesSection = gen("section");
    let stats = [playerData["pts"], playerData["trb"], playerData["ast"], playerData["stl"],
                 playerData["blk"]];
    let badges = getBadgesList(stats, playerData["playerId"]);
    if(badges.length === 0) {
      makeElementAddTextAppendChild("p", "None", badgesSectionContainer);
    } else {
      for(let i = 1; i <= badges.length; i++) {
        let badge = gen("img");
        badge.classList.add("badge-expanded");
        badge.src = "imgs/" + badges[i - 1] + ".png";
        badge.alt = "badge showing that the player is great at " + badges[i - 1];
        badgesSection.appendChild(badge);
      }
    }
    badgesSectionContainer.appendChild(badgesSection);
    return badgesSectionContainer;
  }

  /**
   * Creates an HTML element, adds text to it, and appends it to a parent element.
   * @param {string} tag The HTML tag to create.
   * @param {string} text The text content to add to the element.
   * @param {HTMLElement} parent The parent element to append the new element to.
   */
  function makeElementAddTextAppendChild(tag, text, parent) {
    let element = gen(tag);
    element.textContent = text;
    parent.appendChild(element);
  }

  /**
   * Using the given name, stats, and price, create elements and
   * store them in an array, returns this array.
   * @param {String} playerName the player's name
   * @param {Number[]} stats array of the player's stats: [PPG, RPG, APG]
   * @param {Number} price how much the player costs in Baller Browser.
   * @returns {Element[]} Array of elements [name, stats, price] display elements
   */
  function createPlayerNameStatsPrice(playerName, pos, stats, price) {
    let elements = [];

    // Player name
    let nameEl = gen("h2");
    nameEl.textContent = playerName + " | " + pos;
    elements[0] = nameEl;

    // stats
    let statsEl = gen("p");
    statsEl.classList.add("stats");
    makeElementAddTextAppendChild("span", "PPG: " + stats[0], statsEl);
    makeElementAddTextAppendChild("span", "RPG: " + stats[1], statsEl);
    makeElementAddTextAppendChild("span", "APG: " + stats[2], statsEl);
    elements[1] = statsEl;
    return elements;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID.
   * @returns {object} - DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Returns a generated element using the given tag.
   * @param {string} tagName - tagName.
   * @returns {object} - DOM object associated with tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
  /**
   * Checks the given fetched possible JSON object. Returns it back if it's ok to be used,
   * otherwise calls an error.
   * @param {string} res - fetched possible JSON object.
   * @returns {string} - the same possible JSON object, checked to work.
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns first element matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} - DOM object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns a list of all elements that match the specified selector.
   * @param {string} selector - CSS query selector.
   * @returns {NodeList} A NodeList containing all elements with the associated selector.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

})();