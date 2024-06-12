"use strict";
(function() {

  const API_URL = "https://cse154-ballerbrowser-api.onrender.com";

  // TAGS
  const SECTION_TAG = "section";
  const IMG_TAG = "img";
  const P_TAG = "p";
  const BUTTON_TAG = "button";
  const H2_TAG = "h2";
  const SPAN_TAG = "span";
  const INPUT_TAG = "input";

  // IDs
  const CARDSHOWCASE_ID = "card-showcase";
  const PLAYERID_ID = "playerId";
  const LOGINSTATUS_ID = "login-status";
  const LOGINDROPBTN_ID = "login-dropbtn";
  const LOOGOUTBTN_ID = "logout-btn";
  const CARTPURCHASEBTN_ID = "cartpurchase-btn";
  const CARTPURCHASESTATUS_ID = "cartpurchase-status";

  // CLASSES
  const LOGOANDTEAM_CLASS = "logoAndTeam";
  const HEADSHOT_CLASS = "headshot";
  const STATS_CLASS = "stats";
  const PRICE_CLASS = "price";
  const SHOP_CLASS = "shop";
  const COMPARE_CLASS = "compare";
  const CARD_CLASS = "card";

  const APIURL_LOGIN = API_URL + "/user/login";
  const APIURL_LOGOUT = API_URL + "/user/logout";
  const APIURL_ADDLINEUP = API_URL + "/lineup/add";
  const USER_NOLOGIN = "Login";
  const USER_WELCOME = "What's good, ";
  const USERNAME = "username";
  const TEAMSTRING = "teamString";
  const PASSWORD = "password";

  const NBA_HEADSHOT_IMAGE_URL = "https://cdn.nba.com/headshots/nba/latest/1040x760/";
  const NBA_LOGO_IMAGE_URL_ONE = "https://cdn.nba.com/logos/nba/";
  const NBA_LOGO_IMAGE_URL_TWO = "/primary/D/logo.svg";


  let playerCart; // current players in the user's cart. max = CART_SIZE
  let playerCartPrices;
  const CART_SIZE = 5;
  const TEMP_PLAYERS_ADDAMT = 5;
  const TWO_DAYS_MILLISECONDS = 172800000;
  let _currentUser = undefined;

  window.addEventListener("load", init);

  /**
   * This initialization function adds the event listeners and stuff
   * @returns {void}
   */
  async function init() {
    let localViewMode = window.sessionStorage.getItem("view-mode");
    if(localViewMode === "showcase" || localViewMode === "list") {
      id("view-mode").value = localViewMode;
    }
    searchAndShowcase();



    qs("#search-and-filter > form > button").addEventListener("click", event => {
      event.preventDefault();
      searchAndShowcase();
    });

    id("view-mode").addEventListener("change", () => {
      searchAndShowcase()
      window.sessionStorage.setItem("view-mode", id("view-mode").value);
    });

    playerCart = [];
    playerCartPrices = [];


    checkLocalStorageCart();

    id(CARTPURCHASEBTN_ID).addEventListener("click", confirmationPopup);

    // %% LOGIN
    id("login-form").addEventListener("submit", (event) => {
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

    // %% CONFIRM PURCHASE
    qs("#confirm-purchase-popup > button").addEventListener("click", () => {
      qs("#confirm-purchase-popup").close();
      qs("body").classList.remove("stopScrolling");
    });
    id("confirm-purchase-btn").addEventListener("click", saveLineup);
  }

  /**
   * Checks localStorage for any previously inserted player cart information.
   * If so, displays these players in the cart.
   * If the found cart information is older than two days, it is deleted.
   */
  function checkLocalStorageCart() {
    let localStorageCart = localStorage.getItem("player-cart-storage");
    if(localStorageCart) {
      localStorageCart = JSON.parse(localStorageCart);
      let timeOfSave = Date.parse(localStorageCart["current-time"]);
      let currentDate = new Date();
      if(currentDate - timeOfSave >= TWO_DAYS_MILLISECONDS) {
        localStorage.removeItem("player-cart-storage");
      } else {
        let localPlayerCart = localStorageCart["player-cart"];
        for(let i = 0; i < localPlayerCart.length; i++) {
          addPlayerToCartFetch(localPlayerCart[i]);
        }
      }
    }
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
      console.error(error);
      id("create-acc-text").textContent = error.message;
    }
  }

  /**
   * After creating an account, displays information and graphics
   * on the current popup to show account has been created.
   * @param {String} resultText text from the API result
   */
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

  /**
   * Randomly generates gifs to display on the popup image.
   */
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
      localStorage.setItem("cachedUsername", _currentUser);
      handleLoginResponse(true, resultText, _currentUser);
    } catch (error) {
      handleLoginResponse(false, error.message, undefined);
    }
  }

  /**
   * Handles the response from a login attempt, displaying information
   * and creating elements.
   * @param {boolean} loginOk Indicates if the login was successful.
   * @param {string} responseText The response text to display.
   * @param {string} currentUser The current logged-in user.
   */
  function handleLoginResponse(loginOk, responseText, currentUser) {
    if (loginOk) {
      id(LOGINDROPBTN_ID).textContent = USER_WELCOME + currentUser;
      id("create-acc-btn").remove();
      // qs("#login-status + p").remove();
      id("login-form").remove();
      id(CARTPURCHASESTATUS_ID).textContent = "";
      let logoutBtn = gen("button");
      logoutBtn.id = "logout-btn";
      logoutBtn.textContent = "Logout";
      logoutBtn.addEventListener("click", submitLogout);
      qs(".dropdown-content").appendChild(logoutBtn);
    }
    id(LOGINSTATUS_ID).textContent = responseText
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
      id(LOGINDROPBTN_ID).textContent = USER_NOLOGIN;
      id("logout-btn").remove();
      setTimeout(() => {location.reload()}, 2000);
    }
    id(LOGINSTATUS_ID).textContent = responseText
  }


  //   /**
  //  * Disables or enables the search button when the search field is typed into. The search
  //  * input ignores any white space characters in the front or the end of the search input.
  //  * @param {Event} event - The input event.
  //  */
  //   function typeInSearch(event) {
  //     let searchText = event.target.value.trim();
  //     if (searchText) {
  //       qs("#search-and-filter > form > button").disabled = false;
  //     } else {
  //       qs("#search-and-filter > form > button").disabled = true;
  //     }
  //   }

  /**
   * Searches for players based on filters and showcases the results.
   */
  async function searchAndShowcase() {
    let filters = getFilters();
    id("card-showcase").innerHTML = "";
    let sort = [id("sort-by").value, id("sort-order").value];
    let viewMode = id("view-mode").value;
    if(viewMode === "showcase") {
      id("card-showcase").classList.add("card-view");
      id("card-showcase").classList.remove("list-view");
    } else  {
      id("card-showcase").classList.remove("card-view");
      id("card-showcase").classList.add("list-view");
    }

    let filtersQueryString = encodeURIComponent(JSON.stringify(filters));
    let player = await fetch(API_URL + "/search/" + sort[1] + "?filters=" + filtersQueryString + "&sortBy=" + sort[0]);
    await statusCheck(player);
    player = await player.json();
    for(let i = 0; i < player.length; i++) {
      let newCard;
      if(viewMode === "showcase") {
        newCard = createPlayerCard(player[i]);
      } else {
        newCard = createPlayerListCard(player[i]);
      }
      addPlayerToShowcase(newCard);
    }
  }

  /**
   * Retrieves the filters from the search and filter form.
   * @returns {Object} The filters to apply to the search.
   */
  function getFilters() {
    let searchText = qs("#search-and-filter > form > input").value;
    let teamFilter = id("team-filter").value;
    let filters = {};
    if(teamFilter) {
      filters["team_code"] = teamFilter;
    }
    if(searchText) {
      filters["player"] = searchText;
    }
    const minMaxFilters = ["price", "pts", "trb", "ast"];
    for(let i = 0; i < minMaxFilters.length; i++) {
      let inputNodes = qsa("." + minMaxFilters[i] + "-filter > input");
      if(inputNodes[0].value || inputNodes[1].value) {
        let minMax = [inputNodes[0].value, inputNodes[1].value];
        filters[minMaxFilters[i]] = minMax;
      }
    }
    filters["pos"] = [];
    for(let i = 0; i < 5; i++) {
      let checkboxes = qsa(".pos-filter > input");
      if(checkboxes[i].checked) {
        filters["pos"].push(checkboxes[i].name);
      }
    }
    return filters;
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
    let headshot = gen(IMG_TAG);
    headshot.classList.add(HEADSHOT_CLASS);
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
    let badgeImg = gen(IMG_TAG);
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
    if(badges.length === 0) {
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
    let logoAndTeam = gen(SECTION_TAG);
    logoAndTeam.classList.add(LOGOANDTEAM_CLASS);
    logoAndTeam.appendChild(createLogo(teamName, teamId));
    makeElementAddTextAppendChild("p", teamName, logoAndTeam);
    return logoAndTeam;
  }

  function createLogo(teamName, teamId) {
    let logo = gen(IMG_TAG);
    logo.src = NBA_LOGO_IMAGE_URL_ONE + teamId + NBA_LOGO_IMAGE_URL_TWO;
    logo.alt = "Logo of " + teamName;
    return logo;
  }

  // /**
  //  * Creates and returns a section element container of the checkbox and
  //  * compare buttons, used solely in the creation of new cards.
  //  * @returns {Element} a section of the team's logo and name.
  //  */
  // function createCardCompareButtons() {
  //   // compare container
  //   let compare = gen(SECTION_TAG);
  //   compare.classList.add(COMPARE_CLASS);
  //   let compareTxt = gen(P_TAG);
  //   compareTxt.textContent = "Compare";
  //   compare.appendChild(compareTxt);
  //   let compareInput = gen(INPUT_TAG);
  //   compareInput.type = "checkbox";
  //   compareInput.name = "compare";
  //   compareInput.value = "compare";
  //   compare.appendChild(compareInput);
  //   return compare;
  // }

  /**
   * Creates and returns a section of shop-related buttons that goes on
   * a card, used solely in the creation of new cards.
   * @returns {Element} <section> element containing the shop buttons, purchase and sell.
   */
  function createCardShopButtons() {
    let shop = gen(SECTION_TAG);
    shop.classList.add(SHOP_CLASS);

    // purchase button
    let purchaseBtn = gen(BUTTON_TAG);
    purchaseBtn.textContent = "Purchase";
    purchaseBtn.addEventListener("click", purchaseCard);

    // sell button
    let expandBtn = gen(BUTTON_TAG);
    expandBtn.textContent = "Expand";
    expandBtn.addEventListener("click", expandCard);
    shop.appendChild(purchaseBtn);
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
        let badge = gen(IMG_TAG);
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
    let nameEl = gen(H2_TAG);
    nameEl.textContent = playerName + " | " + pos;
    elements[0] = nameEl;

    // stats
    let statsEl = gen(P_TAG);
    statsEl.classList.add(STATS_CLASS);
    makeElementAddTextAppendChild(SPAN_TAG, "PPG: " + stats[0], statsEl);
    makeElementAddTextAppendChild(SPAN_TAG, "RPG: " + stats[1], statsEl);
    makeElementAddTextAppendChild(SPAN_TAG, "APG: " + stats[2], statsEl);
    elements[1] = statsEl;

    // price
    let priceEl = gen(P_TAG);
    priceEl.classList.add(PRICE_CLASS);
    priceEl.textContent = "Price: $" + price;
    elements[2] = priceEl;

    return elements;
  }

  /**
   * Creates and returns a new Player card, from the given parameters.
   * @param {JSON} player The playerJSON object to make a player card out of.
   * @returns {Element} Player element (<section class="card">)
   */
  function createPlayerCard(player) {
    let playerStats = [player["pts"], player["trb"], player["ast"], player["stl"], player["blk"]];
    let card = gen(SECTION_TAG);

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
    card.appendChild(nameStatsPriceArr[2]);

    // buttons
    card.appendChild(createCardShopButtons());

    // add playerId
    card.setAttribute('id', "pid" + player["playerId"]);

    card.classList.add(CARD_CLASS);
    card.classList.add(player["team_name"].replace(/\s/g, "")); // removes spaces from teamname
    card.classList.add(player["team_name"].replace(/\s/g, "")+ "2"); // removes spaces from teamname
    return card;
  }

  /**
   * Creates and returns a new Player card in list form, from the given parameters.
   * @param {JSON} player The playerJSON object to make a player card out of.
   * @returns {Element} Player element (<section class="list-card">)
   */
  function createPlayerListCard(player) {
    let playerStats = [player["pts"], player["trb"], player["ast"], player["stl"], player["blk"]];
    let listCard = gen(SECTION_TAG);
    listCard.classList.add("list-card");
    listCard.classList.add(player["team_name"].replace(/\s/g, "")); // removes spaces from teamname
    listCard.classList.add(player["team_name"].replace(/\s/g, "")+ "2"); // removes spaces from teamname

    let headshot = getHeadshotImg(player["playerId"], player["player_name"]);

    let nameStatsPriceArr = createPlayerNameStatsPrice(player["player_name"], player["pos"],
    playerStats, player["price"]);

    // add playerId
    listCard.setAttribute('id', "pid" + player["playerId"]);
    let badgesSection = gen(SECTION_TAG);
    badgesSection.classList.add("badges-section-list");
    makeElementAddTextAppendChild("p", "Badges: ", badgesSection);

    let badges = getBadgesList(playerStats, player["playerId"]);
    if(badges.length == 0) {
      makeElementAddTextAppendChild("p", "None", badgesSection);
    }
    for(let i = 1; i <= badges.length; i++) { //creates badges
      badgesSection.appendChild(getBadgeImg(badges[i-1]));
    }
    listCard.appendChild(createLogo(player["team_name"], player["teamId"]));
    listCard.appendChild(headshot);
    listCard.appendChild(nameStatsPriceArr[0]);
    listCard.appendChild(nameStatsPriceArr[1]);
    listCard.appendChild(badgesSection);
    listCard.appendChild(nameStatsPriceArr[2]);
    listCard.appendChild(createCardShopButtons());

    return listCard;
  }

  /**
   * Adds the given player to the Browser's card showcase.
   * @param {Element} player player object from createPlayerCard()
   * @returns {void}
   */
  function addPlayerToShowcase(player) {
    let cardShowcase = id(CARDSHOWCASE_ID);
    cardShowcase.appendChild(player);
  }

  /**
   * Handler for the Purchase button on a player card.
   * Will add the corresponding player to the cart, and
   * updates the cart's state.
   * @returns {void}
   */
  async function purchaseCard() {
    let playerId = this.parentNode.parentNode.id.substring(3);
    let playerTeam = this.parentNode.parentNode.classList[1];
    let posAndPlayerName = this.parentNode.parentNode.querySelector('h2').textContent.split(" | ");
    let playerName = posAndPlayerName[0];
    let pos = posAndPlayerName[1];
    let price;
    try {
      price = parseInt(this.parentNode.parentNode.querySelector('.price').textContent.substring(8));
    } catch {
      price = 9999;
    }
    if(!_currentUser) {
      id(CARTPURCHASESTATUS_ID).textContent = "Login."
    } else {
      id(CARTPURCHASESTATUS_ID).textContent = ""
    }
    addPlayerToCart(playerId, playerTeam, playerName, pos, price);
    setLocalStorageCart();
    qs("#cart-price > span").textContent = "$" + (playerCartPrices.reduce((sum, b) => sum + b, 0));
  }

  function setLocalStorageCart() {
    let currentDate = new Date();
    let localStorageCart = {
      "player-cart": playerCart,
      "current-time": currentDate.toString()
    }
    window.localStorage.setItem("player-cart-storage", JSON.stringify(localStorageCart));
  }

  async function addPlayerToCartFetch(playerId) {
    try {
      let playerData = await fetch(API_URL + "/player/" + playerId);
      await statusCheck(playerData);
      playerData = await playerData.json();
      let teamNameClass = playerData["team_name"].replace(/\s/g, "");
      addPlayerToCart(playerData["playerId"], teamNameClass, playerData["player_name"],
                      playerData["pos"], playerData["price"]);
    } catch (err) {
      console.error(error);
    }
  }

  function addPlayerToCart(playerId, teamNameClass, playerName, pos, price) {
    let playerInCart = makePlayerInCartCard(playerId, teamNameClass, playerName, pos, true);
    playerCart.push(playerId);
    playerCartPrices.push(price);
    qs("#cart-price > span").textContent = "$" + (playerCartPrices.reduce((sum, b) => sum + b, 0));
    if (playerCart.length === 1) {
      id(CARTPURCHASEBTN_ID).disabled = false;
      id("cart-img").src = "imgs/cart-items.png";
      id("cart-img").alt = "A shopping cart filled in with grey.";
    } else if (playerCart.length === CART_SIZE) {
      id("cart-img").src = "imgs/cart-filled.png";
      id("cart-img").alt = "A shopping cart filled in with black.";
    }
    id("right-sidebar").insertBefore(playerInCart, id("right-sidebar").children[1]);
  }

  function makePlayerInCartCard(playerId, teamNameClass, playerName, pos, isRemovable) {
    let playerInCart = gen(SECTION_TAG);
    playerInCart.classList.add("pid" + playerId);
    playerInCart.classList.add(teamNameClass);
    playerInCart.classList.add("playerInCart");

    // image of player
    let cartPlayerImg = document.createElement(IMG_TAG);
    cartPlayerImg.src = NBA_HEADSHOT_IMAGE_URL + playerId + ".png";
    cartPlayerImg.alt = "Headshot image of " + playerName + ", NBA player.";
    let posAndButton = gen("section");
    makeElementAddTextAppendChild("p", pos, posAndButton);

    // button to remove player
    if(isRemovable) {
      let removeFromCartBtn = gen(BUTTON_TAG);
      removeFromCartBtn.textContent = "X";
      removeFromCartBtn.addEventListener("click", removeFromCart);
      posAndButton.appendChild(removeFromCartBtn);
    }

    playerInCart.appendChild(posAndButton);
    playerInCart.appendChild(cartPlayerImg);
    return playerInCart;
  }

  /**
   * Removes a player from the cart. Changes the shopping cart image depending on how
   * full the cart is.
   * @returns {void}
   */
  function removeFromCart() {
    let playerId = this.parentNode.parentNode.getAttribute("playerid");

    // removes playerId from cart
    playerCart.splice(playerCart.indexOf(playerId), 1);
    playerCartPrices.splice(playerCart.indexOf(playerId), 1);
    setLocalStorageCart();
    qs("#cart-price > span").textContent = "$" + (playerCartPrices.reduce((sum, b) => sum + b, 0));
    this.parentNode.parentNode.remove();
    if (playerCart.length < CART_SIZE) {
      id("cart-img").src = "imgs/cart-items.png";
      id("cart-img").alt = "A shopping cart filled in with grey.";
      if (playerCart.length === 0) {
        id(CARTPURCHASEBTN_ID).disabled = true;
        if(!_currentUser) {
          id(CARTPURCHASESTATUS_ID).textContent = "Login."
        } else {
          id(CARTPURCHASESTATUS_ID).textContent = "Add players."
        }
        id("cart-img").src = "imgs/cart-empty.png";
        id("cart-img").alt = "A shopping cart not filled in.";
      }
    }
  }

  async function confirmationPopup() {
    id("confirm-purchase-text").textContent = "";
    id("confirm-purchase-btn").disabled = false;
    let totalPrice = 0;
    let playerJSONs = [];
    for(let i = 0; i < playerCart.length; i++) {
      try {
        let playerData = await fetch(API_URL + "/player/" + playerCart[i]);
        await statusCheck(playerData);
        playerData = await playerData.json();
        playerJSONs.push(playerData);
        totalPrice += playerData["price"];
      } catch (err) {
        console.error(err);
      }
    }
    id("confirm-purchase-players").innerHTML = "";
    if (totalPrice > 0)  { //NEEEEEEED TO ADD CHECK IF YOU GOT MONEY
      for(let i = 0; i < playerJSONs.length; i++) {
        let teamNameClass = playerJSONs[i]["team_name"].replace(/\s/g, "");
        id("confirm-purchase-players").appendChild(makePlayerInCartCard(playerJSONs[i]["playerId"],
                              teamNameClass, playerJSONs[i]["player_name"], playerJSONs[i]["pos"],
                              false));
      }
    }
    id("confirm-purchase-price").textContent = "$" + totalPrice;
    qs("body").classList.add("stopScrolling");
    id("confirm-purchase-popup").showModal();
  }

  /**
   * Using globals playerCart and playerCartPrices,
   * save the selected players to the user's account.
   * If a user is not currently logged in, does not proceeed.
   */
  function saveLineup() {
    if (playerCart.length !== 0) {
      let teamString = "";
      if (playerCart.length > 0) {
        teamString += String(playerCart[0]);
        if (playerCart.length > 1) {
          for (let i = 1; i < playerCart.length; i++) {
            teamString += ",";
            teamString += String(playerCart[i]);
          }
        }
      }
      submitUpdateTeam(teamString);
    }
  }

  /**
   * For the current user, requests for the given team string to be
   * added to the user's account on the server.
   * Assumes user is already logged in on the server.
   */
  async function submitUpdateTeam(teamString) {
    if (_currentUser) {
      try {
        let params = new FormData();
        params.append(TEAMSTRING, teamString);
        let result = await fetch(APIURL_ADDLINEUP, { method : "POST", body : params });
        await statusCheck(result);
        let resultText = await result.text();
        // handleLoginResponse(true, resultText, _currentUser);
        // console.log(resultText);
        let playersInCart = qsa("#right-sidebar > .playerInCart");
        for(let i = 0; i < playersInCart.length; i++) {
          playersInCart[i].remove();
        }
        playerCart = [];
        playerCartPrices = [];
        id("confirm-purchase-btn").disabled = true;
        id("confirm-purchase-text").textContent = resultText;
      } catch (error) {
        id("confirm-purchase-text").textContent = error.message;
      }
    } else {
      id("confirm-purchase-text").textContent = "Login."
    }
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