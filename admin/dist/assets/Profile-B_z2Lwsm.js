import{c as ft,av as pt,h as K,r as y,j as a,V as I,e as cn,m as Re,X as ht,f as mt,t as ln,u as gt,aB as dn,W as un,P as fn,a1 as $e,a7 as pn,x as $,B as hn,Q as z,an as mn,aD as gn,aj as J,b as xe,q as bn,o as wn,a2 as Le,s as yn,J as xn,F as U,w as G,a8 as vn,z as Nn,D as In}from"./index-XZxuA9n1.js";import{r as Sn}from"./RangePicker-DvDxmrb6.js";import{S as ce,T as En}from"./Charts-_bNuyJLV.js";import{P as jn}from"./ProfileHeader-Drm1D7eO.js";import{I as le}from"./InputFields-BwfNqL8K.js";import{L as te}from"./lock-DJQeLyLx.js";import{A as _n}from"./AsyncWrapper-C4qX9Snb.js";import{B as q}from"./bell-DOW3O9bN.js";import{B as bt,I as Cn}from"./ImageCropper-8qj5M7tB.js";import{u as An}from"./useTranslation-oURm5aIj.js";import{M as Fe}from"./mail-C51TFGYN.js";import{C as Tn}from"./calendar-days-BPwMs9Pu.js";import{P as wt}from"./pencil-Dn9qZ6PK.js";import{F as He}from"./file-text-Cd7qobZC.js";import{U as Ve}from"./user-Dn-yqB51.js";import{M as yt}from"./map-pin-DqOoVuWF.js";import{P as xt}from"./phone-DmZ3DykS.js";import{G as kn}from"./globe-CBXhDEKa.js";import{S as Dn,K as Ue}from"./shield-check-FSmqhNrm.js";import{S as On,M as Pn}from"./sun-Dmd6rjhf.js";import{M as Bn}from"./monitor-B5MCJp_C.js";import{C as ze}from"./camera-hciVk3oR.js";import"./DateRangeFilter-D6sWLcCe.js";import"./RowMenu-CvULjR0q.js";import"./ellipsis-vertical-KnZe2sfh.js";import"./Avatar-CzYG7zic.js";import"./minus-lV4_XlpN.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mn=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742",key:"178tsu"}],["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05",key:"1hqiys"}]],Rn=ft("bell-off",Mn);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $n=[["path",{d:"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",key:"e79jfc"}],["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}]],Ln=ft("palette",$n),Fn=async()=>{const{data:e}=await K.get("/profile");return e},Hn=()=>pt({queryKey:["profile"],queryFn:Fn,keepPreviousData:!0,staleTime:1e3*60*2}),Vn=async()=>{const{data:e}=await K.get("/notification-preferences");return e},Un=()=>pt({queryKey:["notification-preference"],queryFn:Vn,keepPreviousData:!0,staleTime:1e3*60*2}),zn=({onclose:e})=>{const[t,n]=y.useState({currentPassword:"",newPassword:"",confirmPassword:""}),[s,r]=y.useState(!1),o=l=>{const{name:u,value:d}=l.target;n(p=>({...p,[u]:d}))},i=l=>{const u=/[A-Z]/.test(l),d=/[0-9]/.test(l);return u&&d},c=async l=>{var w,S;l.preventDefault();const{currentPassword:u,newPassword:d,confirmPassword:p}=t;if(!u)return I.error("Current password is required");if(!d)return I.error("New password is required");if(d.length<8)return I.error("New password must be at least 8 characters long");if(!i(d))return I.error("New password must include at least 1 capital letter and 1 number");if(!p)return I.error("Please confirm your new password");if(d!==p)return I.error("New Password and confirm password do not match");r(!0);try{const{data:N}=await K.put("update-password",t);I.success("Password updated successfully"),e(),r(!1)}catch(N){I.error(((S=(w=N.response)==null?void 0:w.data)==null?void 0:S.message)||N.message||"Something went wrong")}finally{r(!1)}};return a.jsxs("form",{className:"space-y-4",onSubmit:c,children:[a.jsx(le,{LabelTitle:" Current Password",placeholder:"Enter your current password",required:!0,inputVal:t.currentPassword,type:"password",icon:te,handleInputValue:o,name:"currentPassword"}),a.jsx(le,{LabelTitle:"New Password",placeholder:"Enter your new password",required:!0,inputVal:t.newPassword,type:"password",icon:te,handleInputValue:o,name:"newPassword"}),a.jsx(le,{LabelTitle:"Confirm New Password",placeholder:"Enter your confirm new password",required:!0,inputVal:t.confirmPassword,type:"password",icon:te,handleInputValue:o,name:"confirmPassword"}),a.jsxs("div",{className:"flex justify-between mt-2",children:[a.jsx("button",{className:"btn-red-outline bg-transparent",onClick:e,children:"Cancel"}),a.jsx("button",{className:"btn-red",type:"submit",disabled:s,children:s?"Updating...":"Update"})]})]})};/**
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
 */const qn=()=>{};var qe={};/**
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
 */const vt=function(e){const t=[];let n=0;for(let s=0;s<e.length;s++){let r=e.charCodeAt(s);r<128?t[n++]=r:r<2048?(t[n++]=r>>6|192,t[n++]=r&63|128):(r&64512)===55296&&s+1<e.length&&(e.charCodeAt(s+1)&64512)===56320?(r=65536+((r&1023)<<10)+(e.charCodeAt(++s)&1023),t[n++]=r>>18|240,t[n++]=r>>12&63|128,t[n++]=r>>6&63|128,t[n++]=r&63|128):(t[n++]=r>>12|224,t[n++]=r>>6&63|128,t[n++]=r&63|128)}return t},Kn=function(e){const t=[];let n=0,s=0;for(;n<e.length;){const r=e[n++];if(r<128)t[s++]=String.fromCharCode(r);else if(r>191&&r<224){const o=e[n++];t[s++]=String.fromCharCode((r&31)<<6|o&63)}else if(r>239&&r<365){const o=e[n++],i=e[n++],c=e[n++],l=((r&7)<<18|(o&63)<<12|(i&63)<<6|c&63)-65536;t[s++]=String.fromCharCode(55296+(l>>10)),t[s++]=String.fromCharCode(56320+(l&1023))}else{const o=e[n++],i=e[n++];t[s++]=String.fromCharCode((r&15)<<12|(o&63)<<6|i&63)}}return t.join("")},Nt={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let r=0;r<e.length;r+=3){const o=e[r],i=r+1<e.length,c=i?e[r+1]:0,l=r+2<e.length,u=l?e[r+2]:0,d=o>>2,p=(o&3)<<4|c>>4;let w=(c&15)<<2|u>>6,S=u&63;l||(S=64,i||(w=64)),s.push(n[d],n[p],n[w],n[S])}return s.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(vt(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):Kn(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const n=t?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let r=0;r<e.length;){const o=n[e.charAt(r++)],c=r<e.length?n[e.charAt(r)]:0;++r;const u=r<e.length?n[e.charAt(r)]:64;++r;const p=r<e.length?n[e.charAt(r)]:64;if(++r,o==null||c==null||u==null||p==null)throw new Wn;const w=o<<2|c>>4;if(s.push(w),u!==64){const S=c<<4&240|u>>2;if(s.push(S),p!==64){const N=u<<6&192|p;s.push(N)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class Wn extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Gn=function(e){const t=vt(e);return Nt.encodeByteArray(t,!0)},It=function(e){return Gn(e).replace(/\./g,"")},Jn=function(e){try{return Nt.decodeString(e,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
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
 */function Yn(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const Qn=()=>Yn().__FIREBASE_DEFAULTS__,Xn=()=>{if(typeof process>"u"||typeof qe>"u")return;const e=qe.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},Zn=()=>{if(typeof document>"u")return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=e&&Jn(e[1]);return t&&JSON.parse(t)},es=()=>{try{return qn()||Qn()||Xn()||Zn()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}},St=()=>{var e;return(e=es())===null||e===void 0?void 0:e.config};/**
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
 */class ts{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,n)=>{this.resolve=t,this.reject=n})}wrapCallback(t){return(n,s)=>{n?this.reject(n):this.resolve(s),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(n):t(n,s))}}}function Et(){try{return typeof indexedDB=="object"}catch{return!1}}function jt(){return new Promise((e,t)=>{try{let n=!0;const s="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(s);r.onsuccess=()=>{r.result.close(),n||self.indexedDB.deleteDatabase(s),e(!0)},r.onupgradeneeded=()=>{n=!1},r.onerror=()=>{var o;t(((o=r.error)===null||o===void 0?void 0:o.message)||"")}}catch(n){t(n)}})}function ns(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
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
 */const ss="FirebaseError";class W extends Error{constructor(t,n,s){super(n),this.code=t,this.customData=s,this.name=ss,Object.setPrototypeOf(this,W.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,se.prototype.create)}}class se{constructor(t,n,s){this.service=t,this.serviceName=n,this.errors=s}create(t,...n){const s=n[0]||{},r=`${this.service}/${t}`,o=this.errors[t],i=o?rs(o,s):"Error",c=`${this.serviceName}: ${i} (${r}).`;return new W(r,c,s)}}function rs(e,t){return e.replace(as,(n,s)=>{const r=t[s];return r!=null?String(r):`<${s}?>`})}const as=/\{\$([^}]+)}/g;function ve(e,t){if(e===t)return!0;const n=Object.keys(e),s=Object.keys(t);for(const r of n){if(!s.includes(r))return!1;const o=e[r],i=t[r];if(Ke(o)&&Ke(i)){if(!ve(o,i))return!1}else if(o!==i)return!1}for(const r of s)if(!n.includes(r))return!1;return!0}function Ke(e){return e!==null&&typeof e=="object"}/**
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
 */function _t(e){return e&&e._delegate?e._delegate:e}class P{constructor(t,n,s){this.name=t,this.instanceFactory=n,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
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
 */class is{constructor(t,n){this.name=t,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const n=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(n)){const s=new ts;if(this.instancesDeferred.set(n,s),this.isInitialized(n)||this.shouldAutoInitialize())try{const r=this.getOrInitializeService({instanceIdentifier:n});r&&s.resolve(r)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(t){var n;const s=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),r=(n=t==null?void 0:t.optional)!==null&&n!==void 0?n:!1;if(this.isInitialized(s)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:s})}catch(o){if(r)return null;throw o}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(cs(t))try{this.getOrInitializeService({instanceIdentifier:R})}catch{}for(const[n,s]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(n);try{const o=this.getOrInitializeService({instanceIdentifier:r});s.resolve(o)}catch{}}}}clearInstance(t=R){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...t.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=R){return this.instances.has(t)}getOptions(t=R){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:n={}}=t,s=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:s,options:n});for(const[o,i]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(o);s===c&&i.resolve(r)}return r}onInit(t,n){var s;const r=this.normalizeInstanceIdentifier(n),o=(s=this.onInitCallbacks.get(r))!==null&&s!==void 0?s:new Set;o.add(t),this.onInitCallbacks.set(r,o);const i=this.instances.get(r);return i&&t(i,r),()=>{o.delete(t)}}invokeOnInitCallbacks(t,n){const s=this.onInitCallbacks.get(n);if(s)for(const r of s)try{r(t,n)}catch{}}getOrInitializeService({instanceIdentifier:t,options:n={}}){let s=this.instances.get(t);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:os(t),options:n}),this.instances.set(t,s),this.instancesOptions.set(t,n),this.invokeOnInitCallbacks(s,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,s)}catch{}return s||null}normalizeInstanceIdentifier(t=R){return this.component?this.component.multipleInstances?t:R:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function os(e){return e===R?void 0:e}function cs(e){return e.instantiationMode==="EAGER"}/**
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
 */class ls{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const n=this.getProvider(t.name);if(n.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);n.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const n=new is(t,this);return this.providers.set(t,n),n}getProviders(){return Array.from(this.providers.values())}}/**
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
 */var g;(function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"})(g||(g={}));const ds={debug:g.DEBUG,verbose:g.VERBOSE,info:g.INFO,warn:g.WARN,error:g.ERROR,silent:g.SILENT},us=g.INFO,fs={[g.DEBUG]:"log",[g.VERBOSE]:"log",[g.INFO]:"info",[g.WARN]:"warn",[g.ERROR]:"error"},ps=(e,t,...n)=>{if(t<e.logLevel)return;const s=new Date().toISOString(),r=fs[t];if(r)console[r](`[${s}]  ${e.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class hs{constructor(t){this.name=t,this._logLevel=us,this._logHandler=ps,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in g))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?ds[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,g.DEBUG,...t),this._logHandler(this,g.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,g.VERBOSE,...t),this._logHandler(this,g.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,g.INFO,...t),this._logHandler(this,g.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,g.WARN,...t),this._logHandler(this,g.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,g.ERROR,...t),this._logHandler(this,g.ERROR,...t)}}const ms=(e,t)=>t.some(n=>e instanceof n);let We,Ge;function gs(){return We||(We=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function bs(){return Ge||(Ge=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Ct=new WeakMap,Ne=new WeakMap,At=new WeakMap,de=new WeakMap,Ce=new WeakMap;function ws(e){const t=new Promise((n,s)=>{const r=()=>{e.removeEventListener("success",o),e.removeEventListener("error",i)},o=()=>{n(A(e.result)),r()},i=()=>{s(e.error),r()};e.addEventListener("success",o),e.addEventListener("error",i)});return t.then(n=>{n instanceof IDBCursor&&Ct.set(n,e)}).catch(()=>{}),Ce.set(t,e),t}function ys(e){if(Ne.has(e))return;const t=new Promise((n,s)=>{const r=()=>{e.removeEventListener("complete",o),e.removeEventListener("error",i),e.removeEventListener("abort",i)},o=()=>{n(),r()},i=()=>{s(e.error||new DOMException("AbortError","AbortError")),r()};e.addEventListener("complete",o),e.addEventListener("error",i),e.addEventListener("abort",i)});Ne.set(e,t)}let Ie={get(e,t,n){if(e instanceof IDBTransaction){if(t==="done")return Ne.get(e);if(t==="objectStoreNames")return e.objectStoreNames||At.get(e);if(t==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return A(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function xs(e){Ie=e(Ie)}function vs(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...n){const s=e.call(ue(this),t,...n);return At.set(s,t.sort?t.sort():[t]),A(s)}:bs().includes(e)?function(...t){return e.apply(ue(this),t),A(Ct.get(this))}:function(...t){return A(e.apply(ue(this),t))}}function Ns(e){return typeof e=="function"?vs(e):(e instanceof IDBTransaction&&ys(e),ms(e,gs())?new Proxy(e,Ie):e)}function A(e){if(e instanceof IDBRequest)return ws(e);if(de.has(e))return de.get(e);const t=Ns(e);return t!==e&&(de.set(e,t),Ce.set(t,e)),t}const ue=e=>Ce.get(e);function re(e,t,{blocked:n,upgrade:s,blocking:r,terminated:o}={}){const i=indexedDB.open(e,t),c=A(i);return s&&i.addEventListener("upgradeneeded",l=>{s(A(i.result),l.oldVersion,l.newVersion,A(i.transaction),l)}),n&&i.addEventListener("blocked",l=>n(l.oldVersion,l.newVersion,l)),c.then(l=>{o&&l.addEventListener("close",()=>o()),r&&l.addEventListener("versionchange",u=>r(u.oldVersion,u.newVersion,u))}).catch(()=>{}),c}function fe(e,{blocked:t}={}){const n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",s=>t(s.oldVersion,s)),A(n).then(()=>{})}const Is=["get","getKey","getAll","getAllKeys","count"],Ss=["put","add","delete","clear"],pe=new Map;function Je(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(pe.get(t))return pe.get(t);const n=t.replace(/FromIndex$/,""),s=t!==n,r=Ss.includes(n);if(!(n in(s?IDBIndex:IDBObjectStore).prototype)||!(r||Is.includes(n)))return;const o=async function(i,...c){const l=this.transaction(i,r?"readwrite":"readonly");let u=l.store;return s&&(u=u.index(c.shift())),(await Promise.all([u[n](...c),r&&l.done]))[0]};return pe.set(t,o),o}xs(e=>({...e,get:(t,n,s)=>Je(t,n)||e.get(t,n,s),has:(t,n)=>!!Je(t,n)||e.has(t,n)}));/**
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
 */class Es{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(js(n)){const s=n.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(n=>n).join(" ")}}function js(e){const t=e.getComponent();return(t==null?void 0:t.type)==="VERSION"}const Se="@firebase/app",Ye="0.13.1";/**
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
 */const T=new hs("@firebase/app"),_s="@firebase/app-compat",Cs="@firebase/analytics-compat",As="@firebase/analytics",Ts="@firebase/app-check-compat",ks="@firebase/app-check",Ds="@firebase/auth",Os="@firebase/auth-compat",Ps="@firebase/database",Bs="@firebase/data-connect",Ms="@firebase/database-compat",Rs="@firebase/functions",$s="@firebase/functions-compat",Ls="@firebase/installations",Fs="@firebase/installations-compat",Hs="@firebase/messaging",Vs="@firebase/messaging-compat",Us="@firebase/performance",zs="@firebase/performance-compat",qs="@firebase/remote-config",Ks="@firebase/remote-config-compat",Ws="@firebase/storage",Gs="@firebase/storage-compat",Js="@firebase/firestore",Ys="@firebase/ai",Qs="@firebase/firestore-compat",Xs="firebase";/**
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
 */const Ee="[DEFAULT]",Zs={[Se]:"fire-core",[_s]:"fire-core-compat",[As]:"fire-analytics",[Cs]:"fire-analytics-compat",[ks]:"fire-app-check",[Ts]:"fire-app-check-compat",[Ds]:"fire-auth",[Os]:"fire-auth-compat",[Ps]:"fire-rtdb",[Bs]:"fire-data-connect",[Ms]:"fire-rtdb-compat",[Rs]:"fire-fn",[$s]:"fire-fn-compat",[Ls]:"fire-iid",[Fs]:"fire-iid-compat",[Hs]:"fire-fcm",[Vs]:"fire-fcm-compat",[Us]:"fire-perf",[zs]:"fire-perf-compat",[qs]:"fire-rc",[Ks]:"fire-rc-compat",[Ws]:"fire-gcs",[Gs]:"fire-gcs-compat",[Js]:"fire-fst",[Qs]:"fire-fst-compat",[Ys]:"fire-vertex","fire-js":"fire-js",[Xs]:"fire-js-all"};/**
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
 */const Y=new Map,er=new Map,je=new Map;function Qe(e,t){try{e.container.addComponent(t)}catch(n){T.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function F(e){const t=e.name;if(je.has(t))return T.debug(`There were multiple attempts to register component ${t}.`),!1;je.set(t,e);for(const n of Y.values())Qe(n,e);for(const n of er.values())Qe(n,e);return!0}function Ae(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}/**
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
 */const tr={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},D=new se("app","Firebase",tr);/**
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
 */class nr{constructor(t,n,s){this._isDeleted=!1,this._options=Object.assign({},t),this._config=Object.assign({},n),this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new P("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw D.create("app-deleted",{appName:this._name})}}function Tt(e,t={}){let n=e;typeof t!="object"&&(t={name:t});const s=Object.assign({name:Ee,automaticDataCollectionEnabled:!0},t),r=s.name;if(typeof r!="string"||!r)throw D.create("bad-app-name",{appName:String(r)});if(n||(n=St()),!n)throw D.create("no-options");const o=Y.get(r);if(o){if(ve(n,o.options)&&ve(s,o.config))return o;throw D.create("duplicate-app",{appName:r})}const i=new ls(r);for(const l of je.values())i.addComponent(l);const c=new nr(n,s,i);return Y.set(r,c),c}function kt(e=Ee){const t=Y.get(e);if(!t&&e===Ee&&St())return Tt();if(!t)throw D.create("no-app",{appName:e});return t}function sr(){return Array.from(Y.values())}function O(e,t,n){var s;let r=(s=Zs[e])!==null&&s!==void 0?s:e;n&&(r+=`-${n}`);const o=r.match(/\s|\//),i=t.match(/\s|\//);if(o||i){const c=[`Unable to register library "${r}" with version "${t}":`];o&&c.push(`library name "${r}" contains illegal characters (whitespace or "/")`),o&&i&&c.push("and"),i&&c.push(`version name "${t}" contains illegal characters (whitespace or "/")`),T.warn(c.join(" "));return}F(new P(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
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
 */const rr="firebase-heartbeat-database",ar=1,Q="firebase-heartbeat-store";let he=null;function Dt(){return he||(he=re(rr,ar,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(Q)}catch(n){console.warn(n)}}}}).catch(e=>{throw D.create("idb-open",{originalErrorMessage:e.message})})),he}async function ir(e){try{const n=(await Dt()).transaction(Q),s=await n.objectStore(Q).get(Ot(e));return await n.done,s}catch(t){if(t instanceof W)T.warn(t.message);else{const n=D.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});T.warn(n.message)}}}async function Xe(e,t){try{const s=(await Dt()).transaction(Q,"readwrite");await s.objectStore(Q).put(t,Ot(e)),await s.done}catch(n){if(n instanceof W)T.warn(n.message);else{const s=D.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});T.warn(s.message)}}}function Ot(e){return`${e.name}!${e.options.appId}`}/**
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
 */const or=1024,cr=30;class lr{constructor(t){this.container=t,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new ur(n),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){var t,n;try{const r=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=Ze();if(((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)===null||n===void 0?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(i=>i.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:r}),this._heartbeatsCache.heartbeats.length>cr){const i=fr(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(i,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(s){T.warn(s)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=Ze(),{heartbeatsToSend:s,unsentEntries:r}=dr(this._heartbeatsCache.heartbeats),o=It(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=n,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(n){return T.warn(n),""}}}function Ze(){return new Date().toISOString().substring(0,10)}function dr(e,t=or){const n=[];let s=e.slice();for(const r of e){const o=n.find(i=>i.agent===r.agent);if(o){if(o.dates.push(r.date),et(n)>t){o.dates.pop();break}}else if(n.push({agent:r.agent,dates:[r.date]}),et(n)>t){n.pop();break}s=s.slice(1)}return{heartbeatsToSend:n,unsentEntries:s}}class ur{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Et()?jt().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await ir(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){var n;if(await this._canUseIndexedDBPromise){const r=await this.read();return Xe(this.app,{lastSentHeartbeatDate:(n=t.lastSentHeartbeatDate)!==null&&n!==void 0?n:r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){var n;if(await this._canUseIndexedDBPromise){const r=await this.read();return Xe(this.app,{lastSentHeartbeatDate:(n=t.lastSentHeartbeatDate)!==null&&n!==void 0?n:r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function et(e){return It(JSON.stringify({version:2,heartbeats:e})).length}function fr(e){if(e.length===0)return-1;let t=0,n=e[0].date;for(let s=1;s<e.length;s++)e[s].date<n&&(n=e[s].date,t=s);return t}/**
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
 */function pr(e){F(new P("platform-logger",t=>new Es(t),"PRIVATE")),F(new P("heartbeat",t=>new lr(t),"PRIVATE")),O(Se,Ye,e),O(Se,Ye,"esm2017"),O("fire-js","")}pr("");var hr="firebase",mr="11.9.0";/**
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
 */O(hr,mr,"app");const Pt="@firebase/installations",Te="0.6.17";/**
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
 */const Bt=1e4,Mt=`w:${Te}`,Rt="FIS_v2",gr="https://firebaseinstallations.googleapis.com/v1",br=60*60*1e3,wr="installations",yr="Installations";/**
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
 */const xr={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},H=new se(wr,yr,xr);function $t(e){return e instanceof W&&e.code.includes("request-failed")}/**
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
 */function Lt({projectId:e}){return`${gr}/projects/${e}/installations`}function Ft(e){return{token:e.token,requestStatus:2,expiresIn:Nr(e.expiresIn),creationTime:Date.now()}}async function Ht(e,t){const s=(await t.json()).error;return H.create("request-failed",{requestName:e,serverCode:s.code,serverMessage:s.message,serverStatus:s.status})}function Vt({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function vr(e,{refreshToken:t}){const n=Vt(e);return n.append("Authorization",Ir(t)),n}async function Ut(e){const t=await e();return t.status>=500&&t.status<600?e():t}function Nr(e){return Number(e.replace("s","000"))}function Ir(e){return`${Rt} ${e}`}/**
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
 */async function Sr({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const s=Lt(e),r=Vt(e),o=t.getImmediate({optional:!0});if(o){const u=await o.getHeartbeatsHeader();u&&r.append("x-firebase-client",u)}const i={fid:n,authVersion:Rt,appId:e.appId,sdkVersion:Mt},c={method:"POST",headers:r,body:JSON.stringify(i)},l=await Ut(()=>fetch(s,c));if(l.ok){const u=await l.json();return{fid:u.fid||n,registrationStatus:2,refreshToken:u.refreshToken,authToken:Ft(u.authToken)}}else throw await Ht("Create Installation",l)}/**
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
 */function zt(e){return new Promise(t=>{setTimeout(t,e)})}/**
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
 */function Er(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
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
 */const jr=/^[cdef][\w-]{21}$/,_e="";function _r(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=Cr(e);return jr.test(n)?n:_e}catch{return _e}}function Cr(e){return Er(e).substr(0,22)}/**
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
 */const qt=new Map;function Kt(e,t){const n=ae(e);Wt(n,t),Ar(n,t)}function Wt(e,t){const n=qt.get(e);if(n)for(const s of n)s(t)}function Ar(e,t){const n=Tr();n&&n.postMessage({key:e,fid:t}),kr()}let L=null;function Tr(){return!L&&"BroadcastChannel"in self&&(L=new BroadcastChannel("[Firebase] FID Change"),L.onmessage=e=>{Wt(e.data.key,e.data.fid)}),L}function kr(){qt.size===0&&L&&(L.close(),L=null)}/**
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
 */const Dr="firebase-installations-database",Or=1,V="firebase-installations-store";let me=null;function ke(){return me||(me=re(Dr,Or,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(V)}}})),me}async function ne(e,t){const n=ae(e),r=(await ke()).transaction(V,"readwrite"),o=r.objectStore(V),i=await o.get(n);return await o.put(t,n),await r.done,(!i||i.fid!==t.fid)&&Kt(e,t.fid),t}async function Gt(e){const t=ae(e),s=(await ke()).transaction(V,"readwrite");await s.objectStore(V).delete(t),await s.done}async function ie(e,t){const n=ae(e),r=(await ke()).transaction(V,"readwrite"),o=r.objectStore(V),i=await o.get(n),c=t(i);return c===void 0?await o.delete(n):await o.put(c,n),await r.done,c&&(!i||i.fid!==c.fid)&&Kt(e,c.fid),c}/**
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
 */async function De(e){let t;const n=await ie(e.appConfig,s=>{const r=Pr(s),o=Br(e,r);return t=o.registrationPromise,o.installationEntry});return n.fid===_e?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function Pr(e){const t=e||{fid:_r(),registrationStatus:0};return Jt(t)}function Br(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const r=Promise.reject(H.create("app-offline"));return{installationEntry:t,registrationPromise:r}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},s=Mr(e,n);return{installationEntry:n,registrationPromise:s}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:Rr(e)}:{installationEntry:t}}async function Mr(e,t){try{const n=await Sr(e,t);return ne(e.appConfig,n)}catch(n){throw $t(n)&&n.customData.serverCode===409?await Gt(e.appConfig):await ne(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function Rr(e){let t=await tt(e.appConfig);for(;t.registrationStatus===1;)await zt(100),t=await tt(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:s}=await De(e);return s||n}return t}function tt(e){return ie(e,t=>{if(!t)throw H.create("installation-not-found");return Jt(t)})}function Jt(e){return $r(e)?{fid:e.fid,registrationStatus:0}:e}function $r(e){return e.registrationStatus===1&&e.registrationTime+Bt<Date.now()}/**
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
 */async function Lr({appConfig:e,heartbeatServiceProvider:t},n){const s=Fr(e,n),r=vr(e,n),o=t.getImmediate({optional:!0});if(o){const u=await o.getHeartbeatsHeader();u&&r.append("x-firebase-client",u)}const i={installation:{sdkVersion:Mt,appId:e.appId}},c={method:"POST",headers:r,body:JSON.stringify(i)},l=await Ut(()=>fetch(s,c));if(l.ok){const u=await l.json();return Ft(u)}else throw await Ht("Generate Auth Token",l)}function Fr(e,{fid:t}){return`${Lt(e)}/${t}/authTokens:generate`}/**
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
 */async function Oe(e,t=!1){let n;const s=await ie(e.appConfig,o=>{if(!Yt(o))throw H.create("not-registered");const i=o.authToken;if(!t&&Ur(i))return o;if(i.requestStatus===1)return n=Hr(e,t),o;{if(!navigator.onLine)throw H.create("app-offline");const c=qr(o);return n=Vr(e,c),c}});return n?await n:s.authToken}async function Hr(e,t){let n=await nt(e.appConfig);for(;n.authToken.requestStatus===1;)await zt(100),n=await nt(e.appConfig);const s=n.authToken;return s.requestStatus===0?Oe(e,t):s}function nt(e){return ie(e,t=>{if(!Yt(t))throw H.create("not-registered");const n=t.authToken;return Kr(n)?Object.assign(Object.assign({},t),{authToken:{requestStatus:0}}):t})}async function Vr(e,t){try{const n=await Lr(e,t),s=Object.assign(Object.assign({},t),{authToken:n});return await ne(e.appConfig,s),n}catch(n){if($t(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await Gt(e.appConfig);else{const s=Object.assign(Object.assign({},t),{authToken:{requestStatus:0}});await ne(e.appConfig,s)}throw n}}function Yt(e){return e!==void 0&&e.registrationStatus===2}function Ur(e){return e.requestStatus===2&&!zr(e)}function zr(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+br}function qr(e){const t={requestStatus:1,requestTime:Date.now()};return Object.assign(Object.assign({},e),{authToken:t})}function Kr(e){return e.requestStatus===1&&e.requestTime+Bt<Date.now()}/**
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
 */async function Wr(e){const t=e,{installationEntry:n,registrationPromise:s}=await De(t);return s?s.catch(console.error):Oe(t).catch(console.error),n.fid}/**
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
 */async function Gr(e,t=!1){const n=e;return await Jr(n),(await Oe(n,t)).token}async function Jr(e){const{registrationPromise:t}=await De(e);t&&await t}/**
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
 */function Yr(e){if(!e||!e.options)throw ge("App Configuration");if(!e.name)throw ge("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw ge(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function ge(e){return H.create("missing-app-config-values",{valueName:e})}/**
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
 */const Qt="installations",Qr="installations-internal",Xr=e=>{const t=e.getProvider("app").getImmediate(),n=Yr(t),s=Ae(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:s,_delete:()=>Promise.resolve()}},Zr=e=>{const t=e.getProvider("app").getImmediate(),n=Ae(t,Qt).getImmediate();return{getId:()=>Wr(n),getToken:r=>Gr(n,r)}};function ea(){F(new P(Qt,Xr,"PUBLIC")),F(new P(Qr,Zr,"PRIVATE"))}ea();O(Pt,Te);O(Pt,Te,"esm2017");/**
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
 */const ta="/firebase-messaging-sw.js",na="/firebase-cloud-messaging-push-scope",Xt="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",sa="https://fcmregistrations.googleapis.com/v1",Zt="google.c.a.c_id",ra="google.c.a.c_l",aa="google.c.a.ts",ia="google.c.a.e",st=1e4;var rt;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(rt||(rt={}));/**
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
 */function C(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function oa(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),s=atob(n),r=new Uint8Array(s.length);for(let o=0;o<s.length;++o)r[o]=s.charCodeAt(o);return r}/**
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
 */const be="fcm_token_details_db",ca=5,at="fcm_token_object_Store";async function la(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(o=>o.name).includes(be))return null;let t=null;return(await re(be,ca,{upgrade:async(s,r,o,i)=>{var c;if(r<2||!s.objectStoreNames.contains(at))return;const l=i.objectStore(at),u=await l.index("fcmSenderId").get(e);if(await l.clear(),!!u){if(r===2){const d=u;if(!d.auth||!d.p256dh||!d.endpoint)return;t={token:d.fcmToken,createTime:(c=d.createTime)!==null&&c!==void 0?c:Date.now(),subscriptionOptions:{auth:d.auth,p256dh:d.p256dh,endpoint:d.endpoint,swScope:d.swScope,vapidKey:typeof d.vapidKey=="string"?d.vapidKey:C(d.vapidKey)}}}else if(r===3){const d=u;t={token:d.fcmToken,createTime:d.createTime,subscriptionOptions:{auth:C(d.auth),p256dh:C(d.p256dh),endpoint:d.endpoint,swScope:d.swScope,vapidKey:C(d.vapidKey)}}}else if(r===4){const d=u;t={token:d.fcmToken,createTime:d.createTime,subscriptionOptions:{auth:C(d.auth),p256dh:C(d.p256dh),endpoint:d.endpoint,swScope:d.swScope,vapidKey:C(d.vapidKey)}}}}}})).close(),await fe(be),await fe("fcm_vapid_details_db"),await fe("undefined"),da(t)?t:null}function da(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
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
 */const ua="firebase-messaging-database",fa=1,Z="firebase-messaging-store";let we=null;function en(){return we||(we=re(ua,fa,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(Z)}}})),we}async function pa(e){const t=tn(e),s=await(await en()).transaction(Z).objectStore(Z).get(t);if(s)return s;{const r=await la(e.appConfig.senderId);if(r)return await Pe(e,r),r}}async function Pe(e,t){const n=tn(e),r=(await en()).transaction(Z,"readwrite");return await r.objectStore(Z).put(t,n),await r.done,t}function tn({appConfig:e}){return e.appId}/**
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
 */const ha={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},v=new se("messaging","Messaging",ha);/**
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
 */async function ma(e,t){const n=await Me(e),s=nn(t),r={method:"POST",headers:n,body:JSON.stringify(s)};let o;try{o=await(await fetch(Be(e.appConfig),r)).json()}catch(i){throw v.create("token-subscribe-failed",{errorInfo:i==null?void 0:i.toString()})}if(o.error){const i=o.error.message;throw v.create("token-subscribe-failed",{errorInfo:i})}if(!o.token)throw v.create("token-subscribe-no-token");return o.token}async function ga(e,t){const n=await Me(e),s=nn(t.subscriptionOptions),r={method:"PATCH",headers:n,body:JSON.stringify(s)};let o;try{o=await(await fetch(`${Be(e.appConfig)}/${t.token}`,r)).json()}catch(i){throw v.create("token-update-failed",{errorInfo:i==null?void 0:i.toString()})}if(o.error){const i=o.error.message;throw v.create("token-update-failed",{errorInfo:i})}if(!o.token)throw v.create("token-update-no-token");return o.token}async function ba(e,t){const s={method:"DELETE",headers:await Me(e)};try{const o=await(await fetch(`${Be(e.appConfig)}/${t}`,s)).json();if(o.error){const i=o.error.message;throw v.create("token-unsubscribe-failed",{errorInfo:i})}}catch(r){throw v.create("token-unsubscribe-failed",{errorInfo:r==null?void 0:r.toString()})}}function Be({projectId:e}){return`${sa}/projects/${e}/registrations`}async function Me({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function nn({p256dh:e,auth:t,endpoint:n,vapidKey:s}){const r={web:{endpoint:n,auth:t,p256dh:e}};return s!==Xt&&(r.web.applicationPubKey=s),r}/**
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
 */const wa=7*24*60*60*1e3;async function ya(e){const t=await va(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:C(t.getKey("auth")),p256dh:C(t.getKey("p256dh"))},s=await pa(e.firebaseDependencies);if(s){if(Na(s.subscriptionOptions,n))return Date.now()>=s.createTime+wa?xa(e,{token:s.token,createTime:Date.now(),subscriptionOptions:n}):s.token;try{await ba(e.firebaseDependencies,s.token)}catch(r){console.warn(r)}return it(e.firebaseDependencies,n)}else return it(e.firebaseDependencies,n)}async function xa(e,t){try{const n=await ga(e.firebaseDependencies,t),s=Object.assign(Object.assign({},t),{token:n,createTime:Date.now()});return await Pe(e.firebaseDependencies,s),n}catch(n){throw n}}async function it(e,t){const s={token:await ma(e,t),createTime:Date.now(),subscriptionOptions:t};return await Pe(e,s),s.token}async function va(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:oa(t)})}function Na(e,t){const n=t.vapidKey===e.vapidKey,s=t.endpoint===e.endpoint,r=t.auth===e.auth,o=t.p256dh===e.p256dh;return n&&s&&r&&o}/**
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
 */function ot(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Ia(t,e),Sa(t,e),Ea(t,e),t}function Ia(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const s=t.notification.body;s&&(e.notification.body=s);const r=t.notification.image;r&&(e.notification.image=r);const o=t.notification.icon;o&&(e.notification.icon=o)}function Sa(e,t){t.data&&(e.data=t.data)}function Ea(e,t){var n,s,r,o,i;if(!t.fcmOptions&&!(!((n=t.notification)===null||n===void 0)&&n.click_action))return;e.fcmOptions={};const c=(r=(s=t.fcmOptions)===null||s===void 0?void 0:s.link)!==null&&r!==void 0?r:(o=t.notification)===null||o===void 0?void 0:o.click_action;c&&(e.fcmOptions.link=c);const l=(i=t.fcmOptions)===null||i===void 0?void 0:i.analytics_label;l&&(e.fcmOptions.analyticsLabel=l)}/**
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
 */function ja(e){return typeof e=="object"&&!!e&&Zt in e}/**
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
 */function _a(e){if(!e||!e.options)throw ye("App Configuration Object");if(!e.name)throw ye("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const s of t)if(!n[s])throw ye(s);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function ye(e){return v.create("missing-app-config-values",{valueName:e})}/**
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
 */class Ca{constructor(t,n,s){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const r=_a(t);this.firebaseDependencies={app:t,appConfig:r,installations:n,analyticsProvider:s}}_delete(){return Promise.resolve()}}/**
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
 */async function Aa(e){try{e.swRegistration=await navigator.serviceWorker.register(ta,{scope:na}),e.swRegistration.update().catch(()=>{}),await Ta(e.swRegistration)}catch(t){throw v.create("failed-service-worker-registration",{browserErrorMessage:t==null?void 0:t.message})}}async function Ta(e){return new Promise((t,n)=>{const s=setTimeout(()=>n(new Error(`Service worker not registered after ${st} ms`)),st),r=e.installing||e.waiting;e.active?(clearTimeout(s),t()):r?r.onstatechange=o=>{var i;((i=o.target)===null||i===void 0?void 0:i.state)==="activated"&&(r.onstatechange=null,clearTimeout(s),t())}:(clearTimeout(s),n(new Error("No incoming service worker found.")))})}/**
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
 */async function ka(e,t){if(!t&&!e.swRegistration&&await Aa(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw v.create("invalid-sw-registration");e.swRegistration=t}}/**
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
 */async function Da(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=Xt)}/**
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
 */async function sn(e,t){if(!navigator)throw v.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw v.create("permission-blocked");return await Da(e,t==null?void 0:t.vapidKey),await ka(e,t==null?void 0:t.serviceWorkerRegistration),ya(e)}/**
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
 */async function Oa(e,t,n){const s=Pa(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(s,{message_id:n[Zt],message_name:n[ra],message_time:n[aa],message_device_time:Math.floor(Date.now()/1e3)})}function Pa(e){switch(e){case X.NOTIFICATION_CLICKED:return"notification_open";case X.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
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
 */async function Ba(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===X.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(ot(n)):e.onMessageHandler.next(ot(n)));const s=n.data;ja(s)&&s[ia]==="1"&&await Oa(e,n.messageType,s)}const ct="@firebase/messaging",lt="0.12.21";/**
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
 */const Ma=e=>{const t=new Ca(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>Ba(t,n)),t},Ra=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:s=>sn(t,s)}};function $a(){F(new P("messaging",Ma,"PUBLIC")),F(new P("messaging-internal",Ra,"PRIVATE")),O(ct,lt),O(ct,lt,"esm2017")}/**
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
 */async function rn(){try{await jt()}catch{return!1}return typeof window<"u"&&Et()&&ns()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
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
 */function La(e=kt()){return rn().then(t=>{if(!t)throw v.create("unsupported-browser")},t=>{throw v.create("indexed-db-unsupported")}),Ae(_t(e),"messaging").getImmediate()}async function Fa(e,t){return e=_t(e),sn(e,t)}$a();const Ha={apiKey:"AIzaSyAJjWngAN7g3eOLBBtafthga1SCvrKtNRY",authDomain:"janpadnewstimes-d2eb4.firebaseapp.com",projectId:"janpadnewstimes-d2eb4",storageBucket:"janpadnewstimes-d2eb4.firebasestorage.app",messagingSenderId:"228931912040",appId:"1:228931912040:web:27c22afbfdd8a7cd1f96dd",measurementId:"G-Q2N5Z7SJJ6"},Va=sr().length===0?Tt(Ha):kt(),Ua=async()=>await rn()?La(Va):null,za=async()=>{try{const e=await Ua();return e?await Fa(e,{vapidKey:"BHH2jt5T0ZzDBoLvfZ1GKBx-7P1SUNiFysViUImiWqruHDMRYf9Q-O_Jl6P_OWWArybAZg9H7f6Gj4ZPqZ7UJVU"}):null}catch(e){return console.error("An error occurred while fetching the token:",e),null}},qa=({onclose:e})=>{const{user:t}=cn(x=>x.user),[n,s]=y.useState("default"),[r,o]=y.useState(!1),{data:i,isPending:c,isError:l,error:u,refetch:d}=Un(),[p,w]=y.useState({newsAdded:!0,eventNews:!0,newsDeleted:!1,newsUpdated:!1,others:!1});y.useEffect(()=>{"Notification"in window&&s(Notification.permission)},[]);const S=async()=>{if(!("Notification"in window)){alert("This browser does not support notifications");return}o(!0);try{const x=await Notification.requestPermission();if(s(x),x==="granted"){new Notification("Notifications Enabled!",{body:"You will now receive notifications from this app.",icon:"/favicon.ico"});const h=await za();await K.put("update-fcm",{fcm:h})}}catch(x){console.error("Error requesting notification permission:",x)}finally{o(!1)}},N=()=>{switch(n){case"granted":return{text:"Enabled",color:"text-success",bgColor:"bg-success-soft",icon:a.jsx(mt,{size:16})};case"denied":return{text:"Blocked",color:"text-danger",bgColor:"bg-danger-soft",icon:a.jsx(ht,{size:16})};default:return{text:"Not Set",color:"text-warning",bgColor:"bg-warning-soft",icon:a.jsx(Rn,{size:16})}}},E=async x=>{const h=!p[x];w(m=>({...m,[x]:h}));try{await K.post("update-notification-preference",{type:x,enabled:h}),d()}catch(m){console.error("Failed to update preference:",m)}},_=()=>{n==="granted"&&new Notification("Test Notification",{body:"This is a test notification to verify everything is working correctly.",icon:"/favicon.ico",tag:"test-notification"})},k=N();return y.useEffect(()=>{i&&w(i)},[c]),a.jsx(_n,{isPending:c,isError:l,error:u,children:a.jsxs("div",{className:"space-y-4",children:[a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:`p-2 rounded-full ${k.bgColor}`,children:a.jsx("div",{className:k.color,children:k.icon})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Browser Notifications"}),a.jsxs("p",{className:"text-sm text-fg-subtle",children:["Status: ",k.text]})]})]}),a.jsxs("div",{className:"flex items-center gap-2",children:[(n==="default"||n==="denied")&&a.jsx("button",{onClick:S,disabled:r,className:"bg-primary hover:bg-primary-hover disabled:bg-primary text-paper px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm",children:r?"Requesting...":"Enable Notifications"}),n==="granted"&&a.jsx("button",{onClick:_,className:"bg-success hover:bg-success text-paper px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm",children:"Test"})]})]}),n==="granted"&&a.jsxs("div",{className:"space-y-3",children:[a.jsx("h3",{className:"text-sm font-semibold text-fg-muted uppercase tracking-wide",children:"Notification Types"}),t.role==="admin"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-primary-soft",children:a.jsx(q,{className:"text-primary",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Add News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"News added by reporter"})]})]}),a.jsx("button",{onClick:()=>E("newsAdded"),className:`w-5 h-5 rounded-full border-2 ${p.newsAdded?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.newsAdded&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),t.role==="admin"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-primary-soft",children:a.jsx(Re,{className:"text-primary",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Event News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"Event news added by reporter"})]})]}),a.jsx("button",{onClick:()=>E("eventNews"),className:`w-5 h-5 rounded-full border-2 ${p.eventNews?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.eventNews&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),t.role==="reporter"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-success-soft",children:a.jsx(q,{className:"text-success",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Deleted News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"News deleted by admin"})]})]}),a.jsx("button",{onClick:()=>E("newsDeleted"),className:`w-5 h-5 rounded-full border-2 ${p.newsDeleted?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.newsDeleted&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),t.role==="admin"&&a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-warning-soft",children:a.jsx(q,{className:"text-warning",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Updated News"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"News updated by reporter"})]})]}),a.jsx("button",{onClick:()=>E("newsUpdated"),className:`w-5 h-5 rounded-full border-2 ${p.newsUpdated?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.newsUpdated&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]}),a.jsxs("div",{className:"flex items-center justify-between p-4 bg-surface-2 rounded-lg",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 rounded-full bg-danger-soft",children:a.jsx(q,{className:"text-danger",size:16})}),a.jsxs("div",{children:[a.jsx("span",{className:"font-medium text-fg",children:"Other Notifications"}),a.jsx("p",{className:"text-sm text-fg-subtle",children:"All other types of notifications"})]})]}),a.jsx("button",{onClick:()=>E("others"),className:`w-5 h-5 rounded-full border-2 ${p.others?"bg-primary border-primary":"bg-surface-3 border-line-strong"}`,children:p.others&&a.jsx("div",{className:"w-full h-full rounded-full bg-surface transform scale-50"})})]})]}),n==="denied"&&a.jsx("div",{className:"p-4 bg-danger-soft rounded-lg border border-danger/30",children:a.jsxs("div",{className:"flex items-start gap-3",children:[a.jsx(Re,{size:20,className:"text-danger mt-0.5"}),a.jsxs("div",{children:[a.jsx("h4",{className:"font-medium text-danger mb-1",children:"Notifications Blocked"}),a.jsx("p",{className:"text-sm text-danger mb-2",children:'Click "Enable Notifications" above to request permission again, or manually enable in browser settings:'}),a.jsxs("ol",{className:"text-sm text-danger list-decimal list-inside space-y-1",children:[a.jsx("li",{children:"Click the lock/info icon in your browser's address bar"}),a.jsx("li",{children:'Change notifications setting to "Allow"'}),a.jsx("li",{children:"Refresh this page"})]})]})]})}),a.jsx("div",{className:"p-4 bg-primary-soft rounded-lg border border-primary/30",children:a.jsxs("p",{className:"text-sm text-primary",children:[a.jsx("strong",{children:"About Notifications:"})," Stay updated with important news articles, account security alerts, and personalized content recommendations."]})})]})})},dt=20,ut=800,an=[["website","Website"],["x","X (Twitter)"],["facebook","Facebook"],["instagram","Instagram"],["youtube","YouTube"],["linkedin","LinkedIn"]],Ka=[["light","Light",On],["dark","Dark",Pn],["system","System",Bn]];function M({icon:e,label:t,value:n,children:s}){return a.jsxs("div",{className:"flex items-start gap-3 rounded-2xl bg-surface-2/70 p-3 sm:p-3.5",children:[a.jsx("span",{className:"grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-fg-muted ring-1 ring-line sm:size-10",children:a.jsx(e,{className:"size-4 sm:size-5"})}),a.jsxs("div",{className:"min-w-0 flex-1",children:[a.jsx("p",{className:"text-xs font-medium text-fg-subtle",children:t}),s||a.jsx("p",{className:"hindi-font truncate text-sm font-semibold text-fg",children:n||"—"})]})]})}function Wa({profile:e,onDone:t}){const n=yn(),s=xn(),{user:r}=gt(),[o,i]=y.useState({fullName:e.fullName||"",about:e.about||"",designation:e.designation||"",location:e.location||"",phone:e.phone||"",social:{...e.social}}),[c,l]=y.useState({blob:null,url:e.profile||""}),[u,d]=y.useState(""),[p,w]=y.useState({}),[S,N]=y.useState(!1),E=y.useRef(null),_=h=>m=>{i(f=>({...f,[h]:m.target.value})),w(f=>({...f,[h]:void 0}))},k=h=>{var f;const m=(f=h.target.files)==null?void 0:f[0];if(h.target.value="",!!m){if(!/^image\/(png|jpe?g|webp)$/i.test(m.type))return I.error("Choose a JPG, PNG or WebP image");if(m.size>10*1024*1024)return I.error("Image is larger than 10 MB");d(URL.createObjectURL(m))}},x=async h=>{h.preventDefault();const m={};if(o.fullName.trim().length<2&&(m.fullName="Enter your full name"),o.about.trim().length<dt&&(m.about=`Write at least ${dt} characters about yourself`),c.url||(m.photo="A profile photo is required"),w(m),Object.keys(m).length)return I.error(Object.values(m)[0]);const f=new FormData;["fullName","about","designation","location","phone"].forEach(j=>f.append(j,o[j]??"")),f.append("social",JSON.stringify(o.social||{})),c.blob&&f.append("profile",c.blob,"profile.jpg"),N(!0);const B=I.loading("Saving…");try{const{data:j}=await K.put("/profile",f);I.success("Profile updated",{id:B}),n(Nn({user:{...r,fullName:j.profile.fullName,profile:j.profile.profile}})),s.invalidateQueries({queryKey:["profile"]}),s.invalidateQueries({queryKey:["user"]}),t()}catch(j){I.error(In(j,"Could not save your profile"),{id:B})}finally{N(!1)}};return a.jsxs(z,{padded:!1,children:[a.jsx(J,{icon:wt,title:"Edit profile",description:"Shown on your public author page",actions:a.jsx($,{variant:"ghost",size:"sm",leftIcon:ht,onClick:t,children:"Cancel"})}),a.jsxs("form",{onSubmit:x,noValidate:!0,className:"space-y-5 p-3 sm:p-5",children:[a.jsxs("div",{className:"flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-left",children:[a.jsxs("button",{type:"button",onClick:()=>{var h;return(h=E.current)==null?void 0:h.click()},"aria-label":"Choose profile photo",className:xe("group relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-dashed bg-surface-2 transition-colors",p.photo?"border-danger":"border-line-strong hover:border-fg"),children:[c.url?a.jsx("img",{src:c.url,alt:"",className:"size-full object-cover"}):a.jsx("span",{className:"grid size-full place-items-center text-fg-faint",children:a.jsx(ze,{className:"size-7"})}),a.jsx("span",{className:"absolute inset-0 grid place-items-center bg-ink/55 text-xs font-medium text-paper opacity-0 transition-opacity group-hover:opacity-100",children:"Change"})]}),a.jsx("input",{ref:E,type:"file",accept:"image/png,image/jpeg,image/webp",className:"hidden",onChange:k}),a.jsxs("div",{className:"min-w-0 text-sm",children:[a.jsxs("p",{className:"font-medium text-fg",children:["Profile photo ",a.jsx("span",{className:"text-danger",children:"*"})]}),a.jsx("p",{className:"text-fg-subtle",children:"Crop and zoom after choosing."}),p.photo&&a.jsx("p",{className:"text-danger",children:p.photo}),a.jsx($,{type:"button",size:"sm",variant:"outline",leftIcon:ze,className:"mt-2",onClick:()=>{var h;return(h=E.current)==null?void 0:h.click()},children:c.url?"Change photo":"Choose photo"})]})]}),a.jsx(U,{label:"Full name",required:!0,error:p.fullName,children:a.jsx(G,{value:o.fullName,onChange:_("fullName"),maxLength:60,className:"hindi-font"})}),a.jsx(U,{label:"About",required:!0,error:p.about,hint:`${o.about.trim().length}/${ut}`,info:"Shown on your author page and used as its search description.",children:a.jsx(vn,{rows:5,value:o.about,maxLength:ut,onChange:_("about"),className:"hindi-font"})}),a.jsxs("div",{className:"grid gap-4 sm:grid-cols-2",children:[a.jsx(U,{label:"Designation",hint:"Optional",children:a.jsx(G,{icon:bt,value:o.designation,onChange:_("designation"),maxLength:80,className:"hindi-font"})}),a.jsx(U,{label:"Location",hint:"Optional",children:a.jsx(G,{icon:yt,value:o.location,onChange:_("location"),maxLength:80,className:"hindi-font"})}),a.jsx(U,{label:"Phone",hint:"Optional",children:a.jsx(G,{icon:xt,value:o.phone,onChange:_("phone"),inputMode:"tel"})})]}),a.jsxs("div",{children:[a.jsx("p",{className:"mb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle",children:"Links"}),a.jsx("div",{className:"grid gap-4 sm:grid-cols-2",children:an.map(([h,m])=>{var f;return a.jsx(U,{label:m,hint:"Optional",children:a.jsx(G,{value:((f=o.social)==null?void 0:f[h])||"",onChange:B=>i(j=>({...j,social:{...j.social,[h]:B.target.value}})),placeholder:"https://",inputMode:"url"})},h)})})]}),a.jsxs("div",{className:"flex gap-2 border-t border-line pt-4 sm:justify-end",children:[a.jsx($,{type:"button",variant:"outline",className:"flex-1 sm:flex-none",onClick:t,children:"Cancel"}),a.jsx($,{type:"submit",loading:S,className:"flex-[2] sm:flex-none",children:"Save changes"})]})]}),a.jsx(Cn,{open:!!u,src:u,onClose:()=>d(""),onDone:(h,m)=>{l({blob:h,url:m}),w(f=>({...f,photo:void 0})),d("")}})]})}function vi(){const{t:e,i18n:t}=An(),{theme:n,setTheme:s}=ln(),{user:r,can:o}=gt(),{data:i,isPending:c,isError:l,error:u,refetch:d}=Hn(),[p,w]=y.useState(!1),[S,N]=y.useState(!1),[E,_]=y.useState(!1),k=y.useMemo(()=>Sn(30),[]),x=(i==null?void 0:i._id)||(r==null?void 0:r.id)||(r==null?void 0:r._id),h=o("reporter.performance.own")||o("reporter.performance.all"),m=dn(x,k,!!x&&h),f=m.data;if(y.useEffect(()=>{i&&!i.about&&_(!0)},[i]),l)return a.jsx(un,{error:u,onRetry:d});const B=Object.entries((i==null?void 0:i.social)||{}).filter(([,b])=>b),j=i&&(!i.about||!i.profile||!i.fullName);return a.jsxs(a.Fragment,{children:[a.jsx(fn,{title:e("My profile"),description:"Your details, numbers and preferences"}),a.jsx(jn,{className:"mb-4 sm:mb-5",name:(i==null?void 0:i.fullName)||(i==null?void 0:i.username),src:i==null?void 0:i.profile,badges:(r==null?void 0:r.role)&&a.jsx(hn,{tone:r.role==="admin"?"accent":"primary",className:"capitalize",children:r.role}),subtitle:i!=null&&i.designation?`${i.designation}${i.location?` · ${i.location}`:""}`:i==null?void 0:i.location,about:i==null?void 0:i.about,actions:a.jsx(a.Fragment,{children:!E&&a.jsx($,{size:"sm",variant:"outline",leftIcon:wt,onClick:()=>_(!0),children:"Edit profile"})}),meta:c?a.jsx($e,{className:"h-4 w-56"}):a.jsxs(a.Fragment,{children:[a.jsxs("span",{children:["@",i==null?void 0:i.username]}),a.jsxs("span",{className:"inline-flex min-w-0 items-center gap-1.5",children:[a.jsx(Fe,{className:"size-4 shrink-0"}),a.jsx("span",{className:"truncate",children:i==null?void 0:i.email})]}),a.jsxs("span",{className:"inline-flex items-center gap-1.5",children:[a.jsx(Tn,{className:"size-4 shrink-0"}),e("Joined")," ",pn(i==null?void 0:i.createdAt)]})]})}),j&&!E&&a.jsx(z,{className:"mb-4 border-warning/40 bg-warning-soft/50 sm:mb-5",children:a.jsxs("p",{className:"text-sm text-fg-muted",children:[a.jsx("b",{className:"text-fg",children:"Complete your profile."})," Add a photo, your full name and a short about text — they appear on your public author page."]})}),h&&a.jsxs("div",{className:"mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:grid-cols-3 sm:gap-4",children:[a.jsx(ce,{className:"col-span-2 sm:col-span-1",label:`${e("Stories published")} · 30d`,value:(f==null?void 0:f.summary.published)??0,icon:He,tone:"black",loading:m.isLoading,change:f==null?void 0:f.comparison.publishedChangePercent}),a.jsx(ce,{label:e("Total reads"),value:(f==null?void 0:f.summary.totalViews)??0,icon:mn,tone:"info",loading:m.isLoading,change:f==null?void 0:f.comparison.viewsChangePercent}),a.jsx(ce,{label:"Avg reads / story",value:(f==null?void 0:f.summary.avgViewsPerArticle)??0,icon:gn,tone:"violet",loading:m.isLoading})]}),a.jsxs("div",{className:"grid gap-4 sm:gap-5 lg:grid-cols-5",children:[a.jsxs("div",{className:"min-w-0 space-y-4 sm:space-y-5 lg:col-span-3",children:[E&&i?a.jsx(Wa,{profile:i,onDone:()=>_(!1)}):a.jsxs(z,{padded:!1,children:[a.jsx(J,{icon:Ve,title:"Account information"}),a.jsxs("div",{className:"grid gap-2.5 p-3 sm:grid-cols-2 sm:gap-3 sm:p-5",children:[a.jsx(M,{icon:Ve,label:"Username",value:i==null?void 0:i.username}),a.jsx(M,{icon:He,label:"Full name",value:i==null?void 0:i.fullName}),a.jsx(M,{icon:Fe,label:e("Email"),value:i==null?void 0:i.email}),a.jsx(M,{icon:bt,label:"Designation",value:i==null?void 0:i.designation}),a.jsx(M,{icon:yt,label:"Location",value:i==null?void 0:i.location}),a.jsx(M,{icon:xt,label:"Phone",value:i==null?void 0:i.phone}),B.length>0&&a.jsx("div",{className:"sm:col-span-2",children:a.jsx(M,{icon:kn,label:"Links",children:a.jsx("div",{className:"mt-1 flex flex-wrap gap-1.5",children:B.map(([b,oe])=>{var ee;return a.jsx("a",{href:oe,target:"_blank",rel:"noreferrer",className:"rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-info hover:underline",children:((ee=an.find(on=>on[0]===b))==null?void 0:ee[1])||b},b)})})})})]})]}),h&&a.jsxs(z,{padded:!1,children:[a.jsx(J,{title:"Your last 30 days",description:"Stories and reads per day"}),a.jsx("div",{className:"p-3 sm:p-4",children:m.isLoading?a.jsx($e,{className:"h-56 w-full"}):a.jsx(En,{data:((f==null?void 0:f.trends.daily)||[]).map(b=>({bucket:b.date,published:b.published,views:b.views})),series:[{key:"published",name:"Stories"},{key:"views",name:"Reads"}],height:240})})]})]}),a.jsxs("div",{className:"min-w-0 space-y-4 sm:space-y-5 lg:col-span-2",children:[a.jsxs(z,{padded:!1,children:[a.jsx(J,{icon:Dn,title:"Security & notifications"}),a.jsxs("div",{className:"space-y-2.5 p-3 sm:p-5",children:[a.jsx($,{variant:"outline",leftIcon:Ue,className:"w-full justify-start",onClick:()=>w(!0),children:"Change password"}),a.jsx($,{variant:"outline",leftIcon:q,className:"w-full justify-start",onClick:()=>N(!0),children:"Manage notifications"}),a.jsxs("p",{className:"inline-flex items-center gap-1.5 pt-1 text-xs text-fg-faint",children:[a.jsx(te,{className:"size-3.5"}),"Sessions are protected with signed tokens."]})]})]}),a.jsxs(z,{padded:!1,children:[a.jsx(J,{icon:Ln,title:"Appearance & language",description:"Only the panel's own text changes — what you write stays as you write it."}),a.jsxs("div",{className:"space-y-4 p-3 sm:p-5",children:[a.jsxs("div",{children:[a.jsx("p",{className:"mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle",children:e("Theme")}),a.jsx("div",{className:"grid grid-cols-3 gap-2",children:Ka.map(([b,oe,ee])=>a.jsxs("button",{type:"button","aria-pressed":n===b,onClick:()=>s(b),className:xe("flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-colors",n===b?"border-fg bg-surface-2 text-fg":"border-line text-fg-muted hover:bg-surface-2"),children:[a.jsx(ee,{className:"size-5"}),e(oe)]},b))})]}),a.jsxs("div",{children:[a.jsxs("p",{className:"mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle",children:[a.jsx(bn,{className:"size-3.5"}),e("Language")]}),a.jsx("div",{className:"grid grid-cols-2 gap-2",children:wn.map(b=>a.jsxs("button",{type:"button","aria-pressed":t.language===b.code,onClick:()=>t.changeLanguage(b.code),className:xe("flex items-center justify-between gap-2 rounded-2xl border px-3 py-3 text-sm font-medium transition-colors sm:px-4",t.language===b.code?"border-fg bg-surface-2 text-fg":"border-line text-fg-muted hover:bg-surface-2"),children:[a.jsx("span",{className:"truncate",children:b.label}),t.language===b.code&&a.jsx(mt,{className:"size-4 shrink-0"})]},b.code))})]})]})]})]})]}),a.jsx(Le,{open:p,onClose:()=>w(!1),title:"Change password",icon:Ue,size:"sm",children:a.jsx(zn,{onclose:()=>w(!1)})}),a.jsx(Le,{open:S,onClose:()=>N(!1),title:"Notification settings",icon:q,size:"lg",children:a.jsx(qa,{onclose:()=>N(!1)})})]})}export{vi as default};
