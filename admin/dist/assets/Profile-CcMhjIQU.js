import{c as ft,b1 as pt,m as K,r as w,j as a,V as E,i as on,o as Re,X as ht,h as cn,a as ln,t as dn,u as mt,b7 as un,a1 as fn,Y as pn,ad as $e,as as hn,D,aa as ve,B as mn,$ as z,b9 as ce,F as Le,at as gn,ba as bn,aQ as J,w as Fe,bc as wn,M as yn,e as gt,af as He,s as vn,R as xn,y as U,z as G,aI as Nn,H as In,K as En}from"./index-B_5E9Ryp.js";import{r as Sn}from"./RangePicker-B2zZwB65.js";import{P as jn}from"./ProfileHeader-DA1r60i8.js";import{I as le}from"./InputFields-DMtU67XR.js";import{L as te}from"./lock-DJ1sGo2W.js";import{A as _n}from"./AsyncWrapper-C8sJk6tZ.js";import{B as q}from"./bell-dmp9OOVN.js";import{B as bt,I as Cn}from"./ImageCropper-D7S_ym-W.js";import{M as Ve}from"./mail-B0eN65O8.js";import{C as An}from"./calendar-days-B6dbzWUY.js";import{M as wt}from"./map-pin-DiFx4XzJ.js";import{P as yt}from"./phone-Dru0Ma2a.js";import{G as Tn}from"./globe-KRUxzhxK.js";import{S as kn,K as Ue}from"./shield-check-BKXsimBt.js";import{S as Dn,M as On}from"./sun-CIQKz9Da.js";import{C as ze}from"./camera-D-clV2U-.js";import"./DateRangeFilter-Cuwtxd-u.js";import"./RowMenu-BmZ8pnwP.js";import"./ellipsis-vertical-BMDBh7k1.js";import"./minus-tsPzFiwk.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pn=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742",key:"178tsu"}],["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05",key:"1hqiys"}]],Bn=ft("bell-off",Pn);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mn=[["path",{d:"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",key:"e79jfc"}],["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}]],Rn=ft("palette",Mn),$n=async()=>{const{data:e}=await K.get("/profile");return e},Ln=()=>pt({queryKey:["profile"],queryFn:$n,keepPreviousData:!0,staleTime:1e3*60*2}),Fn=async()=>{const{data:e}=await K.get("/notification-preferences");return e},Hn=()=>pt({queryKey:["notification-preference"],queryFn:Fn,keepPreviousData:!0,staleTime:1e3*60*2}),Vn=({onclose:e})=>{const[t,n]=w.useState({currentPassword:"",newPassword:"",confirmPassword:""}),[s,r]=w.useState(!1),o=l=>{const{name:u,value:d}=l.target;n(p=>({...p,[u]:d}))},i=l=>{const u=/[A-Z]/.test(l),d=/[0-9]/.test(l);return u&&d},c=async l=>{var b,S;l.preventDefault();const{currentPassword:u,newPassword:d,confirmPassword:p}=t;if(!u)return E.error("Current password is required");if(!d)return E.error("New password is required");if(d.length<8)return E.error("New password must be at least 8 characters long");if(!i(d))return E.error("New password must include at least 1 capital letter and 1 number");if(!p)return E.error("Please confirm your new password");if(d!==p)return E.error("New Password and confirm password do not match");r(!0);try{const{data:x}=await K.put("update-password",t);E.success("Password updated successfully"),e(),r(!1)}catch(x){E.error(((S=(b=x.response)==null?void 0:b.data)==null?void 0:S.message)||x.message||"Something went wrong")}finally{r(!1)}};return a.jsxs("form",{className:"space-y-4",onSubmit:c,children:[a.jsx(le,{LabelTitle:" Current Password",placeholder:"Enter your current password",required:!0,inputVal:t.currentPassword,type:"password",icon:te,handleInputValue:o,name:"currentPassword"}),a.jsx(le,{LabelTitle:"New Password",placeholder:"Enter your new password",required:!0,inputVal:t.newPassword,type:"password",icon:te,handleInputValue:o,name:"newPassword"}),a.jsx(le,{LabelTitle:"Confirm New Password",placeholder:"Enter your confirm new password",required:!0,inputVal:t.confirmPassword,type:"password",icon:te,handleInputValue:o,name:"confirmPassword"}),a.jsxs("div",{className:"flex justify-between mt-2",children:[a.jsx("button",{className:"btn-red-outline bg-transparent",onClick:e,children:"Cancel"}),a.jsx("button",{className:"btn-red",type:"submit",disabled:s,children:s?"Updating...":"Update"})]})]})};/**
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
 */const Un=()=>{};var qe={};/**
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
 */const vt=function(e){const t=[];let n=0;for(let s=0;s<e.length;s++){let r=e.charCodeAt(s);r<128?t[n++]=r:r<2048?(t[n++]=r>>6|192,t[n++]=r&63|128):(r&64512)===55296&&s+1<e.length&&(e.charCodeAt(s+1)&64512)===56320?(r=65536+((r&1023)<<10)+(e.charCodeAt(++s)&1023),t[n++]=r>>18|240,t[n++]=r>>12&63|128,t[n++]=r>>6&63|128,t[n++]=r&63|128):(t[n++]=r>>12|224,t[n++]=r>>6&63|128,t[n++]=r&63|128)}return t},zn=function(e){const t=[];let n=0,s=0;for(;n<e.length;){const r=e[n++];if(r<128)t[s++]=String.fromCharCode(r);else if(r>191&&r<224){const o=e[n++];t[s++]=String.fromCharCode((r&31)<<6|o&63)}else if(r>239&&r<365){const o=e[n++],i=e[n++],c=e[n++],l=((r&7)<<18|(o&63)<<12|(i&63)<<6|c&63)-65536;t[s++]=String.fromCharCode(55296+(l>>10)),t[s++]=String.fromCharCode(56320+(l&1023))}else{const o=e[n++],i=e[n++];t[s++]=String.fromCharCode((r&15)<<12|(o&63)<<6|i&63)}}return t.join("")},xt={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let r=0;r<e.length;r+=3){const o=e[r],i=r+1<e.length,c=i?e[r+1]:0,l=r+2<e.length,u=l?e[r+2]:0,d=o>>2,p=(o&3)<<4|c>>4;let b=(c&15)<<2|u>>6,S=u&63;l||(S=64,i||(b=64)),s.push(n[d],n[p],n[b],n[S])}return s.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(vt(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):zn(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const n=t?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let r=0;r<e.length;){const o=n[e.charAt(r++)],c=r<e.length?n[e.charAt(r)]:0;++r;const u=r<e.length?n[e.charAt(r)]:64;++r;const p=r<e.length?n[e.charAt(r)]:64;if(++r,o==null||c==null||u==null||p==null)throw new qn;const b=o<<2|c>>4;if(s.push(b),u!==64){const S=c<<4&240|u>>2;if(s.push(S),p!==64){const x=u<<6&192|p;s.push(x)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class qn extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Kn=function(e){const t=vt(e);return xt.encodeByteArray(t,!0)},Nt=function(e){return Kn(e).replace(/\./g,"")},Wn=function(e){try{return xt.decodeString(e,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
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
 */function Gn(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const Jn=()=>Gn().__FIREBASE_DEFAULTS__,Yn=()=>{if(typeof process>"u"||typeof qe>"u")return;const e=qe.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},Qn=()=>{if(typeof document>"u")return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=e&&Wn(e[1]);return t&&JSON.parse(t)},Xn=()=>{try{return Un()||Jn()||Yn()||Qn()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}},It=()=>{var e;return(e=Xn())===null||e===void 0?void 0:e.config};/**
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
 */class Zn{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,n)=>{this.resolve=t,this.reject=n})}wrapCallback(t){return(n,s)=>{n?this.reject(n):this.resolve(s),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(n):t(n,s))}}}function Et(){try{return typeof indexedDB=="object"}catch{return!1}}function St(){return new Promise((e,t)=>{try{let n=!0;const s="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(s);r.onsuccess=()=>{r.result.close(),n||self.indexedDB.deleteDatabase(s),e(!0)},r.onupgradeneeded=()=>{n=!1},r.onerror=()=>{var o;t(((o=r.error)===null||o===void 0?void 0:o.message)||"")}}catch(n){t(n)}})}function es(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
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
 */const ts="FirebaseError";class W extends Error{constructor(t,n,s){super(n),this.code=t,this.customData=s,this.name=ts,Object.setPrototypeOf(this,W.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,se.prototype.create)}}class se{constructor(t,n,s){this.service=t,this.serviceName=n,this.errors=s}create(t,...n){const s=n[0]||{},r=`${this.service}/${t}`,o=this.errors[t],i=o?ns(o,s):"Error",c=`${this.serviceName}: ${i} (${r}).`;return new W(r,c,s)}}function ns(e,t){return e.replace(ss,(n,s)=>{const r=t[s];return r!=null?String(r):`<${s}?>`})}const ss=/\{\$([^}]+)}/g;function xe(e,t){if(e===t)return!0;const n=Object.keys(e),s=Object.keys(t);for(const r of n){if(!s.includes(r))return!1;const o=e[r],i=t[r];if(Ke(o)&&Ke(i)){if(!xe(o,i))return!1}else if(o!==i)return!1}for(const r of s)if(!n.includes(r))return!1;return!0}function Ke(e){return e!==null&&typeof e=="object"}/**
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
 */function jt(e){return e&&e._delegate?e._delegate:e}class B{constructor(t,n,s){this.name=t,this.instanceFactory=n,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
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
 */const $="[DEFAULT]";/**
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
 */class rs{constructor(t,n){this.name=t,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const n=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(n)){const s=new Zn;if(this.instancesDeferred.set(n,s),this.isInitialized(n)||this.shouldAutoInitialize())try{const r=this.getOrInitializeService({instanceIdentifier:n});r&&s.resolve(r)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(t){var n;const s=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),r=(n=t==null?void 0:t.optional)!==null&&n!==void 0?n:!1;if(this.isInitialized(s)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:s})}catch(o){if(r)return null;throw o}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(is(t))try{this.getOrInitializeService({instanceIdentifier:$})}catch{}for(const[n,s]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(n);try{const o=this.getOrInitializeService({instanceIdentifier:r});s.resolve(o)}catch{}}}}clearInstance(t=$){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...t.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=$){return this.instances.has(t)}getOptions(t=$){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:n={}}=t,s=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:s,options:n});for(const[o,i]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(o);s===c&&i.resolve(r)}return r}onInit(t,n){var s;const r=this.normalizeInstanceIdentifier(n),o=(s=this.onInitCallbacks.get(r))!==null&&s!==void 0?s:new Set;o.add(t),this.onInitCallbacks.set(r,o);const i=this.instances.get(r);return i&&t(i,r),()=>{o.delete(t)}}invokeOnInitCallbacks(t,n){const s=this.onInitCallbacks.get(n);if(s)for(const r of s)try{r(t,n)}catch{}}getOrInitializeService({instanceIdentifier:t,options:n={}}){let s=this.instances.get(t);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:as(t),options:n}),this.instances.set(t,s),this.instancesOptions.set(t,n),this.invokeOnInitCallbacks(s,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,s)}catch{}return s||null}normalizeInstanceIdentifier(t=$){return this.component?this.component.multipleInstances?t:$:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function as(e){return e===$?void 0:e}function is(e){return e.instantiationMode==="EAGER"}/**
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
 */class os{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const n=this.getProvider(t.name);if(n.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);n.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const n=new rs(t,this);return this.providers.set(t,n),n}getProviders(){return Array.from(this.providers.values())}}/**
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
 */var g;(function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"})(g||(g={}));const cs={debug:g.DEBUG,verbose:g.VERBOSE,info:g.INFO,warn:g.WARN,error:g.ERROR,silent:g.SILENT},ls=g.INFO,ds={[g.DEBUG]:"log",[g.VERBOSE]:"log",[g.INFO]:"info",[g.WARN]:"warn",[g.ERROR]:"error"},us=(e,t,...n)=>{if(t<e.logLevel)return;const s=new Date().toISOString(),r=ds[t];if(r)console[r](`[${s}]  ${e.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class fs{constructor(t){this.name=t,this._logLevel=ls,this._logHandler=us,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in g))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?cs[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,g.DEBUG,...t),this._logHandler(this,g.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,g.VERBOSE,...t),this._logHandler(this,g.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,g.INFO,...t),this._logHandler(this,g.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,g.WARN,...t),this._logHandler(this,g.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,g.ERROR,...t),this._logHandler(this,g.ERROR,...t)}}const ps=(e,t)=>t.some(n=>e instanceof n);let We,Ge;function hs(){return We||(We=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function ms(){return Ge||(Ge=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const _t=new WeakMap,Ne=new WeakMap,Ct=new WeakMap,de=new WeakMap,Ce=new WeakMap;function gs(e){const t=new Promise((n,s)=>{const r=()=>{e.removeEventListener("success",o),e.removeEventListener("error",i)},o=()=>{n(A(e.result)),r()},i=()=>{s(e.error),r()};e.addEventListener("success",o),e.addEventListener("error",i)});return t.then(n=>{n instanceof IDBCursor&&_t.set(n,e)}).catch(()=>{}),Ce.set(t,e),t}function bs(e){if(Ne.has(e))return;const t=new Promise((n,s)=>{const r=()=>{e.removeEventListener("complete",o),e.removeEventListener("error",i),e.removeEventListener("abort",i)},o=()=>{n(),r()},i=()=>{s(e.error||new DOMException("AbortError","AbortError")),r()};e.addEventListener("complete",o),e.addEventListener("error",i),e.addEventListener("abort",i)});Ne.set(e,t)}let Ie={get(e,t,n){if(e instanceof IDBTransaction){if(t==="done")return Ne.get(e);if(t==="objectStoreNames")return e.objectStoreNames||Ct.get(e);if(t==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return A(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function ws(e){Ie=e(Ie)}function ys(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...n){const s=e.call(ue(this),t,...n);return Ct.set(s,t.sort?t.sort():[t]),A(s)}:ms().includes(e)?function(...t){return e.apply(ue(this),t),A(_t.get(this))}:function(...t){return A(e.apply(ue(this),t))}}function vs(e){return typeof e=="function"?ys(e):(e instanceof IDBTransaction&&bs(e),ps(e,hs())?new Proxy(e,Ie):e)}function A(e){if(e instanceof IDBRequest)return gs(e);if(de.has(e))return de.get(e);const t=vs(e);return t!==e&&(de.set(e,t),Ce.set(t,e)),t}const ue=e=>Ce.get(e);function re(e,t,{blocked:n,upgrade:s,blocking:r,terminated:o}={}){const i=indexedDB.open(e,t),c=A(i);return s&&i.addEventListener("upgradeneeded",l=>{s(A(i.result),l.oldVersion,l.newVersion,A(i.transaction),l)}),n&&i.addEventListener("blocked",l=>n(l.oldVersion,l.newVersion,l)),c.then(l=>{o&&l.addEventListener("close",()=>o()),r&&l.addEventListener("versionchange",u=>r(u.oldVersion,u.newVersion,u))}).catch(()=>{}),c}function fe(e,{blocked:t}={}){const n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",s=>t(s.oldVersion,s)),A(n).then(()=>{})}const xs=["get","getKey","getAll","getAllKeys","count"],Ns=["put","add","delete","clear"],pe=new Map;function Je(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(pe.get(t))return pe.get(t);const n=t.replace(/FromIndex$/,""),s=t!==n,r=Ns.includes(n);if(!(n in(s?IDBIndex:IDBObjectStore).prototype)||!(r||xs.includes(n)))return;const o=async function(i,...c){const l=this.transaction(i,r?"readwrite":"readonly");let u=l.store;return s&&(u=u.index(c.shift())),(await Promise.all([u[n](...c),r&&l.done]))[0]};return pe.set(t,o),o}ws(e=>({...e,get:(t,n,s)=>Je(t,n)||e.get(t,n,s),has:(t,n)=>!!Je(t,n)||e.has(t,n)}));/**
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
 */class Is{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(Es(n)){const s=n.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(n=>n).join(" ")}}function Es(e){const t=e.getComponent();return(t==null?void 0:t.type)==="VERSION"}const Ee="@firebase/app",Ye="0.13.1";/**
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
 */const T=new fs("@firebase/app"),Ss="@firebase/app-compat",js="@firebase/analytics-compat",_s="@firebase/analytics",Cs="@firebase/app-check-compat",As="@firebase/app-check",Ts="@firebase/auth",ks="@firebase/auth-compat",Ds="@firebase/database",Os="@firebase/data-connect",Ps="@firebase/database-compat",Bs="@firebase/functions",Ms="@firebase/functions-compat",Rs="@firebase/installations",$s="@firebase/installations-compat",Ls="@firebase/messaging",Fs="@firebase/messaging-compat",Hs="@firebase/performance",Vs="@firebase/performance-compat",Us="@firebase/remote-config",zs="@firebase/remote-config-compat",qs="@firebase/storage",Ks="@firebase/storage-compat",Ws="@firebase/firestore",Gs="@firebase/ai",Js="@firebase/firestore-compat",Ys="firebase";/**
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
 */const Se="[DEFAULT]",Qs={[Ee]:"fire-core",[Ss]:"fire-core-compat",[_s]:"fire-analytics",[js]:"fire-analytics-compat",[As]:"fire-app-check",[Cs]:"fire-app-check-compat",[Ts]:"fire-auth",[ks]:"fire-auth-compat",[Ds]:"fire-rtdb",[Os]:"fire-data-connect",[Ps]:"fire-rtdb-compat",[Bs]:"fire-fn",[Ms]:"fire-fn-compat",[Rs]:"fire-iid",[$s]:"fire-iid-compat",[Ls]:"fire-fcm",[Fs]:"fire-fcm-compat",[Hs]:"fire-perf",[Vs]:"fire-perf-compat",[Us]:"fire-rc",[zs]:"fire-rc-compat",[qs]:"fire-gcs",[Ks]:"fire-gcs-compat",[Ws]:"fire-fst",[Js]:"fire-fst-compat",[Gs]:"fire-vertex","fire-js":"fire-js",[Ys]:"fire-js-all"};/**
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
 */const Y=new Map,Xs=new Map,je=new Map;function Qe(e,t){try{e.container.addComponent(t)}catch(n){T.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function F(e){const t=e.name;if(je.has(t))return T.debug(`There were multiple attempts to register component ${t}.`),!1;je.set(t,e);for(const n of Y.values())Qe(n,e);for(const n of Xs.values())Qe(n,e);return!0}function Ae(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}/**
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
 */const Zs={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},O=new se("app","Firebase",Zs);/**
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
 */class er{constructor(t,n,s){this._isDeleted=!1,this._options=Object.assign({},t),this._config=Object.assign({},n),this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new B("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw O.create("app-deleted",{appName:this._name})}}function At(e,t={}){let n=e;typeof t!="object"&&(t={name:t});const s=Object.assign({name:Se,automaticDataCollectionEnabled:!0},t),r=s.name;if(typeof r!="string"||!r)throw O.create("bad-app-name",{appName:String(r)});if(n||(n=It()),!n)throw O.create("no-options");const o=Y.get(r);if(o){if(xe(n,o.options)&&xe(s,o.config))return o;throw O.create("duplicate-app",{appName:r})}const i=new os(r);for(const l of je.values())i.addComponent(l);const c=new er(n,s,i);return Y.set(r,c),c}function Tt(e=Se){const t=Y.get(e);if(!t&&e===Se&&It())return At();if(!t)throw O.create("no-app",{appName:e});return t}function tr(){return Array.from(Y.values())}function P(e,t,n){var s;let r=(s=Qs[e])!==null&&s!==void 0?s:e;n&&(r+=`-${n}`);const o=r.match(/\s|\//),i=t.match(/\s|\//);if(o||i){const c=[`Unable to register library "${r}" with version "${t}":`];o&&c.push(`library name "${r}" contains illegal characters (whitespace or "/")`),o&&i&&c.push("and"),i&&c.push(`version name "${t}" contains illegal characters (whitespace or "/")`),T.warn(c.join(" "));return}F(new B(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
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
 */const nr="firebase-heartbeat-database",sr=1,Q="firebase-heartbeat-store";let he=null;function kt(){return he||(he=re(nr,sr,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(Q)}catch(n){console.warn(n)}}}}).catch(e=>{throw O.create("idb-open",{originalErrorMessage:e.message})})),he}async function rr(e){try{const n=(await kt()).transaction(Q),s=await n.objectStore(Q).get(Dt(e));return await n.done,s}catch(t){if(t instanceof W)T.warn(t.message);else{const n=O.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});T.warn(n.message)}}}async function Xe(e,t){try{const s=(await kt()).transaction(Q,"readwrite");await s.objectStore(Q).put(t,Dt(e)),await s.done}catch(n){if(n instanceof W)T.warn(n.message);else{const s=O.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});T.warn(s.message)}}}function Dt(e){return`${e.name}!${e.options.appId}`}/**
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
 */const ar=1024,ir=30;class or{constructor(t){this.container=t,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new lr(n),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){var t,n;try{const r=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=Ze();if(((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)===null||n===void 0?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(i=>i.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:r}),this._heartbeatsCache.heartbeats.length>ir){const i=dr(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(i,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(s){T.warn(s)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=Ze(),{heartbeatsToSend:s,unsentEntries:r}=cr(this._heartbeatsCache.heartbeats),o=Nt(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=n,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(n){return T.warn(n),""}}}function Ze(){return new Date().toISOString().substring(0,10)}function cr(e,t=ar){const n=[];let s=e.slice();for(const r of e){const o=n.find(i=>i.agent===r.agent);if(o){if(o.dates.push(r.date),et(n)>t){o.dates.pop();break}}else if(n.push({agent:r.agent,dates:[r.date]}),et(n)>t){n.pop();break}s=s.slice(1)}return{heartbeatsToSend:n,unsentEntries:s}}class lr{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Et()?St().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await rr(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){var n;if(await this._canUseIndexedDBPromise){const r=await this.read();return Xe(this.app,{lastSentHeartbeatDate:(n=t.lastSentHeartbeatDate)!==null&&n!==void 0?n:r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){var n;if(await this._canUseIndexedDBPromise){const r=await this.read();return Xe(this.app,{lastSentHeartbeatDate:(n=t.lastSentHeartbeatDate)!==null&&n!==void 0?n:r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function et(e){return Nt(JSON.stringify({version:2,heartbeats:e})).length}function dr(e){if(e.length===0)return-1;let t=0,n=e[0].date;for(let s=1;s<e.length;s++)e[s].date<n&&(n=e[s].date,t=s);return t}/**
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
 */function ur(e){F(new B("platform-logger",t=>new Is(t),"PRIVATE")),F(new B("heartbeat",t=>new or(t),"PRIVATE")),P(Ee,Ye,e),P(Ee,Ye,"esm2017"),P("fire-js","")}ur("");var fr="firebase",pr="11.9.0";/**
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
 */P(fr,pr,"app");const Ot="@firebase/installations",Te="0.6.17";/**
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
 */const Pt=1e4,Bt=`w:${Te}`,Mt="FIS_v2",hr="https://firebaseinstallations.googleapis.com/v1",mr=60*60*1e3,gr="installations",br="Installations";/**
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
 */const wr={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},H=new se(gr,br,wr);function Rt(e){return e instanceof W&&e.code.includes("request-failed")}/**
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
 */function $t({projectId:e}){return`${hr}/projects/${e}/installations`}function Lt(e){return{token:e.token,requestStatus:2,expiresIn:vr(e.expiresIn),creationTime:Date.now()}}async function Ft(e,t){const s=(await t.json()).error;return H.create("request-failed",{requestName:e,serverCode:s.code,serverMessage:s.message,serverStatus:s.status})}function Ht({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function yr(e,{refreshToken:t}){const n=Ht(e);return n.append("Authorization",xr(t)),n}async function Vt(e){const t=await e();return t.status>=500&&t.status<600?e():t}function vr(e){return Number(e.replace("s","000"))}function xr(e){return`${Mt} ${e}`}/**
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
 */async function Nr({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const s=$t(e),r=Ht(e),o=t.getImmediate({optional:!0});if(o){const u=await o.getHeartbeatsHeader();u&&r.append("x-firebase-client",u)}const i={fid:n,authVersion:Mt,appId:e.appId,sdkVersion:Bt},c={method:"POST",headers:r,body:JSON.stringify(i)},l=await Vt(()=>fetch(s,c));if(l.ok){const u=await l.json();return{fid:u.fid||n,registrationStatus:2,refreshToken:u.refreshToken,authToken:Lt(u.authToken)}}else throw await Ft("Create Installation",l)}/**
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
 */function Ir(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
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
 */const Er=/^[cdef][\w-]{21}$/,_e="";function Sr(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=jr(e);return Er.test(n)?n:_e}catch{return _e}}function jr(e){return Ir(e).substr(0,22)}/**
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
 */const zt=new Map;function qt(e,t){const n=ae(e);Kt(n,t),_r(n,t)}function Kt(e,t){const n=zt.get(e);if(n)for(const s of n)s(t)}function _r(e,t){const n=Cr();n&&n.postMessage({key:e,fid:t}),Ar()}let L=null;function Cr(){return!L&&"BroadcastChannel"in self&&(L=new BroadcastChannel("[Firebase] FID Change"),L.onmessage=e=>{Kt(e.data.key,e.data.fid)}),L}function Ar(){zt.size===0&&L&&(L.close(),L=null)}/**
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
 */const Tr="firebase-installations-database",kr=1,V="firebase-installations-store";let me=null;function ke(){return me||(me=re(Tr,kr,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(V)}}})),me}async function ne(e,t){const n=ae(e),r=(await ke()).transaction(V,"readwrite"),o=r.objectStore(V),i=await o.get(n);return await o.put(t,n),await r.done,(!i||i.fid!==t.fid)&&qt(e,t.fid),t}async function Wt(e){const t=ae(e),s=(await ke()).transaction(V,"readwrite");await s.objectStore(V).delete(t),await s.done}async function ie(e,t){const n=ae(e),r=(await ke()).transaction(V,"readwrite"),o=r.objectStore(V),i=await o.get(n),c=t(i);return c===void 0?await o.delete(n):await o.put(c,n),await r.done,c&&(!i||i.fid!==c.fid)&&qt(e,c.fid),c}/**
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
 */async function De(e){let t;const n=await ie(e.appConfig,s=>{const r=Dr(s),o=Or(e,r);return t=o.registrationPromise,o.installationEntry});return n.fid===_e?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function Dr(e){const t=e||{fid:Sr(),registrationStatus:0};return Gt(t)}function Or(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const r=Promise.reject(H.create("app-offline"));return{installationEntry:t,registrationPromise:r}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},s=Pr(e,n);return{installationEntry:n,registrationPromise:s}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:Br(e)}:{installationEntry:t}}async function Pr(e,t){try{const n=await Nr(e,t);return ne(e.appConfig,n)}catch(n){throw Rt(n)&&n.customData.serverCode===409?await Wt(e.appConfig):await ne(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function Br(e){let t=await tt(e.appConfig);for(;t.registrationStatus===1;)await Ut(100),t=await tt(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:s}=await De(e);return s||n}return t}function tt(e){return ie(e,t=>{if(!t)throw H.create("installation-not-found");return Gt(t)})}function Gt(e){return Mr(e)?{fid:e.fid,registrationStatus:0}:e}function Mr(e){return e.registrationStatus===1&&e.registrationTime+Pt<Date.now()}/**
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
 */async function Rr({appConfig:e,heartbeatServiceProvider:t},n){const s=$r(e,n),r=yr(e,n),o=t.getImmediate({optional:!0});if(o){const u=await o.getHeartbeatsHeader();u&&r.append("x-firebase-client",u)}const i={installation:{sdkVersion:Bt,appId:e.appId}},c={method:"POST",headers:r,body:JSON.stringify(i)},l=await Vt(()=>fetch(s,c));if(l.ok){const u=await l.json();return Lt(u)}else throw await Ft("Generate Auth Token",l)}function $r(e,{fid:t}){return`${$t(e)}/${t}/authTokens:generate`}/**
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
 */async function Oe(e,t=!1){let n;const s=await ie(e.appConfig,o=>{if(!Jt(o))throw H.create("not-registered");const i=o.authToken;if(!t&&Hr(i))return o;if(i.requestStatus===1)return n=Lr(e,t),o;{if(!navigator.onLine)throw H.create("app-offline");const c=Ur(o);return n=Fr(e,c),c}});return n?await n:s.authToken}async function Lr(e,t){let n=await nt(e.appConfig);for(;n.authToken.requestStatus===1;)await Ut(100),n=await nt(e.appConfig);const s=n.authToken;return s.requestStatus===0?Oe(e,t):s}function nt(e){return ie(e,t=>{if(!Jt(t))throw H.create("not-registered");const n=t.authToken;return zr(n)?Object.assign(Object.assign({},t),{authToken:{requestStatus:0}}):t})}async function Fr(e,t){try{const n=await Rr(e,t),s=Object.assign(Object.assign({},t),{authToken:n});return await ne(e.appConfig,s),n}catch(n){if(Rt(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await Wt(e.appConfig);else{const s=Object.assign(Object.assign({},t),{authToken:{requestStatus:0}});await ne(e.appConfig,s)}throw n}}function Jt(e){return e!==void 0&&e.registrationStatus===2}function Hr(e){return e.requestStatus===2&&!Vr(e)}function Vr(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+mr}function Ur(e){const t={requestStatus:1,requestTime:Date.now()};return Object.assign(Object.assign({},e),{authToken:t})}function zr(e){return e.requestStatus===1&&e.requestTime+Pt<Date.now()}/**
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
 */async function qr(e){const t=e,{installationEntry:n,registrationPromise:s}=await De(t);return s?s.catch(console.error):Oe(t).catch(console.error),n.fid}/**
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
 */async function Kr(e,t=!1){const n=e;return await Wr(n),(await Oe(n,t)).token}async function Wr(e){const{registrationPromise:t}=await De(e);t&&await t}/**
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
 */function Gr(e){if(!e||!e.options)throw ge("App Configuration");if(!e.name)throw ge("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw ge(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function ge(e){return H.create("missing-app-config-values",{valueName:e})}/**
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
 */const Yt="installations",Jr="installations-internal",Yr=e=>{const t=e.getProvider("app").getImmediate(),n=Gr(t),s=Ae(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:s,_delete:()=>Promise.resolve()}},Qr=e=>{const t=e.getProvider("app").getImmediate(),n=Ae(t,Yt).getImmediate();return{getId:()=>qr(n),getToken:r=>Kr(n,r)}};function Xr(){F(new B(Yt,Yr,"PUBLIC")),F(new B(Jr,Qr,"PRIVATE"))}Xr();P(Ot,Te);P(Ot,Te,"esm2017");/**
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
 */const Zr="/firebase-messaging-sw.js",ea="/firebase-cloud-messaging-push-scope",Qt="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",ta="https://fcmregistrations.googleapis.com/v1",Xt="google.c.a.c_id",na="google.c.a.c_l",sa="google.c.a.ts",ra="google.c.a.e",st=1e4;var rt;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(rt||(rt={}));/**
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
 */var X;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked"})(X||(X={}));/**
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
 */function C(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function aa(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),s=atob(n),r=new Uint8Array(s.length);for(let o=0;o<s.length;++o)r[o]=s.charCodeAt(o);return r}/**
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
 */const be="fcm_token_details_db",ia=5,at="fcm_token_object_Store";async function oa(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(o=>o.name).includes(be))return null;let t=null;return(await re(be,ia,{upgrade:async(s,r,o,i)=>{var c;if(r<2||!s.objectStoreNames.contains(at))return;const l=i.objectStore(at),u=await l.index("fcmSenderId").get(e);if(await l.clear(),!!u){if(r===2){const d=u;if(!d.auth||!d.p256dh||!d.endpoint)return;t={token:d.fcmToken,createTime:(c=d.createTime)!==null&&c!==void 0?c:Date.now(),subscriptionOptions:{auth:d.auth,p256dh:d.p256dh,endpoint:d.endpoint,swScope:d.swScope,vapidKey:typeof d.vapidKey=="string"?d.vapidKey:C(d.vapidKey)}}}else if(r===3){const d=u;t={token:d.fcmToken,createTime:d.createTime,subscriptionOptions:{auth:C(d.auth),p256dh:C(d.p256dh),endpoint:d.endpoint,swScope:d.swScope,vapidKey:C(d.vapidKey)}}}else if(r===4){const d=u;t={token:d.fcmToken,createTime:d.createTime,subscriptionOptions:{auth:C(d.auth),p256dh:C(d.p256dh),endpoint:d.endpoint,swScope:d.swScope,vapidKey:C(d.vapidKey)}}}}}})).close(),await fe(be),await fe("fcm_vapid_details_db"),await fe("undefined"),ca(t)?t:null}function ca(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
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
 */const la="firebase-messaging-database",da=1,Z="firebase-messaging-store";let we=null;function Zt(){return we||(we=re(la,da,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(Z)}}})),we}async function ua(e){const t=en(e),s=await(await Zt()).transaction(Z).objectStore(Z).get(t);if(s)return s;{const r=await oa(e.appConfig.senderId);if(r)return await Pe(e,r),r}}async function Pe(e,t){const n=en(e),r=(await Zt()).transaction(Z,"readwrite");return await r.objectStore(Z).put(t,n),await r.done,t}function en({appConfig:e}){return e.appId}/**
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
 */const fa={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},v=new se("messaging","Messaging",fa);/**
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
 */async function pa(e,t){const n=await Me(e),s=tn(t),r={method:"POST",headers:n,body:JSON.stringify(s)};let o;try{o=await(await fetch(Be(e.appConfig),r)).json()}catch(i){throw v.create("token-subscribe-failed",{errorInfo:i==null?void 0:i.toString()})}if(o.error){const i=o.error.message;throw v.create("token-subscribe-failed",{errorInfo:i})}if(!o.token)throw v.create("token-subscribe-no-token");return o.token}async function ha(e,t){const n=await Me(e),s=tn(t.subscriptionOptions),r={method:"PATCH",headers:n,body:JSON.stringify(s)};let o;try{o=await(await fetch(`${Be(e.appConfig)}/${t.token}`,r)).json()}catch(i){throw v.create("token-update-failed",{errorInfo:i==null?void 0:i.toString()})}if(o.error){const i=o.error.message;throw v.create("token-update-failed",{errorInfo:i})}if(!o.token)throw v.create("token-update-no-token");return o.token}async function ma(e,t){const s={method:"DELETE",headers:await Me(e)};try{const o=await(await fetch(`${Be(e.appConfig)}/${t}`,s)).json();if(o.error){const i=o.error.message;throw v.create("token-unsubscribe-failed",{errorInfo:i})}}catch(r){throw v.create("token-unsubscribe-failed",{errorInfo:r==null?void 0:r.toString()})}}function Be({projectId:e}){return`${ta}/projects/${e}/registrations`}async function Me({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function tn({p256dh:e,auth:t,endpoint:n,vapidKey:s}){const r={web:{endpoint:n,auth:t,p256dh:e}};return s!==Qt&&(r.web.applicationPubKey=s),r}/**
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
 */const ga=7*24*60*60*1e3;async function ba(e){const t=await ya(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:C(t.getKey("auth")),p256dh:C(t.getKey("p256dh"))},s=await ua(e.firebaseDependencies);if(s){if(va(s.subscriptionOptions,n))return Date.now()>=s.createTime+ga?wa(e,{token:s.token,createTime:Date.now(),subscriptionOptions:n}):s.token;try{await ma(e.firebaseDependencies,s.token)}catch(r){console.warn(r)}return it(e.firebaseDependencies,n)}else return it(e.firebaseDependencies,n)}async function wa(e,t){try{const n=await ha(e.firebaseDependencies,t),s=Object.assign(Object.assign({},t),{token:n,createTime:Date.now()});return await Pe(e.firebaseDependencies,s),n}catch(n){throw n}}async function it(e,t){const s={token:await pa(e,t),createTime:Date.now(),subscriptionOptions:t};return await Pe(e,s),s.token}async function ya(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:aa(t)})}function va(e,t){const n=t.vapidKey===e.vapidKey,s=t.endpoint===e.endpoint,r=t.auth===e.auth,o=t.p256dh===e.p256dh;return n&&s&&r&&o}/**
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
 */function ot(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return xa(t,e),Na(t,e),Ia(t,e),t}function xa(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const s=t.notification.body;s&&(e.notification.body=s);const r=t.notification.image;r&&(e.notification.image=r);const o=t.notification.icon;o&&(e.notification.icon=o)}function Na(e,t){t.data&&(e.data=t.data)}function Ia(e,t){var n,s,r,o,i;if(!t.fcmOptions&&!(!((n=t.notification)===null||n===void 0)&&n.click_action))return;e.fcmOptions={};const c=(r=(s=t.fcmOptions)===null||s===void 0?void 0:s.link)!==null&&r!==void 0?r:(o=t.notification)===null||o===void 0?void 0:o.click_action;c&&(e.fcmOptions.link=c);const l=(i=t.fcmOptions)===null||i===void 0?void 0:i.analytics_label;l&&(e.fcmOptions.analyticsLabel=l)}/**
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
 */function Ea(e){return typeof e=="object"&&!!e&&Xt in e}/**
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
 */function Sa(e){if(!e||!e.options)throw ye("App Configuration Object");if(!e.name)throw ye("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const s of t)if(!n[s])throw ye(s);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function ye(e){return v.create("missing-app-config-values",{valueName:e})}/**
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
 */class ja{constructor(t,n,s){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const r=Sa(t);this.firebaseDependencies={app:t,appConfig:r,installations:n,analyticsProvider:s}}_delete(){return Promise.resolve()}}/**
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
 */async function _a(e){try{e.swRegistration=await navigator.serviceWorker.register(Zr,{scope:ea}),e.swRegistration.update().catch(()=>{}),await Ca(e.swRegistration)}catch(t){throw v.create("failed-service-worker-registration",{browserErrorMessage:t==null?void 0:t.message})}}async function Ca(e){return new Promise((t,n)=>{const s=setTimeout(()=>n(new Error(`Service worker not registered after ${st} ms`)),st),r=e.installing||e.waiting;e.active?(clearTimeout(s),t()):r?r.onstatechange=o=>{var i;((i=o.target)===null||i===void 0?void 0:i.state)==="activated"&&(r.onstatechange=null,clearTimeout(s),t())}:(clearTimeout(s),n(new Error("No incoming service worker found.")))})}/**
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
 */async function Aa(e,t){if(!t&&!e.swRegistration&&await _a(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw v.create("invalid-sw-registration");e.swRegistration=t}}/**
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
 */async function Ta(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=Qt)}/**
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
 */async function nn(e,t){if(!navigator)throw v.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw v.create("permission-blocked");return await Ta(e,t==null?void 0:t.vapidKey),await Aa(e,t==null?void 0:t.serviceWorkerRegistration),ba(e)}/**
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
 */async function ka(e,t,n){const s=Da(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(s,{message_id:n[Xt],message_name:n[na],message_time:n[sa],message_device_time:Math.floor(Date.now()/1e3)})}function Da(e){switch(e){case X.NOTIFICATION_CLICKED:return"notification_open";case X.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
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
 */async function Oa(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===X.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(ot(n)):e.onMessageHandler.next(ot(n)));const s=n.data;Ea(s)&&s[ra]==="1"&&await ka(e,n.messageType,s)}const ct="@firebase/messaging",lt="0.12.21";/**
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
 */const Pa=e=>{const t=new ja(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>Oa(t,n)),t},Ba=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:s=>nn(t,s)}};function Ma(){F(new B("messaging",Pa,"PUBLIC")),F(new B("messaging-internal",Ba,"PRIVATE")),P(ct,lt),P(ct,lt,"esm2017")}/**
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
 */async function sn(){try{await St()}catch{return!1}return typeof window<"u"&&Et()&&es()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
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
 */function Ra(e=Tt()){return sn().then(t=>{if(!t)throw v.create("unsupported-browser")},t=>{throw v.create("indexed-db-unsupported")}),Ae(jt(e),"messaging").getImmediate()}async function $a(e,t){return e=jt(e),nn(e,t)}Ma();const La={apiKey:"AIzaSyAJjWngAN7g3eOLBBtafthga1SCvrKtNRY",authDomain:"janpadnewstimes-d2eb4.firebaseapp.com",projectId:"janpadnewstimes-d2eb4",storageBucket:"janpadnewstimes-d2eb4.firebasestorage.app",messagingSenderId:"228931912040",appId:"1:228931912040:web:27c22afbfdd8a7cd1f96dd",measurementId:"G-Q2N5Z7SJJ6"},Fa=tr().length===0?At(La):Tt(),Ha=async()=>await sn()?Ra(Fa):null,Va=async()=>{try{const e=await Ha();return e?await $a(e,{vapidKey:"BHH2jt5T0ZzDBoLvfZ1GKBx-7P1SUNiFysViUImiWqruHDMRYf9Q-O_Jl6P_OWWArybAZg9H7f6Gj4ZPqZ7UJVU"}):null}catch(e){return console.error("An error occurred while fetching the token:",e),null}},Ua=({onclose:e})=>{const{user:t}=on(y=>y.user),[n,s]=w.useState("default"),[r,o]=w.useState(!1),{data:i,isPending:c,isError:l,error:u,refetch:d}=Hn(),[p,b]=w.useState({newsAdded:!0,eventNews:!0,newsDeleted:!1,newsUpdated:!1,others:!1});w.useEffect(()=>{"Notification"in window&&s(Notification.permission)},[]);const S=async()=>{if(!("Notification"in window)){alert("This browser does not support notifications");return}o(!0);try{const y=await Notification.requestPermission();if(s(y),y==="granted"){new Notification("Notifications Enabled!",{body:"You will now receive notifications from this app.",icon:"/favicon.ico"});const h=await Va();await K.put("update-fcm",{fcm:h})}}catch(y){console.error("Error requesting notification permission:",y)}finally{o(!1)}},x=()=>{switch(n){case"granted":return{text:"Enabled",color:"text-success",bgColor:"bg-success-soft",icon:a.jsx(cn,{size:16})};case"denied":return{text:"Blocked",color:"text-danger",bgColor:"bg-danger-soft",icon:a.jsx(ht,{size:16})};default:return{text:"Not Set",color:"text-warning",bgColor:"bg-warning-soft",icon:a.jsx(Bn,{size:16})}}},N=async y=>{const h=!p[y];b(m=>({...m,[y]:h}));try{await K.post("update-notification-preference",{type:y,enabled:h}),d()}catch(m){console.error("Failed to update preference:",m)}},j=()=>{n==="granted"&&new Notification("Test Notification",{body:"This is a test notification to verify everything is working correctly.",icon:"/favicon.ico",tag:"test-notification"})},k=x();return w.useEffect(()=>{i&&b(i)},[c]),a.jsx(_n,{isPending:c,isError:l,error:u,children:a.jsxs("div",{className:"space-y-4",children:[a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:`p-2 rounded-full ${k.bgColor}`,children:a.jsx("div",{className:k.color,children:k.icon})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Browser Notifications"}),a.jsxs("p",{className:"text-sm text-fg-subtle",children:["Status: ",k.text]})]})]}),a.jsxs("div",{className:"flex items-center gap-2",children:[(n==="default"||n==="denied")&&a.jsx("button",{onClick:S,disabled:r,className:"bg-primary hover:bg-primary-hover disabled:bg-primary text-paper px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm",children:r?"Requesting...":"Enable Notifications"}),n==="granted"&&a.jsx("button",{onClick:j,className:"bg-success hover:bg-success text-paper px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm",children:"Test"})]})]}),n==="granted"&&a.jsxs("div",{className:"space-y-3",children:[a.jsx("h3",{className:"text-sm font-semibold text-fg-muted uppercase tracking-wide",children:"Notification Types"}),t.role==="admin"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-primary-soft",children:a.jsx(q,{className:"text-primary",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Add News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"News added by reporter"})]})]}),a.jsx("button",{onClick:()=>N("newsAdded"),className:`w-5 h-5 rounded-full border-2 ${p.newsAdded?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.newsAdded&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),t.role==="admin"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-primary-soft",children:a.jsx(Re,{className:"text-primary",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Event News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"Event news added by reporter"})]})]}),a.jsx("button",{onClick:()=>N("eventNews"),className:`w-5 h-5 rounded-full border-2 ${p.eventNews?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.eventNews&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),t.role==="reporter"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-success-soft",children:a.jsx(q,{className:"text-success",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Deleted News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"News deleted by admin"})]})]}),a.jsx("button",{onClick:()=>N("newsDeleted"),className:`w-5 h-5 rounded-full border-2 ${p.newsDeleted?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.newsDeleted&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),t.role==="admin"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-warning-soft",children:a.jsx(q,{className:"text-warning",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Updated News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"News updated by reporter"})]})]}),a.jsx("button",{onClick:()=>N("newsUpdated"),className:`w-5 h-5 rounded-full border-2 ${p.newsUpdated?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.newsUpdated&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-danger-soft",children:a.jsx(q,{className:"text-danger",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Other Notifications"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"All other types of notifications"})]})]}),a.jsx("button",{onClick:()=>N("others"),className:`w-5 h-5 rounded-full border-2 ${p.others?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.others&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]})]}),n==="denied"&&a.jsx("div",{className:"p-4 bg-danger-soft rounded-lg border border-danger/30",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx(Re,{size:20,className:"text-danger mt-0.5"}),a.jsxs("div",{children:[a.jsx("h4",{className:"font-medium text-danger mb-1",children:"Notifications Blocked"}),a.jsx("p",{className:"text-sm text-danger mb-2",children:'Click "Enable Notifications" above to request permission again, or manually enable in browser settings:'}),a.jsxs("ol",{className:"text-sm text-danger list-decimal list-inside space-y-1",children:[a.jsx("li",{children:"Click the lock/info icon in your browser's address bar"}),a.jsx("li",{children:'Change notifications setting to "Allow"'}),a.jsx("li",{children:"Refresh this page"})]})]})]})}),a.jsx("div",{className:"p-4 bg-primary-soft rounded-lg border border-primary/30",children:a.jsxs("p",{className:"text-sm text-primary",children:[a.jsx("strong",{children:"About Notifications:"})," Stay updated with important news articles, account security alerts, and personalized content recommendations."]})})]})})},dt=20,ut=800,rn=[["website","Website"],["x","X (Twitter)"],["facebook","Facebook"],["instagram","Instagram"],["youtube","YouTube"],["linkedin","LinkedIn"]],za=[["light","Light",Dn],["dark","Dark",On],["system","System",yn]];function R({icon:e,label:t,value:n,children:s}){return a.jsxs("div",{className:"flex items-start gap-3 rounded-2xl bg-surface-2/70 p-3 sm:p-3.5",children:[a.jsx("span",{className:"grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-fg-muted ring-1 ring-line sm:size-10",children:a.jsx(e,{className:"size-4 sm:size-5"})}),a.jsxs("div",{className:"min-w-0 flex-1",children:[a.jsx("p",{className:"text-xs font-medium text-fg-subtle",children:t}),s||a.jsx("p",{className:"hindi-font truncate text-sm font-semibold text-fg",children:n||"—"})]})]})}function qa({profile:e,onDone:t}){const n=vn(),s=xn(),{user:r}=mt(),[o,i]=w.useState({fullName:e.fullName||"",about:e.about||"",designation:e.designation||"",location:e.location||"",phone:e.phone||"",social:{...e.social}}),[c,l]=w.useState({blob:null,url:e.profile||""}),[u,d]=w.useState(""),[p,b]=w.useState({}),[S,x]=w.useState(!1),N=w.useRef(null),j=h=>m=>{i(f=>({...f,[h]:m.target.value})),b(f=>({...f,[h]:void 0}))},k=h=>{var f;const m=(f=h.target.files)==null?void 0:f[0];if(h.target.value="",!!m){if(!/^image\/(png|jpe?g|webp)$/i.test(m.type))return E.error("Choose a JPG, PNG or WebP image");if(m.size>10*1024*1024)return E.error("Image is larger than 10 MB");d(URL.createObjectURL(m))}},y=async h=>{h.preventDefault();const m={};if(o.fullName.trim().length<2&&(m.fullName="Enter your full name"),o.about.trim().length<dt&&(m.about=`Write at least ${dt} characters about yourself`),c.url||(m.photo="A profile photo is required"),b(m),Object.keys(m).length)return E.error(Object.values(m)[0]);const f=new FormData;["fullName","about","designation","location","phone"].forEach(_=>f.append(_,o[_]??"")),f.append("social",JSON.stringify(o.social||{})),c.blob&&f.append("profile",c.blob,"profile.jpg"),x(!0);const M=E.loading("Saving…");try{const{data:_}=await K.put("/profile",f);E.success("Profile updated",{id:M}),n(In({user:{...r,fullName:_.profile.fullName,profile:_.profile.profile}})),s.invalidateQueries({queryKey:["profile"]}),s.invalidateQueries({queryKey:["user"]}),t()}catch(_){E.error(En(_,"Could not save your profile"),{id:M})}finally{x(!1)}};return a.jsxs(z,{padded:!1,children:[a.jsx(J,{icon:ve,title:"Edit profile",description:"Shown on your public author page",actions:a.jsx(D,{variant:"ghost",size:"sm",leftIcon:ht,onClick:t,children:"Cancel"})}),a.jsxs("form",{onSubmit:y,noValidate:!0,className:"space-y-5 p-3 sm:p-5",children:[a.jsxs("div",{className:"flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-left",children:[a.jsxs("button",{type:"button",onClick:()=>{var h;return(h=N.current)==null?void 0:h.click()},"aria-label":"Choose profile photo",className:gt("group relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-dashed bg-surface-2 transition-colors",p.photo?"border-danger":"border-line-strong hover:border-fg"),children:[c.url?a.jsx("img",{src:c.url,alt:"",className:"size-full object-cover"}):a.jsx("span",{className:"grid size-full place-items-center text-fg-faint",children:a.jsx(ze,{className:"size-7"})}),a.jsx("span",{className:"absolute inset-0 grid place-items-center bg-ink/55 text-xs font-medium text-paper opacity-0 transition-opacity group-hover:opacity-100",children:"Change"})]}),a.jsx("input",{ref:N,type:"file",accept:"image/png,image/jpeg,image/webp",className:"hidden",onChange:k}),a.jsxs("div",{className:"min-w-0 text-sm",children:[a.jsxs("p",{className:"font-medium text-fg",children:["Profile photo ",a.jsx("span",{className:"text-danger",children:"*"})]}),a.jsx("p",{className:"text-fg-subtle",children:"Crop and zoom after choosing."}),p.photo&&a.jsx("p",{className:"text-danger",children:p.photo}),a.jsx(D,{type:"button",size:"sm",variant:"outline",leftIcon:ze,className:"mt-2",onClick:()=>{var h;return(h=N.current)==null?void 0:h.click()},children:c.url?"Change photo":"Choose photo"})]})]}),a.jsx(U,{label:"Full name",required:!0,error:p.fullName,children:a.jsx(G,{value:o.fullName,onChange:j("fullName"),maxLength:60,className:"hindi-font"})}),a.jsx(U,{label:"About",required:!0,error:p.about,hint:`${o.about.trim().length}/${ut}`,info:"Shown on your author page and used as its search description.",children:a.jsx(Nn,{rows:5,value:o.about,maxLength:ut,onChange:j("about"),className:"hindi-font"})}),a.jsxs("div",{className:"grid gap-4 sm:grid-cols-2",children:[a.jsx(U,{label:"Designation",hint:"Optional",children:a.jsx(G,{icon:bt,value:o.designation,onChange:j("designation"),maxLength:80,className:"hindi-font"})}),a.jsx(U,{label:"Location",hint:"Optional",children:a.jsx(G,{icon:wt,value:o.location,onChange:j("location"),maxLength:80,className:"hindi-font"})}),a.jsx(U,{label:"Phone",hint:"Optional",children:a.jsx(G,{icon:yt,value:o.phone,onChange:j("phone"),inputMode:"tel"})})]}),a.jsxs("div",{children:[a.jsx("p",{className:"mb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle",children:"Links"}),a.jsx("div",{className:"grid gap-4 sm:grid-cols-2",children:rn.map(([h,m])=>{var f;return a.jsx(U,{label:m,hint:"Optional",children:a.jsx(G,{value:((f=o.social)==null?void 0:f[h])||"",onChange:M=>i(_=>({..._,social:{..._.social,[h]:M.target.value}})),placeholder:"https://",inputMode:"url"})},h)})})]}),a.jsxs("div",{className:"flex gap-2 border-t border-line pt-4 sm:justify-end",children:[a.jsx(D,{type:"button",variant:"outline",className:"flex-1 sm:flex-none",onClick:t,children:"Cancel"}),a.jsx(D,{type:"submit",loading:S,className:"flex-[2] sm:flex-none",children:"Save changes"})]})]}),a.jsx(Cn,{open:!!u,src:u,onClose:()=>d(""),onDone:(h,m)=>{l({blob:h,url:m}),b(f=>({...f,photo:void 0})),d("")}})]})}function fi(){const{t:e,i18n:t}=ln(),{theme:n,setTheme:s}=dn(),{user:r,can:o}=mt(),{data:i,isPending:c,isError:l,error:u,refetch:d}=Ln(),[p,b]=w.useState(!1),[S,x]=w.useState(!1),[N,j]=w.useState(!1),k=w.useMemo(()=>Sn(30),[]),y=(i==null?void 0:i._id)||(r==null?void 0:r.id)||(r==null?void 0:r._id),h=o("reporter.performance.own")||o("reporter.performance.all"),m=un(y,k,!!y&&h),f=m.data;if(w.useEffect(()=>{i&&!i.about&&j(!0)},[i]),l)return a.jsx(fn,{error:u,onRetry:d});const M=Object.entries((i==null?void 0:i.social)||{}).filter(([,I])=>I),_=i&&(!i.about||!i.profile||!i.fullName);return a.jsxs(a.Fragment,{children:[a.jsx(pn,{title:e("My profile"),description:"Your details, numbers and preferences"}),a.jsx(jn,{className:"mb-4 sm:mb-5",name:(i==null?void 0:i.fullName)||(i==null?void 0:i.username),src:i==null?void 0:i.profile,badges:(r==null?void 0:r.role)&&a.jsx(mn,{tone:r.role==="admin"?"accent":"primary",className:"capitalize",children:r.role}),subtitle:i!=null&&i.designation?`${i.designation}${i.location?` · ${i.location}`:""}`:i==null?void 0:i.location,about:i==null?void 0:i.about,actions:a.jsx(a.Fragment,{children:!N&&a.jsx(D,{size:"sm",variant:"outline",leftIcon:ve,onClick:()=>j(!0),children:"Edit profile"})}),meta:c?a.jsx($e,{className:"h-4 w-56"}):a.jsxs(a.Fragment,{children:[a.jsxs("span",{children:["@",i==null?void 0:i.username]}),a.jsxs("span",{className:"inline-flex min-w-0 items-center gap-1.5",children:[a.jsx(Ve,{className:"size-4 shrink-0"}),a.jsx("span",{className:"truncate",children:i==null?void 0:i.email})]}),a.jsxs("span",{className:"inline-flex items-center gap-1.5",children:[a.jsx(An,{className:"size-4 shrink-0"}),e("Joined")," ",hn(i==null?void 0:i.createdAt)]})]})}),_&&!N&&a.jsx(z,{className:"mb-4 border-warning/40 bg-warning-soft/50 sm:mb-5",children:a.jsxs("p",{className:"text-sm text-fg-muted",children:[a.jsx("b",{className:"text-fg",children:"Complete your profile."})," Add a photo, your full name and a short about text -they appear on your public author page."]})}),h&&a.jsxs("div",{className:"mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:grid-cols-3 sm:gap-4",children:[a.jsx(ce,{className:"col-span-2 sm:col-span-1",label:`${e("Stories published")} · 30d`,value:(f==null?void 0:f.summary.published)??0,icon:Le,tone:"black",loading:m.isLoading,change:f==null?void 0:f.comparison.publishedChangePercent}),a.jsx(ce,{label:e("Total reads"),value:(f==null?void 0:f.summary.totalViews)??0,icon:gn,tone:"info",loading:m.isLoading,change:f==null?void 0:f.comparison.viewsChangePercent}),a.jsx(ce,{label:"Avg reads / story",value:(f==null?void 0:f.summary.avgViewsPerArticle)??0,icon:bn,tone:"violet",loading:m.isLoading})]}),a.jsxs("div",{className:"grid gap-4 sm:gap-5 lg:grid-cols-5",children:[a.jsxs("div",{className:"min-w-0 space-y-4 sm:space-y-5 lg:col-span-3",children:[N&&i?a.jsx(qa,{profile:i,onDone:()=>j(!1)}):a.jsxs(z,{padded:!1,children:[a.jsx(J,{icon:Fe,title:"Account information",actions:a.jsx(a.Fragment,{children:!N&&a.jsx(D,{size:"sm",variant:"outline",leftIcon:ve,onClick:()=>j(!0),children:"Edit profile"})})}),a.jsxs("div",{className:"grid gap-2.5 p-3 sm:grid-cols-2 sm:gap-3 sm:p-5",children:[a.jsx(R,{icon:Fe,label:"Username",value:i==null?void 0:i.username}),a.jsx(R,{icon:Le,label:"Full name",value:i==null?void 0:i.fullName}),a.jsx(R,{icon:Ve,label:e("Email"),value:i==null?void 0:i.email}),a.jsx(R,{icon:bt,label:"Designation",value:i==null?void 0:i.designation}),a.jsx(R,{icon:wt,label:"Location",value:i==null?void 0:i.location}),a.jsx(R,{icon:yt,label:"Phone",value:i==null?void 0:i.phone}),M.length>0&&a.jsx("div",{className:"sm:col-span-2",children:a.jsx(R,{icon:Tn,label:"Links",children:a.jsx("div",{className:"mt-1 flex flex-wrap gap-1.5",children:M.map(([I,oe])=>{var ee;return a.jsx("a",{href:oe,target:"_blank",rel:"noreferrer",className:"rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-info hover:underline",children:((ee=rn.find(an=>an[0]===I))==null?void 0:ee[1])||I},I)})})})})]})]}),h&&a.jsxs(z,{padded:!1,children:[a.jsx(J,{title:"Your last 30 days",description:"Stories and reads per day"}),a.jsx("div",{className:"p-3 sm:p-4",children:m.isLoading?a.jsx($e,{className:"h-56 w-full"}):a.jsx(wn,{data:((f==null?void 0:f.trends.daily)||[]).map(I=>({bucket:I.date,published:I.published,views:I.views})),series:[{key:"published",name:"Stories"},{key:"views",name:"Reads"}],height:240})})]})]}),a.jsxs("div",{className:"min-w-0 space-y-4 sm:space-y-5 lg:col-span-2",children:[a.jsxs(z,{padded:!1,children:[a.jsx(J,{icon:kn,title:"Security & notifications"}),a.jsxs("div",{className:"space-y-2.5 p-3 sm:p-5",children:[a.jsx(D,{variant:"outline",leftIcon:Ue,className:"w-full justify-start",onClick:()=>b(!0),children:"Change password"}),a.jsx(D,{variant:"outline",leftIcon:q,className:"w-full justify-start",onClick:()=>x(!0),children:"Manage notifications"}),a.jsxs("p",{className:"inline-flex items-center gap-1.5 pt-1 text-xs text-fg-faint",children:[a.jsx(te,{className:"size-3.5"}),"Sessions are protected with signed tokens."]})]})]}),a.jsxs(z,{padded:!1,children:[a.jsx(J,{icon:Rn,title:"Appearance & language",description:"Only the panel's own text changes -what you write stays as you write it."}),a.jsx("div",{className:"space-y-4 p-3 sm:p-5",children:a.jsxs("div",{children:[a.jsx("p",{className:"mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle",children:e("Theme")}),a.jsx("div",{className:"grid grid-cols-3 gap-2",children:za.map(([I,oe,ee])=>a.jsxs("button",{type:"button","aria-pressed":n===I,onClick:()=>s(I),className:gt("flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-colors",n===I?"border-fg bg-surface-2 text-fg":"border-line text-fg-muted hover:bg-surface-2"),children:[a.jsx(ee,{className:"size-5"}),e(oe)]},I))})]})})]})]})]}),a.jsx(He,{open:p,onClose:()=>b(!1),title:"Change password",icon:Ue,size:"sm",children:a.jsx(Vn,{onclose:()=>b(!1)})}),a.jsx(He,{open:S,onClose:()=>x(!1),title:"Notification settings",icon:q,size:"lg",children:a.jsx(Ua,{onclose:()=>x(!1)})})]})}export{fi as default};
