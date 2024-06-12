"use strict";
(function() {
  window.addEventListener("load", init);

  /**
   * This initialization function adds the event listeners and disables the fight button.
   */
  function init() {
    id("makefighterbtn").addEventListener("click", makeFighter);
    id("fight").addEventListener("click", fight);
    id("fight").disabled = true;
  }

  /**
   * Creates a fighter image based on the page's dropdown values. If a fighter image already
   * exists, the existing fighter image is replaced with the newly created image.
   */
  function makeFighter() {
    let fighter = id("fighter-select").value;
    let color = id("color-select").value;
    let size = id("size-select").value;
    let redText = qs("button + p > strong");
    redText.textContent = size + " " + color + " " + fighter;
    let fighterImage = document.createElement("img");
    fighterImage.classList.add(fighter);
    fighterImage.src = "imgs/" + fighter + ".gif";
    fighterImage.alt = "a " + size + " " + color + " " + fighter;
    if (!(color === "")) {
      fighterImage.classList.add(color);
    }
    if (!(size === "")) {
      fighterImage.classList.add(size);
    }
    if (!qs("button + p + img")) {
      qs("main > section").insertBefore(fighterImage, id("fight"));
    } else {
      qs("main > section").replaceChild(fighterImage, qs("button + p + img"));
    }
    if (id("fight").disabled) {
      id("fight").disabled = false;
    }
  }

  /**
   * Changes the fighter image source to an "attacking" gif, based on what fighter the image is.
   */
  function fight() {
    qs("button + p + img").src = "imgs/" + qs("button + p + img").classList[0] + "attacking.gif";
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