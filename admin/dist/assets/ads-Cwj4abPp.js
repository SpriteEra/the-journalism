import{c as o,av as s,h as r}from"./index-CsiJQtcH.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M16 19h6",key:"xwg31i"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M19 16v6",key:"tddt3s"}],["path",{d:"M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5",key:"1glfrc"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M8 2v4",key:"1cmpym"}]],l=o("calendar-plus",u),y=async()=>{const{data:e}=await r.get("/get-admin-advertisement");return e},m=()=>s({queryKey:["ads"],queryFn:y,keepPreviousData:!0,staleTime:1e3*60*2}),h=async({queryKey:e})=>{const[a,{page:t,limit:n,search:c}]=e,d={page:t,limit:n,search:c},{data:i}=await r.get("/get-admin-title-ads",{params:d});return i},k=({page:e,limit:a,search:t})=>s({queryKey:["title-ads",{page:e,limit:a,search:t}],queryFn:h,keepPreviousData:!0,staleTime:1e3*60*2});export{l as C,m as a,k as u};
