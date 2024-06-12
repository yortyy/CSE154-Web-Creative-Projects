/**
 * This is the index.js page for BlazBattle. BlazBattle is a game where users can make their own
 * fighter, change the settings, scene, enemy and location of the fight, then watch their fighters
 * battle. The javascript file allows this to work, by fetching api data and making changes in the
 * DOM to reflect a "fight."
 */

"use strict";
(function() {
  var x=3;
  const AMIIBO_API_URL = "https://www.amiiboapi.com/api/";
  const ZIPPOPOTAM_API_URL = "https://api.zippopotam.us/";
  const FIRE_SCENE_START = ", smoke arose from the left side of town. Under the smoke an ashes, " +
                          "your house was aflame. In the depths of the blazing fire, you see a " +
                          "moving shadow. You rush in, hoping to save them. When you reach out " +
                          "to them though, they had other plans. POW! They punch you in the " +
                          "face. Thinking they might be responsible for the fire, you call on " +
                          "your best fighter to beat up the arsonist.";
  const FIRE_SCENE_END = "In a fierce battle, you and your fighter was victorious. As your " +
                         "house burned down, you and your fighter rushed out of the house. The " +
                         "beaten down enemy tried to reach out and drag you into the fire, but " +
                         "ran out of strength and gave up. Outside of your house, you and your " +
                         "fighter are showered with congrats as both of you have prevented " +
                         "future arson attacks. You saved ";
  let fighterImage;
  let scene;
  let hometownAndEnemy;

  window.addEventListener("load", init);

  /**
   * This initialization function adds the event listeners and disables the fight and
   * continue buttons.
   */
  function init() {
    id("makefighterbtn").addEventListener("click", makeFighter);
    id("fightbtn").addEventListener("click", fightButton);
    id("fightbtn").disabled = true;
    id("continuebtn").disabled = true;
  }

  /**
   * Creates a fighter image node based on the page's dropdown values. This image node replaces
   * the existing fighter image. The image node is set as the fighterImage variable. Also, the
   * fight button is enabled.
   */
  function makeFighter() {
    let fighter = id("fighter-select").value;
    let color = id("color-select").value;
    let size = id("size-select").value;
    let redText = qs("button + p > strong");
    redText.textContent = size + " " + color + " " + fighter;
    fighterImage = document.createElement("img");
    fighterImage.classList.add(fighter);
    fighterImage.setAttribute('id', "fighter");
    fighterImage.src = "imgs/" + fighter + ".gif";
    fighterImage.alt = "a " + size + " " + color + " " + fighter;
    if (!(color === "")) {
      fighterImage.classList.add(color);
    }
    if (!(size === "")) {
      fighterImage.classList.add(size);
    }
    qs("main > section").replaceChild(fighterImage, id("fighter"));
    if (id("fightbtn").disabled) {
      id("fightbtn").disabled = false;
    }
  }

  /**
   * Starts the fight. First gets the hometown and enemy using the user input fields and
   * the corresponding apis. Both the hometown and enemy are made / fetched asynchronously,
   * awaiting both of them using Promise.all. After both promises are fulfilled, startStory
   * is called using the returned values from getHometown and getEnemy. An error is thrown
   * if the fight fails in the middle of startStory.
   */
  function fightButton() {
    clearErrors();

    /**
     * https://stackoverflow.com/questions/35612428/call-async-await-functions-in-parallel
     * Promise.all learned from stackoverflow, as a way to await two functions asynchronously in
     * parallel.
     */
    Promise.all([new Promise(getHometown), new Promise(getEnemy)])
      .then(startStory)
      .catch(err => errorHandler(err, "fight"));
  }

  /**
   * Gets an enemy image node using user input and an AmiiboAPI fetch request. An error will
   * throw if the fetch request, the statusCheck, or making the enemy was unsuccessful. This
   * error will show on the pade in the form of red text. Returns object in the form of a promise.
   * @param {Function} resolve - Given by it being a promise. Resolves the promise.
   * @returns {Promise<Object>} - a promise to be the enemyImage img object.
   */
  function getEnemy(resolve) {
    return fetch(AMIIBO_API_URL + "amiibo/?character=" + id("enemy-select").value + "&type=figure")
      .then(statusCheck)
      .then(res => res.json())
      .then(makeEnemy)
      .then(resolve)
      .catch(err => errorHandler(err, "amiibo"));
  }

  /**
   * Gets hometown information using user input and a zippopotamus fetch request. An error will
   * throw if the fetch request, the statusCheck, or setHometown was unsuccessful. This
   * error will show on the pade in the form of red text. Resolves info in the form of a promise.
   * @param {Function} resolve - Given by it being a promise. Resolves the promise.
   * @returns {Promise<Array>} - a promise to be an array with hometown information.
   */
  function getHometown(resolve) {
    return fetch(ZIPPOPOTAM_API_URL + id("zip-select-country").value + "/" + id("zip-select").value)
      .then(statusCheck)
      .then(res => res.json())
      .then(setHometown)
      .then(resolve)
      .catch(err => errorHandler(err, "zip"));
  }

  /**
   * Returns the DOM img object corresponding to the given amiibo search JSON object. If
   * it's unable to find an amiibo out of the given JSON, then an error is thrown.
   * @param {JSON} res - JSON object of the amiiboAPI search.
   * @returns {object} - DOM img object of the amiibo.
   */
  function makeEnemy(res) {
    if (res.amiibo[0] === undefined) {
      throw new Error("Amiibo not found");
    }
    let enemyObj = res.amiibo[0];
    let enemyImage = document.createElement("img");
    enemyImage.setAttribute('id', "stageenemy");
    enemyImage.src = enemyObj.image;
    enemyImage.alt = enemyObj.character + " from " + enemyObj.gameSeries + " as an Amiibo ";
    return enemyImage;
  }

  /**
   * Returns the array of place informaiton corresponding to the given zippopotomus zip fetch JSON
   * object. If it's unable to find the place out of the given JSON, then an error is thrown.
   * @param {JSON} res - JSON object of the zippopotomus zip fetch.
   * @returns {Array} - An array containing the place name and state.
   */
  function setHometown(res) {
    if (res.places[0] === undefined) {
      throw new Error("Place not found");
    }
    return [res.places[0]['place name'], res.places[0].state];
  }

  /**
   * Searches for any objects with the "error" class. If any of those objects don't have the
   * "hidden" class, then the "hidden" class is added.
   */
  function clearErrors() {
    let errorPs = document.querySelectorAll(".error");
    let errorCount = errorPs.length;
    for (let i = 0; i < errorCount; i++) {
      if (!errorPs[i].classList.contains("hidden")) {
        errorPs[i].classList.add("hidden");
      }
    }
  }

  /**
   * Removes the click event listener from continuebtn that calls the given outFunc function.
   * Then adds a click event listener to continuebtn that calls the given inFunc function.
   * @param {Function} outFunc - The function in a click event listener attached to continuebtn
   *                             that is to be removed.
   * @param {Function} inFunc - The function to be called in a new click event listener attached to
   *                            continuebtn.
   */
  function switchContinueEventListener(outFunc, inFunc) {
    id("continuebtn").removeEventListener("click", outFunc);
    id("continuebtn").addEventListener("click", inFunc);
  }

  /**
   * Starts the story for the fight by disabling buttons and hiding images on the fightstage.
   * Also starts the story by showing the story text on the fight stage. Adds an event listener
   * to the continuebtn, so that the user can progress the fight.
   * @param {Array} res - Array of the enemyImage and hometown information.
   */
  function startStory(res) {
    hometownAndEnemy = res;
    scene = id("scene-select").value;
    id("fightbtn").disabled = true;
    id("makefighterbtn").disabled = true;
    id("continuebtn").disabled = false;
    id("stagefighter").classList.add("hidden");
    id("stageenemy").classList.add("hidden");
    id("fightstage").appendChild(createStoryText(true));
    id("continuebtn").addEventListener("click", setStage);
  }

  /**
   * Sets the stage by making sure that the stageenemy and stagefighter show, that the stage
   * background is correct, and that everything else regarding the fight is correct. Adds and
   * removes an event listener to the continuebtn, so that the user can progress the fight.
   */
  function setStage() {
    id("continuebtn").textContent = "Attack!";
    switchContinueEventListener(setStage, continueToFight);
    if (scene === "fire") {
      id("fightstage").classList.add("firebg");
    }
    qs("#fightstage > p").remove();
    id("fightstage").replaceChild(hometownAndEnemy[1], id("stageenemy"));
    id("fightstage").replaceChild(fighterImage, id("stagefighter"));
    fighterImage.setAttribute('id', "stagefighter");
    qs("main > section").appendChild(createGuyOnFire("fighter"));
    id("stagefighter").classList.remove("hidden");
    id("stageenemy").classList.remove("hidden");
  }

  /**
   * Coninues to fight by changing the stagefighter's image to it's attacking variant. Adds
   * and removes an event listener to the continuebtn, so that the user can progress the fight.
   */
  function continueToFight() {
    id("stagefighter").src = "imgs/" + id("stagefighter").classList[0] + "attacking.gif";
    id("continuebtn").textContent = "Attack!!";
    switchContinueEventListener(continueToFight, continueFightFlexAttack);
  }

  /**
   * Coninues to fight by adding a class to the stagefighter that brings it closer to the enemy
   * (margin-left: auto). Adds and removes an event listener to the continuebtn, so that the
   * user can progress the fight.
   */
  function continueFightFlexAttack() {
    id("stagefighter").classList.add("flexattack");
    id("continuebtn").textContent = "Continue";
    switchContinueEventListener(continueFightFlexAttack, finishFight);
  }

  /**
   * Finishes the fight by removing everything from the stage and showing the end story text. Adds
   * and removes an event listener to the continuebtn, so that the user can progress the fight.
   */
  function finishFight() {
    id("stagefighter").remove();
    id("stageenemy").remove();
    id("fightstage").appendChild(createStoryText(false));
    switchContinueEventListener(finishFight, resetStage);
  }

  /**
   * Resets the stage by putting back the guys on fire, removing the story text, removing the
   * background, removing the background and enabling/disabling the corresponding buttons.
   */
  function resetStage() {
    id("fightstage").appendChild(createGuyOnFire("stagefighter"));
    id("fightstage").appendChild(createGuyOnFire("stageenemy"));
    id("storyText").remove();
    if (scene === "fire") {
      id("fightstage").classList.remove("firebg");
    }
    id("continuebtn").removeEventListener("click", resetStage);
    id("continuebtn").disabled = true;
    id("makefighterbtn").disabled = false;
  }

  /**
   * Creates a story text string according to the scene and if it's the start or end of the fight.
   * @param {Boolean} isStart - true if the story text is for the start of the fight.
   * @returns {string} - the story text string.
   */
  function createStoryText(isStart) {
    let storyText = document.createElement("p");
    storyText.setAttribute('id', "storyText");
    let story;
    if (isStart) {
      story = "In " + hometownAndEnemy[0][0] + ", " + hometownAndEnemy[0][1];
      if (scene === "fire") {
        story += FIRE_SCENE_START;
      } else {
        throw new Error("Scene not found");
      }
    } else {
      if (scene === "fire") {
        story = FIRE_SCENE_END;
      } else {
        throw new Error("Scene not found");
      }
      story += hometownAndEnemy[0][0] + ", " + hometownAndEnemy[0][1] + "! THE END.";
    }
    storyText.textContent = story;
    return storyText;
  }

  /**
   * Creates an img element of a guy on fire. Sets the id to the given id.
   * @param {strign} id - the chosen id for the guy on fire element.
   * @returns {object} - the guy on fire img element.
   */
  function createGuyOnFire(id) {
    let guyOnFire = document.createElement("img");
    guyOnFire.src = "imgs/guyonfire.gif";
    guyOnFire.alt = "a guy on fire animation from Metal Slug";
    guyOnFire.setAttribute('id', id);
    return guyOnFire;
  }

  /**
   * Handles errors according to the given type. Shows the errors in red text.
   * @param {Error} err - the error passed through catch, used for debugging.
   * @param {string} type - the type of error, used to know what error text to show the user.
   */
  function errorHandler(err, type) {
    let errorText;
    if (type === "amiibo") {
      errorText = qs("#enemy-select ~ .error");
    } else if (type === "zip") {
      errorText = qs("#zip-select ~ .error");
    } else if (type === "fight") {
      errorText = qs("#fightbtn + .error");
    }
    console.error(err);
    errorText.classList.remove("hidden");
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
   * Returns first element matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} - DOM object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }
})();