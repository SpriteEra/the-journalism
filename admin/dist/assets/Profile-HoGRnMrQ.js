import{c as ut,ai as ft,i as K,r as y,j as a,V as I,e as on,n as Re,X as pt,g as ht,v as cn,u as mt,Y as ln,P as dn,Z as $e,a2 as un,aB as fn,y as q,B as pn,U,ac as hn,al as mn,aa as J,b as ve,s as gn,p as bn,$ as Le,t as wn,K as yn,F as V,x as G,a3 as vn,A as xn,G as Nn}from"./index-CHeaM0Hc.js";import{g as In}from"./admin-CTloP9_i.js";import{r as Sn}from"./RangePicker-AhGiqz2g.js";import{S as ce,T as En}from"./Charts-CFHrtAkl.js";import{P as jn}from"./ProfileHeader-DybLrCv-.js";import{I as le}from"./InputFields-qK2Ffcee.js";import{L as te}from"./lock-BZdS05rs.js";import{A as _n}from"./AsyncWrapper-Cc4262ph.js";import{B as z}from"./bell-nTDUgQvL.js";import{B as gt,I as Cn}from"./ImageCropper-DV_is81k.js";import{u as An}from"./useTranslation-DeB83L9v.js";import{M as Fe}from"./mail-DiCtV0Xg.js";import{C as Tn}from"./calendar-days-B-T49iLK.js";import{P as bt}from"./pencil-D9sDXdH_.js";import{F as He}from"./file-text-nZYKtDjv.js";import{U as Ve}from"./user-C4-xLFLE.js";import{M as wt}from"./map-pin-Fv36Ljag.js";import{P as yt}from"./phone-Dk-LQ_sx.js";import{G as kn}from"./globe-DVz8L_VA.js";import{S as Dn,K as Ue}from"./shield-check-rtPwTu-v.js";import{S as Pn,M as On}from"./sun-DX9c-ekR.js";import{M as Bn}from"./monitor-z8P5H-UV.js";import{C as Mn}from"./camera-DUHoUoyF.js";import"./DateRangeFilter-f-WT7oJT.js";import"./Avatar-DXTbqVlG.js";import"./minus-BCzW8zqj.js";import"./plus-BiaLL2xP.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rn=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742",key:"178tsu"}],["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05",key:"1hqiys"}]],$n=ut("bell-off",Rn);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ln=[["path",{d:"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",key:"e79jfc"}],["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}]],Fn=ut("palette",Ln),Hn=async()=>{const{data:e}=await K.get("/profile");return e},Vn=()=>ft({queryKey:["profile"],queryFn:Hn,keepPreviousData:!0,staleTime:1e3*60*2}),Un=async()=>{const{data:e}=await K.get("/notification-preferences");return e},zn=()=>ft({queryKey:["notification-preference"],queryFn:Un,keepPreviousData:!0,staleTime:1e3*60*2}),qn=({onclose:e})=>{const[t,n]=y.useState({currentPassword:"",newPassword:"",confirmPassword:""}),[s,r]=y.useState(!1),o=l=>{const{name:u,value:d}=l.target;n(p=>({...p,[u]:d}))},i=l=>{const u=/[A-Z]/.test(l),d=/[0-9]/.test(l);return u&&d},c=async l=>{var w,S;l.preventDefault();const{currentPassword:u,newPassword:d,confirmPassword:p}=t;if(!u)return I.error("Current password is required");if(!d)return I.error("New password is required");if(d.length<8)return I.error("New password must be at least 8 characters long");if(!i(d))return I.error("New password must include at least 1 capital letter and 1 number");if(!p)return I.error("Please confirm your new password");if(d!==p)return I.error("New Password and confirm password do not match");r(!0);try{const{data:N}=await K.put("update-password",t);I.success("Password updated successfully"),e(),r(!1)}catch(N){I.error(((S=(w=N.response)==null?void 0:w.data)==null?void 0:S.message)||N.message||"Something went wrong")}finally{r(!1)}};return a.jsxs("form",{className:"space-y-4",onSubmit:c,children:[a.jsx(le,{LabelTitle:" Current Password",placeholder:"Enter your current password",required:!0,inputVal:t.currentPassword,type:"password",icon:te,handleInputValue:o,name:"currentPassword"}),a.jsx(le,{LabelTitle:"New Password",placeholder:"Enter your new password",required:!0,inputVal:t.newPassword,type:"password",icon:te,handleInputValue:o,name:"newPassword"}),a.jsx(le,{LabelTitle:"Confirm New Password",placeholder:"Enter your confirm new password",required:!0,inputVal:t.confirmPassword,type:"password",icon:te,handleInputValue:o,name:"confirmPassword"}),a.jsxs("div",{className:"flex justify-between mt-2",children:[a.jsx("button",{className:"btn-red-outline bg-transparent",onClick:e,children:"Cancel"}),a.jsx("button",{className:"btn-red",type:"submit",disabled:s,children:s?"Updating...":"Update"})]})]})};/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kn=()=>{};var ze={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vt=function(e){const t=[];let n=0;for(let s=0;s<e.length;s++){let r=e.charCodeAt(s);r<128?t[n++]=r:r<2048?(t[n++]=r>>6|192,t[n++]=r&63|128):(r&64512)===55296&&s+1<e.length&&(e.charCodeAt(s+1)&64512)===56320?(r=65536+((r&1023)<<10)+(e.charCodeAt(++s)&1023),t[n++]=r>>18|240,t[n++]=r>>12&63|128,t[n++]=r>>6&63|128,t[n++]=r&63|128):(t[n++]=r>>12|224,t[n++]=r>>6&63|128,t[n++]=r&63|128)}return t},Wn=function(e){const t=[];let n=0,s=0;for(;n<e.length;){const r=e[n++];if(r<128)t[s++]=String.fromCharCode(r);else if(r>191&&r<224){const o=e[n++];t[s++]=String.fromCharCode((r&31)<<6|o&63)}else if(r>239&&r<365){const o=e[n++],i=e[n++],c=e[n++],l=((r&7)<<18|(o&63)<<12|(i&63)<<6|c&63)-65536;t[s++]=String.fromCharCode(55296+(l>>10)),t[s++]=String.fromCharCode(56320+(l&1023))}else{const o=e[n++],i=e[n++];t[s++]=String.fromCharCode((r&15)<<12|(o&63)<<6|i&63)}}return t.join("")},xt={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let r=0;r<e.length;r+=3){const o=e[r],i=r+1<e.length,c=i?e[r+1]:0,l=r+2<e.length,u=l?e[r+2]:0,d=o>>2,p=(o&3)<<4|c>>4;let w=(c&15)<<2|u>>6,S=u&63;l||(S=64,i||(w=64)),s.push(n[d],n[p],n[w],n[S])}return s.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(vt(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):Wn(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const n=t?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let r=0;r<e.length;){const o=n[e.charAt(r++)],c=r<e.length?n[e.charAt(r)]:0;++r;const u=r<e.length?n[e.charAt(r)]:64;++r;const p=r<e.length?n[e.charAt(r)]:64;if(++r,o==null||c==null||u==null||p==null)throw new Gn;const w=o<<2|c>>4;if(s.push(w),u!==64){const S=c<<4&240|u>>2;if(s.push(S),p!==64){const N=u<<6&192|p;s.push(N)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class Gn extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Jn=function(e){const t=vt(e);return xt.encodeByteArray(t,!0)},Nt=function(e){return Jn(e).replace(/\./g,"")},Yn=function(e){try{return xt.decodeString(e,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xn(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qn=()=>Xn().__FIREBASE_DEFAULTS__,Zn=()=>{if(typeof process>"u"||typeof ze>"u")return;const e=ze.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},es=()=>{if(typeof document>"u")return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=e&&Yn(e[1]);return t&&JSON.parse(t)},ts=()=>{try{return Kn()||Qn()||Zn()||es()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}},It=()=>{var e;return(e=ts())===null||e===void 0?void 0:e.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ns{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,n)=>{this.resolve=t,this.reject=n})}wrapCallback(t){return(n,s)=>{n?this.reject(n):this.resolve(s),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(n):t(n,s))}}}function St(){try{return typeof indexedDB=="object"}catch{return!1}}function Et(){return new Promise((e,t)=>{try{let n=!0;const s="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(s);r.onsuccess=()=>{r.result.close(),n||self.indexedDB.deleteDatabase(s),e(!0)},r.onupgradeneeded=()=>{n=!1},r.onerror=()=>{var o;t(((o=r.error)===null||o===void 0?void 0:o.message)||"")}}catch(n){t(n)}})}function ss(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rs="FirebaseError";class W extends Error{constructor(t,n,s){super(n),this.code=t,this.customData=s,this.name=rs,Object.setPrototypeOf(this,W.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,se.prototype.create)}}class se{constructor(t,n,s){this.service=t,this.serviceName=n,this.errors=s}create(t,...n){const s=n[0]||{},r=`${this.service}/${t}`,o=this.errors[t],i=o?as(o,s):"Error",c=`${this.serviceName}: ${i} (${r}).`;return new W(r,c,s)}}function as(e,t){return e.replace(is,(n,s)=>{const r=t[s];return r!=null?String(r):`<${s}?>`})}const is=/\{\$([^}]+)}/g;function xe(e,t){if(e===t)return!0;const n=Object.keys(e),s=Object.keys(t);for(const r of n){if(!s.includes(r))return!1;const o=e[r],i=t[r];if(qe(o)&&qe(i)){if(!xe(o,i))return!1}else if(o!==i)return!1}for(const r of s)if(!n.includes(r))return!1;return!0}function qe(e){return e!==null&&typeof e=="object"}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jt(e){return e&&e._delegate?e._delegate:e}class O{constructor(t,n,s){this.name=t,this.instanceFactory=n,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const R="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class os{constructor(t,n){this.name=t,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const n=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(n)){const s=new ns;if(this.instancesDeferred.set(n,s),this.isInitialized(n)||this.shouldAutoInitialize())try{const r=this.getOrInitializeService({instanceIdentifier:n});r&&s.resolve(r)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(t){var n;const s=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),r=(n=t==null?void 0:t.optional)!==null&&n!==void 0?n:!1;if(this.isInitialized(s)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:s})}catch(o){if(r)return null;throw o}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(ls(t))try{this.getOrInitializeService({instanceIdentifier:R})}catch{}for(const[n,s]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(n);try{const o=this.getOrInitializeService({instanceIdentifier:r});s.resolve(o)}catch{}}}}clearInstance(t=R){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...t.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=R){return this.instances.has(t)}getOptions(t=R){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:n={}}=t,s=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:s,options:n});for(const[o,i]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(o);s===c&&i.resolve(r)}return r}onInit(t,n){var s;const r=this.normalizeInstanceIdentifier(n),o=(s=this.onInitCallbacks.get(r))!==null&&s!==void 0?s:new Set;o.add(t),this.onInitCallbacks.set(r,o);const i=this.instances.get(r);return i&&t(i,r),()=>{o.delete(t)}}invokeOnInitCallbacks(t,n){const s=this.onInitCallbacks.get(n);if(s)for(const r of s)try{r(t,n)}catch{}}getOrInitializeService({instanceIdentifier:t,options:n={}}){let s=this.instances.get(t);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:cs(t),options:n}),this.instances.set(t,s),this.instancesOptions.set(t,n),this.invokeOnInitCallbacks(s,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,s)}catch{}return s||null}normalizeInstanceIdentifier(t=R){return this.component?this.component.multipleInstances?t:R:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function cs(e){return e===R?void 0:e}function ls(e){return e.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ds{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const n=this.getProvider(t.name);if(n.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);n.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const n=new os(t,this);return this.providers.set(t,n),n}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var g;(function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"})(g||(g={}));const us={debug:g.DEBUG,verbose:g.VERBOSE,info:g.INFO,warn:g.WARN,error:g.ERROR,silent:g.SILENT},fs=g.INFO,ps={[g.DEBUG]:"log",[g.VERBOSE]:"log",[g.INFO]:"info",[g.WARN]:"warn",[g.ERROR]:"error"},hs=(e,t,...n)=>{if(t<e.logLevel)return;const s=new Date().toISOString(),r=ps[t];if(r)console[r](`[${s}]  ${e.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class ms{constructor(t){this.name=t,this._logLevel=fs,this._logHandler=hs,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in g))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?us[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,g.DEBUG,...t),this._logHandler(this,g.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,g.VERBOSE,...t),this._logHandler(this,g.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,g.INFO,...t),this._logHandler(this,g.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,g.WARN,...t),this._logHandler(this,g.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,g.ERROR,...t),this._logHandler(this,g.ERROR,...t)}}const gs=(e,t)=>t.some(n=>e instanceof n);let Ke,We;function bs(){return Ke||(Ke=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function ws(){return We||(We=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const _t=new WeakMap,Ne=new WeakMap,Ct=new WeakMap,de=new WeakMap,Ce=new WeakMap;function ys(e){const t=new Promise((n,s)=>{const r=()=>{e.removeEventListener("success",o),e.removeEventListener("error",i)},o=()=>{n(A(e.result)),r()},i=()=>{s(e.error),r()};e.addEventListener("success",o),e.addEventListener("error",i)});return t.then(n=>{n instanceof IDBCursor&&_t.set(n,e)}).catch(()=>{}),Ce.set(t,e),t}function vs(e){if(Ne.has(e))return;const t=new Promise((n,s)=>{const r=()=>{e.removeEventListener("complete",o),e.removeEventListener("error",i),e.removeEventListener("abort",i)},o=()=>{n(),r()},i=()=>{s(e.error||new DOMException("AbortError","AbortError")),r()};e.addEventListener("complete",o),e.addEventListener("error",i),e.addEventListener("abort",i)});Ne.set(e,t)}let Ie={get(e,t,n){if(e instanceof IDBTransaction){if(t==="done")return Ne.get(e);if(t==="objectStoreNames")return e.objectStoreNames||Ct.get(e);if(t==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return A(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function xs(e){Ie=e(Ie)}function Ns(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...n){const s=e.call(ue(this),t,...n);return Ct.set(s,t.sort?t.sort():[t]),A(s)}:ws().includes(e)?function(...t){return e.apply(ue(this),t),A(_t.get(this))}:function(...t){return A(e.apply(ue(this),t))}}function Is(e){return typeof e=="function"?Ns(e):(e instanceof IDBTransaction&&vs(e),gs(e,bs())?new Proxy(e,Ie):e)}function A(e){if(e instanceof IDBRequest)return ys(e);if(de.has(e))return de.get(e);const t=Is(e);return t!==e&&(de.set(e,t),Ce.set(t,e)),t}const ue=e=>Ce.get(e);function re(e,t,{blocked:n,upgrade:s,blocking:r,terminated:o}={}){const i=indexedDB.open(e,t),c=A(i);return s&&i.addEventListener("upgradeneeded",l=>{s(A(i.result),l.oldVersion,l.newVersion,A(i.transaction),l)}),n&&i.addEventListener("blocked",l=>n(l.oldVersion,l.newVersion,l)),c.then(l=>{o&&l.addEventListener("close",()=>o()),r&&l.addEventListener("versionchange",u=>r(u.oldVersion,u.newVersion,u))}).catch(()=>{}),c}function fe(e,{blocked:t}={}){const n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",s=>t(s.oldVersion,s)),A(n).then(()=>{})}const Ss=["get","getKey","getAll","getAllKeys","count"],Es=["put","add","delete","clear"],pe=new Map;function Ge(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(pe.get(t))return pe.get(t);const n=t.replace(/FromIndex$/,""),s=t!==n,r=Es.includes(n);if(!(n in(s?IDBIndex:IDBObjectStore).prototype)||!(r||Ss.includes(n)))return;const o=async function(i,...c){const l=this.transaction(i,r?"readwrite":"readonly");let u=l.store;return s&&(u=u.index(c.shift())),(await Promise.all([u[n](...c),r&&l.done]))[0]};return pe.set(t,o),o}xs(e=>({...e,get:(t,n,s)=>Ge(t,n)||e.get(t,n,s),has:(t,n)=>!!Ge(t,n)||e.has(t,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class js{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(_s(n)){const s=n.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(n=>n).join(" ")}}function _s(e){const t=e.getComponent();return(t==null?void 0:t.type)==="VERSION"}const Se="@firebase/app",Je="0.13.1";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const T=new ms("@firebase/app"),Cs="@firebase/app-compat",As="@firebase/analytics-compat",Ts="@firebase/analytics",ks="@firebase/app-check-compat",Ds="@firebase/app-check",Ps="@firebase/auth",Os="@firebase/auth-compat",Bs="@firebase/database",Ms="@firebase/data-connect",Rs="@firebase/database-compat",$s="@firebase/functions",Ls="@firebase/functions-compat",Fs="@firebase/installations",Hs="@firebase/installations-compat",Vs="@firebase/messaging",Us="@firebase/messaging-compat",zs="@firebase/performance",qs="@firebase/performance-compat",Ks="@firebase/remote-config",Ws="@firebase/remote-config-compat",Gs="@firebase/storage",Js="@firebase/storage-compat",Ys="@firebase/firestore",Xs="@firebase/ai",Qs="@firebase/firestore-compat",Zs="firebase";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ee="[DEFAULT]",er={[Se]:"fire-core",[Cs]:"fire-core-compat",[Ts]:"fire-analytics",[As]:"fire-analytics-compat",[Ds]:"fire-app-check",[ks]:"fire-app-check-compat",[Ps]:"fire-auth",[Os]:"fire-auth-compat",[Bs]:"fire-rtdb",[Ms]:"fire-data-connect",[Rs]:"fire-rtdb-compat",[$s]:"fire-fn",[Ls]:"fire-fn-compat",[Fs]:"fire-iid",[Hs]:"fire-iid-compat",[Vs]:"fire-fcm",[Us]:"fire-fcm-compat",[zs]:"fire-perf",[qs]:"fire-perf-compat",[Ks]:"fire-rc",[Ws]:"fire-rc-compat",[Gs]:"fire-gcs",[Js]:"fire-gcs-compat",[Ys]:"fire-fst",[Qs]:"fire-fst-compat",[Xs]:"fire-vertex","fire-js":"fire-js",[Zs]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Y=new Map,tr=new Map,je=new Map;function Ye(e,t){try{e.container.addComponent(t)}catch(n){T.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function L(e){const t=e.name;if(je.has(t))return T.debug(`There were multiple attempts to register component ${t}.`),!1;je.set(t,e);for(const n of Y.values())Ye(n,e);for(const n of tr.values())Ye(n,e);return!0}function Ae(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nr={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},D=new se("app","Firebase",nr);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sr{constructor(t,n,s){this._isDeleted=!1,this._options=Object.assign({},t),this._config=Object.assign({},n),this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new O("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw D.create("app-deleted",{appName:this._name})}}function At(e,t={}){let n=e;typeof t!="object"&&(t={name:t});const s=Object.assign({name:Ee,automaticDataCollectionEnabled:!0},t),r=s.name;if(typeof r!="string"||!r)throw D.create("bad-app-name",{appName:String(r)});if(n||(n=It()),!n)throw D.create("no-options");const o=Y.get(r);if(o){if(xe(n,o.options)&&xe(s,o.config))return o;throw D.create("duplicate-app",{appName:r})}const i=new ds(r);for(const l of je.values())i.addComponent(l);const c=new sr(n,s,i);return Y.set(r,c),c}function Tt(e=Ee){const t=Y.get(e);if(!t&&e===Ee&&It())return At();if(!t)throw D.create("no-app",{appName:e});return t}function rr(){return Array.from(Y.values())}function P(e,t,n){var s;let r=(s=er[e])!==null&&s!==void 0?s:e;n&&(r+=`-${n}`);const o=r.match(/\s|\//),i=t.match(/\s|\//);if(o||i){const c=[`Unable to register library "${r}" with version "${t}":`];o&&c.push(`library name "${r}" contains illegal characters (whitespace or "/")`),o&&i&&c.push("and"),i&&c.push(`version name "${t}" contains illegal characters (whitespace or "/")`),T.warn(c.join(" "));return}L(new O(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ar="firebase-heartbeat-database",ir=1,X="firebase-heartbeat-store";let he=null;function kt(){return he||(he=re(ar,ir,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(X)}catch(n){console.warn(n)}}}}).catch(e=>{throw D.create("idb-open",{originalErrorMessage:e.message})})),he}async function or(e){try{const n=(await kt()).transaction(X),s=await n.objectStore(X).get(Dt(e));return await n.done,s}catch(t){if(t instanceof W)T.warn(t.message);else{const n=D.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});T.warn(n.message)}}}async function Xe(e,t){try{const s=(await kt()).transaction(X,"readwrite");await s.objectStore(X).put(t,Dt(e)),await s.done}catch(n){if(n instanceof W)T.warn(n.message);else{const s=D.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});T.warn(s.message)}}}function Dt(e){return`${e.name}!${e.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cr=1024,lr=30;class dr{constructor(t){this.container=t,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new fr(n),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){var t,n;try{const r=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=Qe();if(((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)===null||n===void 0?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(i=>i.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:r}),this._heartbeatsCache.heartbeats.length>lr){const i=pr(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(i,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(s){T.warn(s)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=Qe(),{heartbeatsToSend:s,unsentEntries:r}=ur(this._heartbeatsCache.heartbeats),o=Nt(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=n,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(n){return T.warn(n),""}}}function Qe(){return new Date().toISOString().substring(0,10)}function ur(e,t=cr){const n=[];let s=e.slice();for(const r of e){const o=n.find(i=>i.agent===r.agent);if(o){if(o.dates.push(r.date),Ze(n)>t){o.dates.pop();break}}else if(n.push({agent:r.agent,dates:[r.date]}),Ze(n)>t){n.pop();break}s=s.slice(1)}return{heartbeatsToSend:n,unsentEntries:s}}class fr{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return St()?Et().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await or(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){var n;if(await this._canUseIndexedDBPromise){const r=await this.read();return Xe(this.app,{lastSentHeartbeatDate:(n=t.lastSentHeartbeatDate)!==null&&n!==void 0?n:r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){var n;if(await this._canUseIndexedDBPromise){const r=await this.read();return Xe(this.app,{lastSentHeartbeatDate:(n=t.lastSentHeartbeatDate)!==null&&n!==void 0?n:r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function Ze(e){return Nt(JSON.stringify({version:2,heartbeats:e})).length}function pr(e){if(e.length===0)return-1;let t=0,n=e[0].date;for(let s=1;s<e.length;s++)e[s].date<n&&(n=e[s].date,t=s);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hr(e){L(new O("platform-logger",t=>new js(t),"PRIVATE")),L(new O("heartbeat",t=>new dr(t),"PRIVATE")),P(Se,Je,e),P(Se,Je,"esm2017"),P("fire-js","")}hr("");var mr="firebase",gr="11.9.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */P(mr,gr,"app");const Pt="@firebase/installations",Te="0.6.17";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ot=1e4,Bt=`w:${Te}`,Mt="FIS_v2",br="https://firebaseinstallations.googleapis.com/v1",wr=60*60*1e3,yr="installations",vr="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xr={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},F=new se(yr,vr,xr);function Rt(e){return e instanceof W&&e.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $t({projectId:e}){return`${br}/projects/${e}/installations`}function Lt(e){return{token:e.token,requestStatus:2,expiresIn:Ir(e.expiresIn),creationTime:Date.now()}}async function Ft(e,t){const s=(await t.json()).error;return F.create("request-failed",{requestName:e,serverCode:s.code,serverMessage:s.message,serverStatus:s.status})}function Ht({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function Nr(e,{refreshToken:t}){const n=Ht(e);return n.append("Authorization",Sr(t)),n}async function Vt(e){const t=await e();return t.status>=500&&t.status<600?e():t}function Ir(e){return Number(e.replace("s","000"))}function Sr(e){return`${Mt} ${e}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Er({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const s=$t(e),r=Ht(e),o=t.getImmediate({optional:!0});if(o){const u=await o.getHeartbeatsHeader();u&&r.append("x-firebase-client",u)}const i={fid:n,authVersion:Mt,appId:e.appId,sdkVersion:Bt},c={method:"POST",headers:r,body:JSON.stringify(i)},l=await Vt(()=>fetch(s,c));if(l.ok){const u=await l.json();return{fid:u.fid||n,registrationStatus:2,refreshToken:u.refreshToken,authToken:Lt(u.authToken)}}else throw await Ft("Create Installation",l)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ut(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jr(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _r=/^[cdef][\w-]{21}$/,_e="";function Cr(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=Ar(e);return _r.test(n)?n:_e}catch{return _e}}function Ar(e){return jr(e).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ae(e){return`${e.appName}!${e.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zt=new Map;function qt(e,t){const n=ae(e);Kt(n,t),Tr(n,t)}function Kt(e,t){const n=zt.get(e);if(n)for(const s of n)s(t)}function Tr(e,t){const n=kr();n&&n.postMessage({key:e,fid:t}),Dr()}let $=null;function kr(){return!$&&"BroadcastChannel"in self&&($=new BroadcastChannel("[Firebase] FID Change"),$.onmessage=e=>{Kt(e.data.key,e.data.fid)}),$}function Dr(){zt.size===0&&$&&($.close(),$=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pr="firebase-installations-database",Or=1,H="firebase-installations-store";let me=null;function ke(){return me||(me=re(Pr,Or,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(H)}}})),me}async function ne(e,t){const n=ae(e),r=(await ke()).transaction(H,"readwrite"),o=r.objectStore(H),i=await o.get(n);return await o.put(t,n),await r.done,(!i||i.fid!==t.fid)&&qt(e,t.fid),t}async function Wt(e){const t=ae(e),s=(await ke()).transaction(H,"readwrite");await s.objectStore(H).delete(t),await s.done}async function ie(e,t){const n=ae(e),r=(await ke()).transaction(H,"readwrite"),o=r.objectStore(H),i=await o.get(n),c=t(i);return c===void 0?await o.delete(n):await o.put(c,n),await r.done,c&&(!i||i.fid!==c.fid)&&qt(e,c.fid),c}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function De(e){let t;const n=await ie(e.appConfig,s=>{const r=Br(s),o=Mr(e,r);return t=o.registrationPromise,o.installationEntry});return n.fid===_e?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function Br(e){const t=e||{fid:Cr(),registrationStatus:0};return Gt(t)}function Mr(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const r=Promise.reject(F.create("app-offline"));return{installationEntry:t,registrationPromise:r}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},s=Rr(e,n);return{installationEntry:n,registrationPromise:s}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:$r(e)}:{installationEntry:t}}async function Rr(e,t){try{const n=await Er(e,t);return ne(e.appConfig,n)}catch(n){throw Rt(n)&&n.customData.serverCode===409?await Wt(e.appConfig):await ne(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function $r(e){let t=await et(e.appConfig);for(;t.registrationStatus===1;)await Ut(100),t=await et(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:s}=await De(e);return s||n}return t}function et(e){return ie(e,t=>{if(!t)throw F.create("installation-not-found");return Gt(t)})}function Gt(e){return Lr(e)?{fid:e.fid,registrationStatus:0}:e}function Lr(e){return e.registrationStatus===1&&e.registrationTime+Ot<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Fr({appConfig:e,heartbeatServiceProvider:t},n){const s=Hr(e,n),r=Nr(e,n),o=t.getImmediate({optional:!0});if(o){const u=await o.getHeartbeatsHeader();u&&r.append("x-firebase-client",u)}const i={installation:{sdkVersion:Bt,appId:e.appId}},c={method:"POST",headers:r,body:JSON.stringify(i)},l=await Vt(()=>fetch(s,c));if(l.ok){const u=await l.json();return Lt(u)}else throw await Ft("Generate Auth Token",l)}function Hr(e,{fid:t}){return`${$t(e)}/${t}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Pe(e,t=!1){let n;const s=await ie(e.appConfig,o=>{if(!Jt(o))throw F.create("not-registered");const i=o.authToken;if(!t&&zr(i))return o;if(i.requestStatus===1)return n=Vr(e,t),o;{if(!navigator.onLine)throw F.create("app-offline");const c=Kr(o);return n=Ur(e,c),c}});return n?await n:s.authToken}async function Vr(e,t){let n=await tt(e.appConfig);for(;n.authToken.requestStatus===1;)await Ut(100),n=await tt(e.appConfig);const s=n.authToken;return s.requestStatus===0?Pe(e,t):s}function tt(e){return ie(e,t=>{if(!Jt(t))throw F.create("not-registered");const n=t.authToken;return Wr(n)?Object.assign(Object.assign({},t),{authToken:{requestStatus:0}}):t})}async function Ur(e,t){try{const n=await Fr(e,t),s=Object.assign(Object.assign({},t),{authToken:n});return await ne(e.appConfig,s),n}catch(n){if(Rt(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await Wt(e.appConfig);else{const s=Object.assign(Object.assign({},t),{authToken:{requestStatus:0}});await ne(e.appConfig,s)}throw n}}function Jt(e){return e!==void 0&&e.registrationStatus===2}function zr(e){return e.requestStatus===2&&!qr(e)}function qr(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+wr}function Kr(e){const t={requestStatus:1,requestTime:Date.now()};return Object.assign(Object.assign({},e),{authToken:t})}function Wr(e){return e.requestStatus===1&&e.requestTime+Ot<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Gr(e){const t=e,{installationEntry:n,registrationPromise:s}=await De(t);return s?s.catch(console.error):Pe(t).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Jr(e,t=!1){const n=e;return await Yr(n),(await Pe(n,t)).token}async function Yr(e){const{registrationPromise:t}=await De(e);t&&await t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xr(e){if(!e||!e.options)throw ge("App Configuration");if(!e.name)throw ge("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw ge(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function ge(e){return F.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yt="installations",Qr="installations-internal",Zr=e=>{const t=e.getProvider("app").getImmediate(),n=Xr(t),s=Ae(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:s,_delete:()=>Promise.resolve()}},ea=e=>{const t=e.getProvider("app").getImmediate(),n=Ae(t,Yt).getImmediate();return{getId:()=>Gr(n),getToken:r=>Jr(n,r)}};function ta(){L(new O(Yt,Zr,"PUBLIC")),L(new O(Qr,ea,"PRIVATE"))}ta();P(Pt,Te);P(Pt,Te,"esm2017");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const na="/firebase-messaging-sw.js",sa="/firebase-cloud-messaging-push-scope",Xt="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",ra="https://fcmregistrations.googleapis.com/v1",Qt="google.c.a.c_id",aa="google.c.a.c_l",ia="google.c.a.ts",oa="google.c.a.e",nt=1e4;var st;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(st||(st={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var Q;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked"})(Q||(Q={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function C(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function ca(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),s=atob(n),r=new Uint8Array(s.length);for(let o=0;o<s.length;++o)r[o]=s.charCodeAt(o);return r}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const be="fcm_token_details_db",la=5,rt="fcm_token_object_Store";async function da(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(o=>o.name).includes(be))return null;let t=null;return(await re(be,la,{upgrade:async(s,r,o,i)=>{var c;if(r<2||!s.objectStoreNames.contains(rt))return;const l=i.objectStore(rt),u=await l.index("fcmSenderId").get(e);if(await l.clear(),!!u){if(r===2){const d=u;if(!d.auth||!d.p256dh||!d.endpoint)return;t={token:d.fcmToken,createTime:(c=d.createTime)!==null&&c!==void 0?c:Date.now(),subscriptionOptions:{auth:d.auth,p256dh:d.p256dh,endpoint:d.endpoint,swScope:d.swScope,vapidKey:typeof d.vapidKey=="string"?d.vapidKey:C(d.vapidKey)}}}else if(r===3){const d=u;t={token:d.fcmToken,createTime:d.createTime,subscriptionOptions:{auth:C(d.auth),p256dh:C(d.p256dh),endpoint:d.endpoint,swScope:d.swScope,vapidKey:C(d.vapidKey)}}}else if(r===4){const d=u;t={token:d.fcmToken,createTime:d.createTime,subscriptionOptions:{auth:C(d.auth),p256dh:C(d.p256dh),endpoint:d.endpoint,swScope:d.swScope,vapidKey:C(d.vapidKey)}}}}}})).close(),await fe(be),await fe("fcm_vapid_details_db"),await fe("undefined"),ua(t)?t:null}function ua(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fa="firebase-messaging-database",pa=1,Z="firebase-messaging-store";let we=null;function Zt(){return we||(we=re(fa,pa,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(Z)}}})),we}async function ha(e){const t=en(e),s=await(await Zt()).transaction(Z).objectStore(Z).get(t);if(s)return s;{const r=await da(e.appConfig.senderId);if(r)return await Oe(e,r),r}}async function Oe(e,t){const n=en(e),r=(await Zt()).transaction(Z,"readwrite");return await r.objectStore(Z).put(t,n),await r.done,t}function en({appConfig:e}){return e.appId}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ma={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},x=new se("messaging","Messaging",ma);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ga(e,t){const n=await Me(e),s=tn(t),r={method:"POST",headers:n,body:JSON.stringify(s)};let o;try{o=await(await fetch(Be(e.appConfig),r)).json()}catch(i){throw x.create("token-subscribe-failed",{errorInfo:i==null?void 0:i.toString()})}if(o.error){const i=o.error.message;throw x.create("token-subscribe-failed",{errorInfo:i})}if(!o.token)throw x.create("token-subscribe-no-token");return o.token}async function ba(e,t){const n=await Me(e),s=tn(t.subscriptionOptions),r={method:"PATCH",headers:n,body:JSON.stringify(s)};let o;try{o=await(await fetch(`${Be(e.appConfig)}/${t.token}`,r)).json()}catch(i){throw x.create("token-update-failed",{errorInfo:i==null?void 0:i.toString()})}if(o.error){const i=o.error.message;throw x.create("token-update-failed",{errorInfo:i})}if(!o.token)throw x.create("token-update-no-token");return o.token}async function wa(e,t){const s={method:"DELETE",headers:await Me(e)};try{const o=await(await fetch(`${Be(e.appConfig)}/${t}`,s)).json();if(o.error){const i=o.error.message;throw x.create("token-unsubscribe-failed",{errorInfo:i})}}catch(r){throw x.create("token-unsubscribe-failed",{errorInfo:r==null?void 0:r.toString()})}}function Be({projectId:e}){return`${ra}/projects/${e}/registrations`}async function Me({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function tn({p256dh:e,auth:t,endpoint:n,vapidKey:s}){const r={web:{endpoint:n,auth:t,p256dh:e}};return s!==Xt&&(r.web.applicationPubKey=s),r}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ya=7*24*60*60*1e3;async function va(e){const t=await Na(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:C(t.getKey("auth")),p256dh:C(t.getKey("p256dh"))},s=await ha(e.firebaseDependencies);if(s){if(Ia(s.subscriptionOptions,n))return Date.now()>=s.createTime+ya?xa(e,{token:s.token,createTime:Date.now(),subscriptionOptions:n}):s.token;try{await wa(e.firebaseDependencies,s.token)}catch(r){console.warn(r)}return at(e.firebaseDependencies,n)}else return at(e.firebaseDependencies,n)}async function xa(e,t){try{const n=await ba(e.firebaseDependencies,t),s=Object.assign(Object.assign({},t),{token:n,createTime:Date.now()});return await Oe(e.firebaseDependencies,s),n}catch(n){throw n}}async function at(e,t){const s={token:await ga(e,t),createTime:Date.now(),subscriptionOptions:t};return await Oe(e,s),s.token}async function Na(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:ca(t)})}function Ia(e,t){const n=t.vapidKey===e.vapidKey,s=t.endpoint===e.endpoint,r=t.auth===e.auth,o=t.p256dh===e.p256dh;return n&&s&&r&&o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function it(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Sa(t,e),Ea(t,e),ja(t,e),t}function Sa(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const s=t.notification.body;s&&(e.notification.body=s);const r=t.notification.image;r&&(e.notification.image=r);const o=t.notification.icon;o&&(e.notification.icon=o)}function Ea(e,t){t.data&&(e.data=t.data)}function ja(e,t){var n,s,r,o,i;if(!t.fcmOptions&&!(!((n=t.notification)===null||n===void 0)&&n.click_action))return;e.fcmOptions={};const c=(r=(s=t.fcmOptions)===null||s===void 0?void 0:s.link)!==null&&r!==void 0?r:(o=t.notification)===null||o===void 0?void 0:o.click_action;c&&(e.fcmOptions.link=c);const l=(i=t.fcmOptions)===null||i===void 0?void 0:i.analytics_label;l&&(e.fcmOptions.analyticsLabel=l)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _a(e){return typeof e=="object"&&!!e&&Qt in e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ca(e){if(!e||!e.options)throw ye("App Configuration Object");if(!e.name)throw ye("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const s of t)if(!n[s])throw ye(s);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function ye(e){return x.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Aa{constructor(t,n,s){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const r=Ca(t);this.firebaseDependencies={app:t,appConfig:r,installations:n,analyticsProvider:s}}_delete(){return Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ta(e){try{e.swRegistration=await navigator.serviceWorker.register(na,{scope:sa}),e.swRegistration.update().catch(()=>{}),await ka(e.swRegistration)}catch(t){throw x.create("failed-service-worker-registration",{browserErrorMessage:t==null?void 0:t.message})}}async function ka(e){return new Promise((t,n)=>{const s=setTimeout(()=>n(new Error(`Service worker not registered after ${nt} ms`)),nt),r=e.installing||e.waiting;e.active?(clearTimeout(s),t()):r?r.onstatechange=o=>{var i;((i=o.target)===null||i===void 0?void 0:i.state)==="activated"&&(r.onstatechange=null,clearTimeout(s),t())}:(clearTimeout(s),n(new Error("No incoming service worker found.")))})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Da(e,t){if(!t&&!e.swRegistration&&await Ta(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw x.create("invalid-sw-registration");e.swRegistration=t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Pa(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=Xt)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function nn(e,t){if(!navigator)throw x.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw x.create("permission-blocked");return await Pa(e,t==null?void 0:t.vapidKey),await Da(e,t==null?void 0:t.serviceWorkerRegistration),va(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Oa(e,t,n){const s=Ba(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(s,{message_id:n[Qt],message_name:n[aa],message_time:n[ia],message_device_time:Math.floor(Date.now()/1e3)})}function Ba(e){switch(e){case Q.NOTIFICATION_CLICKED:return"notification_open";case Q.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ma(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===Q.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(it(n)):e.onMessageHandler.next(it(n)));const s=n.data;_a(s)&&s[oa]==="1"&&await Oa(e,n.messageType,s)}const ot="@firebase/messaging",ct="0.12.21";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ra=e=>{const t=new Aa(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>Ma(t,n)),t},$a=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:s=>nn(t,s)}};function La(){L(new O("messaging",Ra,"PUBLIC")),L(new O("messaging-internal",$a,"PRIVATE")),P(ot,ct),P(ot,ct,"esm2017")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function sn(){try{await Et()}catch{return!1}return typeof window<"u"&&St()&&ss()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fa(e=Tt()){return sn().then(t=>{if(!t)throw x.create("unsupported-browser")},t=>{throw x.create("indexed-db-unsupported")}),Ae(jt(e),"messaging").getImmediate()}async function Ha(e,t){return e=jt(e),nn(e,t)}La();const Va={apiKey:"AIzaSyAJjWngAN7g3eOLBBtafthga1SCvrKtNRY",authDomain:"janpadnewstimes-d2eb4.firebaseapp.com",projectId:"janpadnewstimes-d2eb4",storageBucket:"janpadnewstimes-d2eb4.firebasestorage.app",messagingSenderId:"228931912040",appId:"1:228931912040:web:27c22afbfdd8a7cd1f96dd",measurementId:"G-Q2N5Z7SJJ6"},Ua=rr().length===0?At(Va):Tt(),za=async()=>await sn()?Fa(Ua):null,qa=async()=>{try{const e=await za();return e?await Ha(e,{vapidKey:"BI-uMoAStHIaDrg3twyq-Z5P3u7qX3rPPoUhCLca2Y0CK3BuFis0U7_ll5VE76hSPExs5t8QKNIHkzLeGRVq8Ko"}):null}catch(e){return console.error("An error occurred while fetching the token:",e),null}},Ka=({onclose:e})=>{const{user:t}=on(v=>v.user),[n,s]=y.useState("default"),[r,o]=y.useState(!1),{data:i,isPending:c,isError:l,error:u,refetch:d}=zn(),[p,w]=y.useState({newsAdded:!0,eventNews:!0,newsDeleted:!1,newsUpdated:!1,others:!1});y.useEffect(()=>{"Notification"in window&&s(Notification.permission)},[]);const S=async()=>{if(!("Notification"in window)){alert("This browser does not support notifications");return}o(!0);try{const v=await Notification.requestPermission();if(s(v),v==="granted"){new Notification("Notifications Enabled!",{body:"You will now receive notifications from this app.",icon:"/favicon.ico"});const m=await qa();await K.put("update-fcm",{fcm:m})}}catch(v){console.error("Error requesting notification permission:",v)}finally{o(!1)}},N=()=>{switch(n){case"granted":return{text:"Enabled",color:"text-success",bgColor:"bg-success-soft",icon:a.jsx(ht,{size:16})};case"denied":return{text:"Blocked",color:"text-danger",bgColor:"bg-danger-soft",icon:a.jsx(pt,{size:16})};default:return{text:"Not Set",color:"text-warning",bgColor:"bg-warning-soft",icon:a.jsx($n,{size:16})}}},E=async v=>{const m=!p[v];w(h=>({...h,[v]:m}));try{await K.post("update-notification-preference",{type:v,enabled:m}),d()}catch(h){console.error("Failed to update preference:",h)}},_=()=>{n==="granted"&&new Notification("Test Notification",{body:"This is a test notification to verify everything is working correctly.",icon:"/favicon.ico",tag:"test-notification"})},k=N();return y.useEffect(()=>{i&&w(i)},[c]),a.jsx(_n,{isPending:c,isError:l,error:u,children:a.jsxs("div",{className:"space-y-4",children:[a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:`p-2 rounded-full ${k.bgColor}`,children:a.jsx("div",{className:k.color,children:k.icon})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Browser Notifications"}),a.jsxs("p",{className:"text-sm text-fg-subtle",children:["Status: ",k.text]})]})]}),a.jsxs("div",{className:"flex items-center gap-2",children:[(n==="default"||n==="denied")&&a.jsx("button",{onClick:S,disabled:r,className:"bg-primary hover:bg-primary-hover disabled:bg-primary text-paper px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm",children:r?"Requesting...":"Enable Notifications"}),n==="granted"&&a.jsx("button",{onClick:_,className:"bg-success hover:bg-success text-paper px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm",children:"Test"})]})]}),n==="granted"&&a.jsxs("div",{className:"space-y-3",children:[a.jsx("h3",{className:"text-sm font-semibold text-fg-muted uppercase tracking-wide",children:"Notification Types"}),t.role==="admin"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-primary-soft",children:a.jsx(z,{className:"text-primary",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Add News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"News added by reporter"})]})]}),a.jsx("button",{onClick:()=>E("newsAdded"),className:`w-5 h-5 rounded-full border-2 ${p.newsAdded?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.newsAdded&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),t.role==="admin"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-primary-soft",children:a.jsx(Re,{className:"text-primary",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Event News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"Event news added by reporter"})]})]}),a.jsx("button",{onClick:()=>E("eventNews"),className:`w-5 h-5 rounded-full border-2 ${p.eventNews?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.eventNews&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),t.role==="reporter"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-success-soft",children:a.jsx(z,{className:"text-success",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Deleted News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"News deleted by admin"})]})]}),a.jsx("button",{onClick:()=>E("newsDeleted"),className:`w-5 h-5 rounded-full border-2 ${p.newsDeleted?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.newsDeleted&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),t.role==="admin"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-warning-soft",children:a.jsx(z,{className:"text-warning",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Updated News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"News updated by reporter"})]})]}),a.jsx("button",{onClick:()=>E("newsUpdated"),className:`w-5 h-5 rounded-full border-2 ${p.newsUpdated?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.newsUpdated&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-danger-soft",children:a.jsx(z,{className:"text-danger",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Other Notifications"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"All other types of notifications"})]})]}),a.jsx("button",{onClick:()=>E("others"),className:`w-5 h-5 rounded-full border-2 ${p.others?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.others&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]})]}),n==="denied"&&a.jsx("div",{className:"p-4 bg-danger-soft rounded-lg border border-danger/30",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx(Re,{size:20,className:"text-danger mt-0.5"}),a.jsxs("div",{children:[a.jsx("h4",{className:"font-medium text-danger mb-1",children:"Notifications Blocked"}),a.jsx("p",{className:"text-sm text-danger mb-2",children:'Click "Enable Notifications" above to request permission again, or manually enable in browser settings:'}),a.jsxs("ol",{className:"text-sm text-danger list-decimal list-inside space-y-1",children:[a.jsx("li",{children:"Click the lock/info icon in your browser's address bar"}),a.jsx("li",{children:'Change notifications setting to "Allow"'}),a.jsx("li",{children:"Refresh this page"})]})]})]})}),a.jsx("div",{className:"p-4 bg-primary-soft rounded-lg border border-primary/30",children:a.jsxs("p",{className:"text-sm text-primary",children:[a.jsx("strong",{children:"About Notifications:"})," Stay updated with important news articles, account security alerts, and personalized content recommendations."]})})]})})},lt=20,dt=800,rn=[["website","Website"],["x","X (Twitter)"],["facebook","Facebook"],["instagram","Instagram"],["youtube","YouTube"],["linkedin","LinkedIn"]],Wa=[["light","Light",Pn],["dark","Dark",On],["system","System",Bn]];function M({icon:e,label:t,value:n,children:s}){return a.jsxs("div",{className:"flex items-start gap-3 rounded-2xl bg-surface-2/70 p-3.5",children:[a.jsx("span",{className:"grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-fg-muted ring-1 ring-line",children:a.jsx(e,{className:"size-5"})}),a.jsxs("div",{className:"min-w-0",children:[a.jsx("p",{className:"text-xs font-medium text-fg-subtle",children:t}),s||a.jsx("p",{className:"hindi-font truncate text-sm font-semibold text-fg",children:n||"—"})]})]})}function Ga({profile:e,onDone:t}){const n=wn(),s=yn(),{user:r}=mt(),[o,i]=y.useState({fullName:e.fullName||"",about:e.about||"",designation:e.designation||"",location:e.location||"",phone:e.phone||"",social:{...e.social}}),[c,l]=y.useState({blob:null,url:e.profile||""}),[u,d]=y.useState(""),[p,w]=y.useState({}),[S,N]=y.useState(!1),E=y.useRef(null),_=m=>h=>{i(f=>({...f,[m]:h.target.value})),w(f=>({...f,[m]:void 0}))},k=m=>{var f;const h=(f=m.target.files)==null?void 0:f[0];if(m.target.value="",!!h){if(!/^image\/(png|jpe?g|webp)$/i.test(h.type))return I.error("Choose a JPG, PNG or WebP image");if(h.size>10*1024*1024)return I.error("Image is larger than 10 MB");d(URL.createObjectURL(h))}},v=async m=>{m.preventDefault();const h={};if(o.fullName.trim().length<2&&(h.fullName="Enter your full name"),o.about.trim().length<lt&&(h.about=`Write at least ${lt} characters about yourself`),c.url||(h.photo="A profile photo is required"),w(h),Object.keys(h).length)return I.error(Object.values(h)[0]);const f=new FormData;["fullName","about","designation","location","phone"].forEach(j=>f.append(j,o[j]??"")),f.append("social",JSON.stringify(o.social||{})),c.blob&&f.append("profile",c.blob,"profile.jpg"),N(!0);const B=I.loading("Saving…");try{const{data:j}=await K.put("/profile",f);I.success("Profile updated",{id:B}),n(xn({user:{...r,fullName:j.profile.fullName,profile:j.profile.profile}})),s.invalidateQueries({queryKey:["profile"]}),s.invalidateQueries({queryKey:["user"]}),t()}catch(j){I.error(Nn(j,"Could not save your profile"),{id:B})}finally{N(!1)}};return a.jsxs(U,{padded:!1,children:[a.jsx(J,{icon:bt,title:"Edit profile",description:"Shown on your public author page",actions:a.jsx(q,{variant:"ghost",size:"sm",leftIcon:pt,onClick:t,children:"Cancel"})}),a.jsxs("form",{onSubmit:v,noValidate:!0,className:"space-y-5 p-4 sm:p-5",children:[a.jsxs("div",{className:"flex flex-col items-start gap-4 sm:flex-row sm:items-center",children:[a.jsxs("button",{type:"button",onClick:()=>{var m;return(m=E.current)==null?void 0:m.click()},"aria-label":"Choose profile photo",className:ve("group relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-dashed bg-surface-2",p.photo?"border-danger":"border-line-strong hover:border-fg"),children:[c.url?a.jsx("img",{src:c.url,alt:"",className:"size-full object-cover"}):a.jsx("span",{className:"grid size-full place-items-center text-fg-faint",children:a.jsx(Mn,{className:"size-7"})}),a.jsx("span",{className:"absolute inset-0 grid place-items-center bg-ink/55 text-xs font-medium text-paper opacity-0 transition-opacity group-hover:opacity-100",children:"Change"})]}),a.jsx("input",{ref:E,type:"file",accept:"image/png,image/jpeg,image/webp",className:"hidden",onChange:k}),a.jsxs("div",{className:"text-sm",children:[a.jsxs("p",{className:"font-medium text-fg",children:["Profile photo ",a.jsx("span",{className:"text-danger",children:"*"})]}),a.jsx("p",{className:"text-fg-subtle",children:"Crop and zoom after choosing."}),p.photo&&a.jsx("p",{className:"text-danger",children:p.photo})]})]}),a.jsx(V,{label:"Full name",required:!0,error:p.fullName,children:a.jsx(G,{value:o.fullName,onChange:_("fullName"),maxLength:60,className:"hindi-font"})}),a.jsx(V,{label:"About",required:!0,error:p.about,hint:`${o.about.trim().length}/${dt}`,info:"Shown on your author page and used as its search description.",children:a.jsx(vn,{rows:5,value:o.about,maxLength:dt,onChange:_("about"),className:"hindi-font"})}),a.jsxs("div",{className:"grid gap-4 sm:grid-cols-2",children:[a.jsx(V,{label:"Designation",hint:"Optional",children:a.jsx(G,{icon:gt,value:o.designation,onChange:_("designation"),maxLength:80,className:"hindi-font"})}),a.jsx(V,{label:"Location",hint:"Optional",children:a.jsx(G,{icon:wt,value:o.location,onChange:_("location"),maxLength:80,className:"hindi-font"})}),a.jsx(V,{label:"Phone",hint:"Optional",children:a.jsx(G,{icon:yt,value:o.phone,onChange:_("phone"),inputMode:"tel"})})]}),a.jsx("div",{className:"grid gap-4 sm:grid-cols-2",children:rn.map(([m,h])=>{var f;return a.jsx(V,{label:h,hint:"Optional",children:a.jsx(G,{value:((f=o.social)==null?void 0:f[m])||"",onChange:B=>i(j=>({...j,social:{...j.social,[m]:B.target.value}})),placeholder:"https://",inputMode:"url"})},m)})}),a.jsxs("div",{className:"flex justify-end gap-2 border-t border-line pt-4",children:[a.jsx(q,{type:"button",variant:"outline",onClick:t,children:"Cancel"}),a.jsx(q,{type:"submit",loading:S,children:"Save changes"})]})]}),a.jsx(Cn,{open:!!u,src:u,onClose:()=>d(""),onDone:(m,h)=>{l({blob:m,url:h}),w(f=>({...f,photo:void 0})),d("")}})]})}function Ni(){const{t:e,i18n:t}=An(),{theme:n,setTheme:s}=cn(),{user:r,can:o}=mt(),{data:i,isPending:c,isError:l,error:u,refetch:d}=Vn(),[p,w]=y.useState(!1),[S,N]=y.useState(!1),[E,_]=y.useState(!1),k=y.useMemo(()=>Sn(30),[]),v=(i==null?void 0:i._id)||(r==null?void 0:r.id)||(r==null?void 0:r._id),m=o("reporter.performance.own")||o("reporter.performance.all"),h=In(v,k,!!v&&m),f=h.data;if(y.useEffect(()=>{i&&!i.about&&_(!0)},[i]),l)return a.jsx(ln,{error:u,onRetry:d});const B=Object.entries((i==null?void 0:i.social)||{}).filter(([,b])=>b),j=i&&(!i.about||!i.profile||!i.fullName);return a.jsxs(a.Fragment,{children:[a.jsx(dn,{title:e("My profile"),description:"Your details, numbers and preferences"}),a.jsx(jn,{className:"mb-5",name:(i==null?void 0:i.fullName)||(i==null?void 0:i.username),src:i==null?void 0:i.profile,badges:(r==null?void 0:r.role)&&a.jsx(pn,{tone:r.role==="admin"?"accent":"primary",className:"capitalize",children:r.role}),subtitle:i!=null&&i.designation?`${i.designation}${i.location?` · ${i.location}`:""}`:i==null?void 0:i.location,about:i==null?void 0:i.about,actions:a.jsxs(a.Fragment,{children:[a.jsx(fn,{children:"Spriteera Newsroom"}),!E&&a.jsx(q,{size:"sm",variant:"outline",leftIcon:bt,onClick:()=>_(!0),children:"Edit profile"})]}),meta:c?a.jsx($e,{className:"h-4 w-56"}):a.jsxs(a.Fragment,{children:[a.jsxs("span",{children:["@",i==null?void 0:i.username]}),a.jsxs("span",{className:"inline-flex items-center gap-1.5",children:[a.jsx(Fe,{className:"size-4"}),i==null?void 0:i.email]}),a.jsxs("span",{className:"inline-flex items-center gap-1.5",children:[a.jsx(Tn,{className:"size-4"}),e("Joined")," ",un(i==null?void 0:i.createdAt)]})]})}),j&&!E&&a.jsx(U,{className:"mb-5 border-warning/40 bg-warning-soft/50",children:a.jsxs("p",{className:"text-sm text-fg-muted",children:[a.jsx("b",{className:"text-fg",children:"Complete your profile."})," Add a photo, your full name and a short about text — they appear on your public author page."]})}),m&&a.jsxs("div",{className:"mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3",children:[a.jsx(ce,{label:`${e("Stories published")} · 30d`,value:(f==null?void 0:f.summary.published)??0,icon:He,tone:"success",loading:h.isLoading,change:f==null?void 0:f.comparison.publishedChangePercent}),a.jsx(ce,{label:e("Total reads"),value:(f==null?void 0:f.summary.totalViews)??0,icon:hn,tone:"info",loading:h.isLoading,change:f==null?void 0:f.comparison.viewsChangePercent}),a.jsx(ce,{label:"Avg reads / story",value:(f==null?void 0:f.summary.avgViewsPerArticle)??0,icon:mn,tone:"violet",loading:h.isLoading})]}),a.jsxs("div",{className:"grid gap-5 lg:grid-cols-5",children:[a.jsxs("div",{className:"space-y-5 lg:col-span-3",children:[E&&i?a.jsx(Ga,{profile:i,onDone:()=>_(!1)}):a.jsxs(U,{padded:!1,children:[a.jsx(J,{icon:Ve,title:"Account information"}),a.jsxs("div",{className:"grid gap-3 p-4 sm:grid-cols-2 sm:p-5",children:[a.jsx(M,{icon:Ve,label:"Username",value:i==null?void 0:i.username}),a.jsx(M,{icon:He,label:"Full name",value:i==null?void 0:i.fullName}),a.jsx(M,{icon:Fe,label:e("Email"),value:i==null?void 0:i.email}),a.jsx(M,{icon:gt,label:"Designation",value:i==null?void 0:i.designation}),a.jsx(M,{icon:wt,label:"Location",value:i==null?void 0:i.location}),a.jsx(M,{icon:yt,label:"Phone",value:i==null?void 0:i.phone}),B.length>0&&a.jsx("div",{className:"sm:col-span-2",children:a.jsx(M,{icon:kn,label:"Links",children:a.jsx("div",{className:"mt-1 flex flex-wrap gap-1.5",children:B.map(([b,oe])=>{var ee;return a.jsx("a",{href:oe,target:"_blank",rel:"noreferrer",className:"rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-info hover:underline",children:((ee=rn.find(an=>an[0]===b))==null?void 0:ee[1])||b},b)})})})})]})]}),m&&a.jsxs(U,{padded:!1,children:[a.jsx(J,{title:"Your last 30 days",description:"Stories and reads per day"}),a.jsx("div",{className:"p-4",children:h.isLoading?a.jsx($e,{className:"h-56 w-full"}):a.jsx(En,{data:((f==null?void 0:f.trends.daily)||[]).map(b=>({bucket:b.date,published:b.published,views:b.views})),series:[{key:"published",name:"Stories"},{key:"views",name:"Reads"}],height:240})})]})]}),a.jsxs("div",{className:"space-y-5 lg:col-span-2",children:[a.jsxs(U,{padded:!1,children:[a.jsx(J,{icon:Dn,title:"Security & notifications"}),a.jsxs("div",{className:"space-y-2.5 p-4 sm:p-5",children:[a.jsx(q,{variant:"outline",leftIcon:Ue,className:"w-full justify-start",onClick:()=>w(!0),children:"Change password"}),a.jsx(q,{variant:"outline",leftIcon:z,className:"w-full justify-start",onClick:()=>N(!0),children:"Manage notifications"}),a.jsxs("p",{className:"inline-flex items-center gap-1.5 pt-1 text-xs text-fg-faint",children:[a.jsx(te,{className:"size-3.5"}),"Sessions are protected with signed tokens."]})]})]}),a.jsxs(U,{padded:!1,children:[a.jsx(J,{icon:Fn,title:"Appearance & language",description:"Only the panel's own text changes — what you write stays as you write it."}),a.jsxs("div",{className:"space-y-4 p-4 sm:p-5",children:[a.jsxs("div",{children:[a.jsx("p",{className:"mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle",children:e("Theme")}),a.jsx("div",{className:"grid grid-cols-3 gap-2",children:Wa.map(([b,oe,ee])=>a.jsxs("button",{type:"button","aria-pressed":n===b,onClick:()=>s(b),className:ve("flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-colors",n===b?"border-fg bg-surface-2 text-fg":"border-line text-fg-muted hover:bg-surface-2"),children:[a.jsx(ee,{className:"size-5"}),e(oe)]},b))})]}),a.jsxs("div",{children:[a.jsxs("p",{className:"mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle",children:[a.jsx(gn,{className:"size-3.5"}),e("Language")]}),a.jsx("div",{className:"grid grid-cols-2 gap-2",children:bn.map(b=>a.jsxs("button",{type:"button","aria-pressed":t.language===b.code,onClick:()=>t.changeLanguage(b.code),className:ve("flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",t.language===b.code?"border-fg bg-surface-2 text-fg":"border-line text-fg-muted hover:bg-surface-2"),children:[b.label,t.language===b.code&&a.jsx(ht,{className:"size-4"})]},b.code))})]})]})]})]})]}),a.jsx(Le,{open:p,onClose:()=>w(!1),title:"Change password",icon:Ue,size:"sm",children:a.jsx(qn,{onclose:()=>w(!1)})}),a.jsx(Le,{open:S,onClose:()=>N(!1),title:"Notification settings",icon:z,size:"lg",children:a.jsx(Ka,{onclose:()=>N(!1)})})]})}export{Ni as default};
