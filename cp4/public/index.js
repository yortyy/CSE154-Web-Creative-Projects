/**
 * This is the index.js page contains the client code for Lebron's Legacy, a basketball simulation
 * game featuring LeBron James. The simulation allows users to select a version of LeBron James
 * (Heat, Cavs, or Lakers) and simulate shooting basketball shots based on LeBron's shooting
 * attributes. Users can click on the court to simulate shooting a basketball. The game
 * keeps track of game statistics such as points, field goals made, and shooting percentages,
 * showing the end results after 10 shots.
 */

"use strict";
(function() {
  const IMAGE_MIDDLE_OFFSET = 50;
  const MAX_SHOTS = 10;
  const TO_PERC = 1000;
  const TO_PERC_RNDED = 100;
  const TENTHS = 10;
  const GREAT_FGM = 7;
  const GOOD_FGM = 5;
  const GREAT_3PM = 6;
  const GOOD_3PM = 3;
  let lebronType;
  let gameId;
  let shotNumber = 0;
  let shotLocation = [0, 0];

  const API_URL = "https://cse154-lebrons-legacy-api.onrender.com";

  window.addEventListener("load", init);

  /**
   * This initialization function initializes the program.
   */
  function init() {
    setOptionsLebron();
    id("type-select").addEventListener("change", setOptionsLebron);
    id("court").addEventListener("click", courtClick);
    id("ballbtn").addEventListener("click", playGame);
    id("shootbtn").addEventListener("click", shootBall);
  }

  /**
   * Sets the attributes and picture for LeBron, based on the user selection and fetched data.
   */
  function setOptionsLebron() {
    let type = id("type-select").value;
    id("options-lebron").src = "imgs/lebron/" + type + ".png";
    id("options-lebron").alt = "LeBron James on the" + type + " headshot";
    id("lebron").src = "imgs/lebron/" + type + ".png";
    id("lebron").alt = "LeBron James on the" + type + " headshot";
    fetch(API_URL + "/get/" + type)
      .then(statusCheck)
      .then(resp => resp.json())
      .then(setAttributes)
      .catch(errorHandler);
  }

  /**
   * Starts the game session.
   */
  function playGame() {
    id("settings").classList.add("hidden");
    id("court").classList.remove("hidden");
    qs("#end-game + button").classList.remove("hidden");
    qs("section > h2").textContent = "LeBron's Legacy";
    lebronType = id("type-select").value;

    let data = new FormData();
    data.append("type", lebronType);

    fetch(API_URL + "/game/start", {method: "POST", body: data})
      .then(statusCheck)
      .then(resp => resp.text())
      .then(resp => {gameId = resp;})
      .catch(errorHandler);

  }

  /**
   * Sets LeBron's attributes in the options menu based on the fetched data.
   * @param {JSON} lebronJSON - JSON object containing LeBron's attributes.
   */
  function setAttributes(lebronJSON) {
    let attributes = lebronJSON["attributes"];
    id("rim").textContent = Math.round(attributes["rim"] * TO_PERC) / TENTHS + "%";
    id("threeten").textContent = Math.round(attributes["3-10"] * TO_PERC) / TENTHS + "%";
    id("tensixteen").textContent = Math.round(attributes["10-16"] * TO_PERC) / TENTHS + "%";
    id("sixteenthree").textContent = Math.round(attributes["16-3pt"] * TO_PERC) / TENTHS + "%";
    id("three").textContent = Math.round(attributes["3pt"] * TO_PERC) / TENTHS + "%";
  }

  /**
   * Shoots the basketball during the game.
   */
  function shootBall() {
    id("shootbtn").disabled = true;
    let data = new FormData();
    data.append("gameId", gameId);
    data.append("shotLocationX", shotLocation[0]);
    data.append("shotLocationY", shotLocation[1]);
    fetch(API_URL + "/game/shoot", {method: "POST", body: data})
      .then(statusCheck)
      .then(resp => resp.text())
      .then(shotText => {qs("#court > p").textContent = shotText;})
      .then(endGameCheck)
      .catch(errorHandler);
  }

  /**
   * Checks if the game has ended.
   */
  function endGameCheck() {
    id("shootbtn").disabled = false;
    shotNumber += 1;
    if (shotNumber === MAX_SHOTS) {
      fetch(API_URL + "/game/" + gameId + "/stats")
        .then(statusCheck)
        .then(resp => resp.json())
        .then(endGame)
        .catch(errorHandler);
    }
  }

  /**
   * Ends the current game and displays the end game statistics and gifs.
   * @param {JSON} stats - JSON object containing game statistics.
   */
  function endGame(stats) {
    id("court").classList.add("hidden");
    id("end-game").classList.add(lebronType + "bg");
    id("end-game").classList.remove("hidden");
    qs("#end-game + button").textContent = "Continue";
    id("shootbtn").removeEventListener("click", shootBall);
    id("shootbtn").addEventListener("click", restartGame);
    qs("section > h2").textContent = "Well done!";
    if (stats["FGM"] >= GREAT_FGM || stats["3PM"] >= GREAT_3PM) {
      qs("section > h3").textContent = "You shot great!";
    } else if (stats["FGM"] >= GOOD_FGM || stats["3PM"] >= GOOD_3PM) {
      qs("section > h3").textContent = "You shot good.";
    } else {
      qs("section > h3").textContent = "You shot horrible. The aliens invaded!";
      let alienImg = document.createElement("img");
      alienImg.id = "alien";
      alienImg.src = "imgs/alien.gif";
      alienImg.alt = "Alien dancing on the statue of liberty gif.";
      id("end-game").children[0].appendChild(alienImg);
    }
    id("pts").textContent = ((stats["FGM"] - stats["3PM"]) * 2 + stats["3PM"] * 3) + " pts";
    id("fgs").textContent = stats["FGM"] + "/" + stats["FGs"];
    id("fgp").textContent = Math.round(stats["FGM"] / stats["FGs"] * TO_PERC_RNDED) + "%";
    id("tpm").textContent = stats["3PM"] + "/" + stats["3PA"];
    if (stats["3PA"] === 0) {
      id("tpp").textContent = "N/A";
    } else {
      id("tpp").textContent = Math.round(stats["3PM"] / stats["3PA"] * TO_PERC_RNDED) + "%";
    }
  }

  /**
   * Restarts the game session and brings the player back to the options menu.
   */
  function restartGame() {
    if (id("alien")) {
      id("alien").remove();
    }
    id("settings").classList.remove("hidden");
    id("end-game").classList.remove(lebronType + "bg");
    id("end-game").classList.add("hidden");
    id("shootbtn").removeEventListener("click", restartGame);
    id("shootbtn").addEventListener("click", shootBall);
    qs("#end-game + button").textContent = "Shoot!";
    qs("#end-game + button").classList.add("hidden");
    qs("section > h2").textContent = "Options";
    qs("#court > p").textContent = "Shoot your shot";
    lebronType = null;
    gameId = null;
    shotNumber = 0;
  }

  /**
   * Updates LeBron's position on the court to be at the same position as the user click.
   * @param {Event} event - The click event object.
   */
  function courtClick(event) {
    id("lebron").style.left = event.offsetX - IMAGE_MIDDLE_OFFSET + "px";
    id("lebron").style.top = event.offsetY - IMAGE_MIDDLE_OFFSET + "px";
    shotLocation = [event.offsetX, event.offsetY];
  }

  /**
   * Handles errors according to the given error object. Shows the error in red text and stops
   * the game.
   * @param {Error} err - The error object representing the error that occurred.
   */
  function errorHandler(err) {
    console.error(err);
    id("settings").classList.add("hidden");
    id("end-game").classList.add("hidden");
    id("court").classList.add("hidden");
    qs("#end-game + button").classList.add("hidden");
    id("error").classList.remove("hidden");
    id("error").textContent = err + "\n Please refresh the page!";
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
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID.
   * @returns {object} - DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Returns first element matching the selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} - DOM object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }
})();