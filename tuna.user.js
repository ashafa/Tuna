// ==UserScript==
// @name Tuna
// @description Unobtrusively provides twitter screen name auto complete functionality for status text input on twitter.com.
// @namespace ashafa.com
// @include http://twitter.com/
// @include http://twitter.com/*
// @include http://www.twitter.com/*
// @include https://twitter.com/
// @include https://twitter.com/*
// @include https://www.twitter.com/*
// ==/UserScript=
(function(){
   document.body.appendChild(document.createElement('script')).src='http://ashafa.com/tuna/tuna.js?nocache='+new Date().getTime();
})();