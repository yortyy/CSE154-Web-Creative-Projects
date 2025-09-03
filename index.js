/**
 * index.js for CSE 154 creative project homepage. Sets the background using a button.
 */


"use strict";

(function() {
  const NUMBER_OF_BACKGROUNDS = 6;
  let currentBackground = 4;
  let pastBackground = 0;
  let past2Background = 0;
  let past3Background = 0;

  window.addEventListener("load", init);

  function init() {
    qs("#bgchange").addEventListener("click", changeBG);
  }

  function changeBG() {
    let rand = Math.ceil(Math.random() * NUMBER_OF_BACKGROUNDS);
    while(rand == currentBackground || rand == pastBackground || rand == past2Background ||
          rand == past3Background) {
      rand = Math.ceil(Math.random() * NUMBER_OF_BACKGROUNDS);
    }
    past3Background = past2Background;
    past2Background = pastBackground;
    pastBackground = currentBackground;
    currentBackground = rand;
    qs("body").style.backgroundImage = "url(imgs/backgrounds/" + rand + ".gif)";
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
