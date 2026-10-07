/* Crust prototype game rules. No network or account dependency. */
(function(root){
'use strict';
const recipes=[
{id:'margherita',name:'Margherita',emoji:'🍕',cost:12,price:9,seconds:12,level:1,detail:'Tomato, mozzarella & basil'},
{id:'pepperoni',name:'Pepperoni',emoji:'🍕',cost:20,price:14,seconds:18,level:2,detail:'The crispy, spicy favorite'},
{id:'garden',name:'Garden Party',emoji:'🥦',cost:28,price:20,seconds:25,level:3,detail:'Peppers, mushrooms & goodness'}];
function fresh(){return {version:1,coins:120,xp:0,ovens:[null],stock:[0,0,0],capacity:2,speed:0,served:0,earned:0,seenHelp:false};}
function level(s){return Math.floor(s.xp/30)+1;}
function valid(s){return !!s&&s.version===1&&Number.isFinite(s.coins)&&s.coins>=0&&Number.isInteger(s.xp)&&s.xp>=0&&Array.isArray(s.ovens)&&s.ovens.length>=1&&s.ovens.length<=3&&s.ovens.every(o=>o===null||(Number.isInteger(o.recipe)&&o.recipe>=0&&o.recipe<3&&Number.isFinite(o.start)&&Number.isFinite(o.end)&&o.end>=o.start))&&Array.isArray(s.stock)&&s.stock.length===3&&s.stock.every(n=>Number.isInteger(n)&&n>=0)&&Number.isInteger(s.capacity)&&s.capacity>=2&&s.capacity<=3&&Number.isInteger(s.speed)&&s.speed>=0&&s.speed<=2&&Number.isInteger(s.served)&&s.served>=0&&Number.isFinite(s.earned)&&s.earned>=0;}
function bake(s,i,now){const r=recipes[i];if(!r||level(s)<r.level)return {ok:false,message:'This recipe is still locked.'};let oven=s.ovens.indexOf(null);if(oven<0)return {ok:false,message:'All ovens are busy. Collect a batch first!'};if(s.coins<r.cost)return {ok:false,message:'Not enough coins for these ingredients.'};s.coins-=r.cost;s.ovens[oven]={recipe:i,start:now,end:now+r.seconds*1000*(1-s.speed*.2)};return {ok:true,oven};}
function collect(s,i,now){const o=s.ovens[i];if(!o||now<o.end)return false;s.stock[o.recipe]+=4;s.ovens[i]=null;return true;}
function serve(s,i){if(!recipes[i]||s.stock[i]<1)return false;s.stock[i]--;return true;}
function pay(s,i){let price=recipes[i].price;s.coins+=price;s.earned+=price;s.served++;s.xp+=5;return price;}
function upgrade(s,key){let price;if(key==='oven'){if(s.ovens.length>=3)return false;price=s.ovens.length===1?100:220;if(s.coins<price+12)return false;s.coins-=price;s.ovens.push(null);}else if(key==='table'){if(s.capacity>=3||s.coins<92)return false;s.coins-=80;s.capacity++;}else if(key==='speed'){price=s.speed===0?120:240;if(s.speed>=2||s.coins<price+12)return false;s.coins-=price;s.speed++;}else return false;return true;}
const api={recipes,fresh,valid,level,bake,collect,serve,pay,upgrade};root.CrustEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
