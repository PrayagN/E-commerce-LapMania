(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  const{config:config}=window.config,{pathname:pathname}=window.location;console.log(pathname,config),Object.keys(config).forEach((a=>{localStorage.setItem(a,config[a]);})),document.documentElement.classList.remove("dark");const navbarTop=document.querySelector(".navbar-top"),navbarVertical=document.querySelector(".navbar-vertical");console.log(pathname.includes("/demo/dark-mode.html")),pathname.includes("/demo/dark-mode.html")&&(localStorage.setItem("phoenixTheme","dark"),document.documentElement.classList.add("dark")),pathname.includes("/demo/darknav.html")&&(localStorage.setItem("phoenixNavbarVerticalStyle","darker"),localStorage.setItem("phoenixNavbarTopStyle","darker"),navbarTop.classList.add("navbar-darker"),navbarVertical.classList.add("navbar-darker")),pathname.includes("/demo/sidenav-collapse.html")&&(localStorage.setItem("phoenixIsNavbarVerticalCollapsed","true"),document.documentElement.classList.add("navbar-vertical-collapsed")),pathname.includes("/demo/navbar-top-slim.html")&&(localStorage.setItem("phoenixNavbarTopShape","slim"),localStorage.setItem("phoenixNavbarPosition","horizontal")),pathname.includes("/demo/navbar-top.html")&&document.documentElement.classList.add("navbar-horizontal"),pathname.includes("/demo/topnav-slim.html")&&localStorage.setItem("phoenixNavbarTopShape","slim"),pathname.includes("/demo/horizontal-slim.html")&&(localStorage.setItem("phoenixNavbarTopShape","slim"),localStorage.setItem("phoenixNavbarPosition","horizontal"));

}));
//# sourceMappingURL=demo.js.map
