(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.config = factory());
})(this, (function () { 'use strict';

  const configQueryMap={"navbar-vertical-collapsed":"phoenixIsNavbarVerticalCollapsed","color-scheme":"phoenixTheme","navigation-type":"phoenixNavbarPosition","vertical-navbar-appearance":"phoenixNavbarVerticalStyle","horizontal-navbar-shape":"phoenixNavbarTopShape","horizontal-navbar-appearance":"phoenixNavbarTopStyle"},CONFIG={phoenixIsNavbarVerticalCollapsed:!1,phoenixTheme:"light",phoenixNavbarTopStyle:"default",phoenixNavbarVerticalStyle:"default",phoenixNavbarPosition:"vertical",phoenixNavbarTopShape:"default",phoenixIsRTL:!1},urlSearchParams=new URLSearchParams(window.location.search),params=Object.fromEntries(urlSearchParams.entries());console.log({params:params}),Object.keys(params).length>0&&Object.keys(params).includes("theme-control")&&Object.keys(CONFIG).forEach((a=>{localStorage.setItem(a,CONFIG[a]);})),Object.keys(params).forEach((a=>{console.log({param:a}),console.log(configQueryMap[a],params[a]),configQueryMap[a]&&localStorage.setItem(configQueryMap[a],params[a]);})),Object.keys(CONFIG).forEach((a=>{null===localStorage.getItem(a)&&localStorage.setItem(a,CONFIG[a]);})),JSON.parse(localStorage.getItem("phoenixIsNavbarVerticalCollapsed"))&&document.documentElement.classList.add("navbar-vertical-collapsed"),"dark"===localStorage.getItem("phoenixTheme")&&document.documentElement.classList.add("dark"),"horizontal"===localStorage.getItem("phoenixNavbarPosition")&&document.documentElement.classList.add("navbar-horizontal"),"combo"===localStorage.getItem("phoenixNavbarPosition")&&document.documentElement.classList.add("navbar-combo");var config = {config:CONFIG};

  return config;

}));
//# sourceMappingURL=config.js.map
