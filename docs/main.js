(()=>{"use strict";const t="*&*",e="*",n="+",s="(",i=")",l=[n,s,i],c=[t,n],o=[e],r=[s,n,t,e],a=[i,n,t],h={KLEIN_OP:8,CONCAT_OP:4,OR_OP:2},d={cursorVisible:!0,selectedObject:null,currentLink:null,movingObject:!1,originalClick:null},u=[],f=[];let g;CanvasRenderingContext2D,CanvasRenderingContext2D;class p{constructor(t,e){this.x=t,this.y=e,this.mouseOffsetX=0,this.mouseOffsetY=0,this.isAcceptState=!1,this.text=""}setMouseStart(t,e){this.mouseOffsetX=this.x-t,this.mouseOffsetY=this.y-e}setAnchorPoint(t,e){this.x=t+this.mouseOffsetX,this.y=e+this.mouseOffsetY}draw(t){t.beginPath(),t.arc(this.x,this.y,30,0,2*Math.PI,!1),t.stroke(),M(t,this.text,this.x,this.y,null,d.selectedObject==this),this.isAcceptState&&(t.beginPath(),t.arc(this.x,this.y,24,0,2*Math.PI,!1),t.stroke())}closestPointOnCircle(t,e){const n=t-this.x,s=e-this.y,i=Math.sqrt(n*n+s*s);return{x:this.x+30*n/i,y:this.y+30*s/i}}containsPoint(t,e){return(t-this.x)*(t-this.x)+(e-this.y)*(e-this.y)<900}}class x{constructor(t,e){this.node=t,this.anchorAngle=0,this.mouseOffsetAngle=0,this.text="",e&&this.setAnchorPoint(e.x,e.y)}setMouseStart(t,e){this.mouseOffsetAngle=this.anchorAngle-Math.atan2(e-this.node.y,t-this.node.x)}setAnchorPoint(t,e){this.anchorAngle=Math.atan2(e-this.node.y,t-this.node.x)+this.mouseOffsetAngle;const n=Math.round(this.anchorAngle/(Math.PI/2))*(Math.PI/2);Math.abs(this.anchorAngle-n)<.1&&(this.anchorAngle=n),this.anchorAngle<-Math.PI&&(this.anchorAngle+=2*Math.PI),this.anchorAngle>Math.PI&&(this.anchorAngle-=2*Math.PI)}getEndPointsAndCircle(){const t=this.node.x+45*Math.cos(this.anchorAngle),e=this.node.y+45*Math.sin(this.anchorAngle),n=22.5,s=this.anchorAngle-.8*Math.PI,i=this.anchorAngle+.8*Math.PI;return{hasCircle:!0,startX:t+n*Math.cos(s),startY:e+n*Math.sin(s),endX:t+n*Math.cos(i),endY:e+n*Math.sin(i),startAngle:s,endAngle:i,circleX:t,circleY:e,circleRadius:n}}draw(t){const e=this.getEndPointsAndCircle();t.beginPath(),t.arc(e.circleX,e.circleY,e.circleRadius,e.startAngle,e.endAngle,!1),t.stroke();const n=e.circleX+e.circleRadius*Math.cos(this.anchorAngle),s=e.circleY+e.circleRadius*Math.sin(this.anchorAngle);M(t,this.text,n,s,this.anchorAngle,d.selectedObject==this),P(t,e.endX,e.endY,e.endAngle+.4*Math.PI)}containsPoint(t,e){const n=this.getEndPointsAndCircle(),s=t-n.circleX,i=e-n.circleY,l=Math.sqrt(s*s+i*i)-n.circleRadius;return Math.abs(l)<6}}class A{constructor(t,e){this.node=t,this.deltaX=0,this.deltaY=0,this.text="",e&&this.setAnchorPoint(e.x,e.y)}setAnchorPoint(t,e){this.deltaX=t-this.node.x,this.deltaY=e-this.node.y,Math.abs(this.deltaX)<6&&(this.deltaX=0),Math.abs(this.deltaY)<6&&(this.deltaY=0)}getEndPoints(){const t=this.node.x+this.deltaX,e=this.node.y+this.deltaY,n=this.node.closestPointOnCircle(t,e);return{startX:t,startY:e,endX:n.x,endY:n.y}}draw(t){const e=this.getEndPoints();t.beginPath(),t.moveTo(e.startX,e.startY),t.lineTo(e.endX,e.endY),t.stroke();const n=Math.atan2(e.startY-e.endY,e.startX-e.endX);M(t,this.text,e.startX,e.startY,n,d.selectedObject==this),P(t,e.endX,e.endY,Math.atan2(-this.deltaY,-this.deltaX))}containsPoint(t,e){const n=this.getEndPoints(),s=n.endX-n.startX,i=n.endY-n.startY,l=Math.sqrt(s*s+i*i),c=(s*(t-n.startX)+i*(e-n.startY))/(l*l),o=(s*(e-n.startY)-i*(t-n.startX))/l;return c>0&&c<1&&Math.abs(o)<6}}const y=["Alpha","Beta","Gamma","Delta","Epsilon","Zeta","Eta","Theta","Iota","Kappa","Lambda","Mu","Nu","Xi","Omicron","Pi","Rho","Sigma","Tau","Upsilon","Phi","Chi","Psi","Omega"];function b(t){for(let e=0;e<y.length;e++){const n=y[e];t=(t=t.replace(new RegExp("\\\\"+n,"g"),String.fromCharCode(913+e+ +(e>16)))).replace(new RegExp("\\\\"+n.toLowerCase(),"g"),String.fromCharCode(945+e+ +(e>16)))}for(let e=0;e<10;e++)t=t.replace(new RegExp("_"+e,"g"),String.fromCharCode(8320+e));return t}function P(t,e,n,s){const i=Math.cos(s),l=Math.sin(s);t.beginPath(),t.moveTo(e,n),t.lineTo(e-8*i+5*l,n-8*l-5*i),t.lineTo(e-8*i-5*l,n-8*l+5*i),t.fill()}function O(){return(document.activeElement||document.body)==document.body}function M(t,e,n,s,i,l){const c=b(e);t.font='20px "Times New Roman", serif';const o=t.measureText(c).width;if(n-=o/2,null!=i){const t=Math.cos(i),e=Math.sin(i),l=(o/2+5)*(t>0?1:-1),c=15*(e>0?1:-1),r=e*Math.pow(Math.abs(e),40)*l-t*Math.pow(Math.abs(t),10)*c;n+=l-e*r,s+=c+t*r}"advancedFillText"in t?t.advancedFillText(c,e,n+o/2,s,i):(n=Math.round(n),s=Math.round(s),t.fillText(c,n,s+6),l&&j&&O()&&document.hasFocus()&&(n+=o,t.beginPath(),t.moveTo(n,s-10),t.lineTo(n,s+10),t.stroke()))}let m,j=!0;function X(){clearInterval(m),m=setInterval((function(){j=!j,Y()}),500),j=!0}function Y(){(function(t){t.clearRect(0,0,g.width,g.height),t.save(),t.translate(.5,.5);for(let e=0;e<u.length;e++)t.lineWidth=1,t.fillStyle=t.strokeStyle=u[e]==d.selectedObject?"blue":"black",u[e].draw(t);for(let e=0;e<f.length;e++)t.lineWidth=1,t.fillStyle=t.strokeStyle=f[e]==d.selectedObject?"blue":"black",f[e].draw(t);null!=d.currentLink&&(t.lineWidth=1,t.fillStyle=t.strokeStyle="black",d.currentLink.draw(t)),t.restore()})(g.getContext("2d")),function(){if(!localStorage||!JSON)return;const t={nodes:[],links:[]};for(let e=0;e<u.length;e++){const n=u[e];let s={x:n.x,y:n.y,text:n.text,isAcceptState:n.isAcceptState};t.nodes.push(s)}for(let e=0;e<f.length;e++){const n=f[e];let s=null;n instanceof x?s={type:"SelfLink",node:u.indexOf(n.node),text:n.text,anchorAngle:n.anchorAngle}:n instanceof A?s={type:"StartLink",node:u.indexOf(n.node),text:n.text,deltaX:n.deltaX,deltaY:n.deltaY}:n instanceof v&&(s={type:"Link",nodeA:u.indexOf(n.nodeA),nodeB:u.indexOf(n.nodeB),text:n.text,lineAngleAdjust:n.lineAngleAdjust,parallelPart:n.parallelPart,perpendicularPart:n.perpendicularPart}),null!=s&&t.links.push(s)}localStorage.fsm=JSON.stringify(t)}()}function k(t,e){for(let n=0;n<u.length;n++)if(u[n].containsPoint(t,e))return u[n];for(let n=0;n<f.length;n++)if(f[n].containsPoint(t,e))return f[n];return null}function w(t){return t.key}function S(t){const e=function(t){let e=(t=t||window.event).target,n=0,s=0;for(;e.offsetParent;)n+=e.offsetLeft,s+=e.offsetTop,e=e.offsetParent;return{x:n,y:s}}(t),n=function(t){return{x:(t=t||window.event).pageX||t.clientX+document.body.scrollLeft+document.documentElement.scrollLeft,y:t.pageY||t.clientY+document.body.scrollTop+document.documentElement.scrollTop}}(t);return{x:n.x-e.x,y:n.y-e.y}}function C(t,e,n,s,i,l,c,o,r){return t*i*r+e*l*c+n*s*o-t*l*o-e*s*r-n*i*c}class v{constructor(t,e){this.nodeA=t,this.nodeB=e,this.text="",this.lineAngleAdjust=0,this.parallelPart=.5,this.perpendicularPart=0}getAnchorPoint(){const t=this.nodeB.x-this.nodeA.x,e=this.nodeB.y-this.nodeA.y,n=Math.sqrt(t*t+e*e);return{x:this.nodeA.x+t*this.parallelPart-e*this.perpendicularPart/n,y:this.nodeA.y+e*this.parallelPart+t*this.perpendicularPart/n}}setAnchorPoint(t,e){const n=this.nodeB.x-this.nodeA.x,s=this.nodeB.y-this.nodeA.y,i=Math.sqrt(n*n+s*s);this.parallelPart=(n*(t-this.nodeA.x)+s*(e-this.nodeA.y))/(i*i),this.perpendicularPart=(n*(e-this.nodeA.y)-s*(t-this.nodeA.x))/i,this.parallelPart>0&&this.parallelPart<1&&Math.abs(this.perpendicularPart)<6&&(this.lineAngleAdjust=+(this.perpendicularPart<0)*Math.PI,this.perpendicularPart=0)}getEndPointsAndCircle(){if(0==this.perpendicularPart){const t=(this.nodeA.x+this.nodeB.x)/2,e=(this.nodeA.y+this.nodeB.y)/2,n=this.nodeA.closestPointOnCircle(t,e),s=this.nodeB.closestPointOnCircle(t,e);return{hasCircle:!1,startX:n.x,startY:n.y,endX:s.x,endY:s.y}}const t=this.getAnchorPoint(),e=function(t,e,n,s,i,l){const c=C(t,e,1,n,s,1,i,l,1),o=-C(t*t+e*e,e,1,n*n+s*s,s,1,i*i+l*l,l,1),r=C(t*t+e*e,t,1,n*n+s*s,n,1,i*i+l*l,i,1),a=-C(t*t+e*e,t,e,n*n+s*s,n,s,i*i+l*l,i,l);return{x:-o/(2*c),y:-r/(2*c),radius:Math.sqrt(o*o+r*r-4*c*a)/(2*Math.abs(c))}}(this.nodeA.x,this.nodeA.y,this.nodeB.x,this.nodeB.y,t.x,t.y),n=this.perpendicularPart>0,s=n?1:-1,i=Math.atan2(this.nodeA.y-e.y,this.nodeA.x-e.x)-30*s/e.radius,l=Math.atan2(this.nodeB.y-e.y,this.nodeB.x-e.x)+30*s/e.radius;return{hasCircle:!0,startX:e.x+e.radius*Math.cos(i),startY:e.y+e.radius*Math.sin(i),endX:e.x+e.radius*Math.cos(l),endY:e.y+e.radius*Math.sin(l),startAngle:i,endAngle:l,circleX:e.x,circleY:e.y,circleRadius:e.radius,reverseScale:s,isReversed:n}}draw(t){const e=this.getEndPointsAndCircle();if(t.beginPath(),e.hasCircle?t.arc(e.circleX,e.circleY,e.circleRadius,e.startAngle,e.endAngle,e.isReversed):(t.moveTo(e.startX,e.startY),t.lineTo(e.endX,e.endY)),t.stroke(),e.hasCircle?P(t,e.endX,e.endY,e.endAngle-e.reverseScale*(Math.PI/2)):P(t,e.endX,e.endY,Math.atan2(e.endY-e.startY,e.endX-e.startX)),e.hasCircle){let n=e.startAngle,s=e.endAngle;s<n&&(s+=2*Math.PI);const i=(n+s)/2+ +e.isReversed*Math.PI,l=e.circleX+e.circleRadius*Math.cos(i),c=e.circleY+e.circleRadius*Math.sin(i);M(t,this.text,l,c,i,d.selectedObject==this)}else{const n=(e.startX+e.endX)/2,s=(e.startY+e.endY)/2,i=Math.atan2(e.endX-e.startX,e.startY-e.endY);M(t,this.text,n,s,i+this.lineAngleAdjust,d.selectedObject==this)}}containsPoint(t,e){const n=this.getEndPointsAndCircle();if(!n.hasCircle){const s=n.endX-n.startX,i=n.endY-n.startY,l=Math.sqrt(s*s+i*i),c=(s*(t-n.startX)+i*(e-n.startY))/(l*l),o=(s*(e-n.startY)-i*(t-n.startX))/l;return c>0&&c<1&&Math.abs(o)<6}{const s=t-n.circleX,i=e-n.circleY,l=Math.sqrt(s*s+i*i)-n.circleRadius;if(Math.abs(l)<6){let t=Math.atan2(i,s),e=n.startAngle,l=n.endAngle;if(n.isReversed){const t=e;e=l,l=t}return l<e&&(l+=2*Math.PI),t<e?t+=2*Math.PI:t>l&&(t-=2*Math.PI),t>e&&t<l}}return!1}}function L(t,e,n){if(t.isAcceptState)return;const s=[],i=[],l=[],c=[];for(let e=0;e<n.length;e++){const c=n[e];c instanceof x&&c.node==t?l.push(c):c instanceof v&&(c.nodeA==t?i.push(c):c.nodeB==t&&s.push(c))}let o="";if(l.length>0){const t=[];for(let e=0;e<l.length;e++)t.push(...l[e].text.split(","));1==t.length&&1==t[0].length?o=`${t[0]}*`:t.length>0&&(o=`(${t.join("+")})*`)}for(let t=0;t<s.length;t++){const e=s[t];for(let t=0;t<i.length;t++){const s=i[t];let l,c;c=`${I(e.text)}${o}${I(s.text)}`,l=e.nodeA==s.nodeB?new x(e.nodeA):new v(e.nodeA,s.nodeB),c=c.replace(/([)*\w])(\\epsilon)/g,"$1").replace(/(\\epsilon)([(\w])/g,"$2"),l.text=c,n.push(l)}}let r=n.length;for(;r--;)(s.some((t=>t==n[r]))||i.some((t=>t==n[r]))||l.some((t=>t==n[r])))&&n.splice(r,1);e.splice(e.indexOf(t),1);for(let t=0;t<c.length;t++)n.push(c[t]);!function(t){const e=[],n=new Map;for(let e=0;e<t.length;e++){const s=t[e];if(s instanceof x)continue;if(!(s instanceof v))continue;let i=B(s.nodeA)+B(s.nodeB);n.get(i)?n.get(i).push(s):n.set(i,[s])}for(const t of n.values())if(t.length>1){t[0].text=`${t.map((t=>t.text)).join("+")}`;for(let n=1;n<t.length;n++)e.push(t[n])}let s=t.length;for(;s--;)e.some((e=>e==t[s]))&&t.splice(s,1)}(n)}function B(t){return JSON.stringify(t)}function I(d){if(d.includes("+")){let u=function(n){const d=function(n){n=b(n=n.replace(/(\w)\*/g,"($1)*"));const c=[];let o=0,h=0;for(;h<n.length;){if(l.includes(n[h]))o!=h&&c.push(n.slice(o,h)),o=h+1,c.push(n[h]);else if(n[h]==e){let t=c.length-1,e=0;for(;t>=0&&(c[t]==i?e++:c[t]==s&&e--,0!=e);)t--;c.splice(t,0,n[h]),o=h+1}h++}for(o!=h&&c.push(n.slice(o)),h=c.length-1;h>0;)r.includes(c[h-1])||a.includes(c[h])||c.splice(h,0,t),h--;return c}(n),u=[],f=[];for(let t=0;t<d.length;t++){const n=d[t];if(n==e)f.push(n);else if(c.includes(n)){for(;f.length>0;){let t=f[f.length-1];if(!(t!=s&&h[t]>=h[n]))break;u.push(f.pop())}f.push(n)}else if(n==s)f.push(n);else if(n==i){for(;f.length>0&&f[f.length-1]!=s;)u.push(f.pop());0==f.length&&console.error("The operator stack is empty, fix the parentheses."),f.pop(),f.length>0&&o.includes(f[length-1])&&u.push(f.pop())}else u.push(n)}for(;f.length>0;)u.push(f.pop());return u}(d);if(u.length>0&&u[u.length-1]==n){if(d.charAt(0)!=s||d.charAt(d.length-1)!=i)return`(${d})`;{let t=0;for(let e=0;e<d.length;e++)if(d[e]==s?t++:d[e]==i&&t--,t<0)return`(${d})`}}}return d}class R{constructor(t,e){this.from=t,this.to=e}draw(t){t.beginPath(),t.moveTo(this.to.x,this.to.y),t.lineTo(this.from.x,this.from.y),t.stroke(),P(t,this.to.x,this.to.y,Math.atan2(this.to.y-this.from.y,this.to.x-this.from.x))}}window.onload=function(){var t;t=document.getElementById("canvas"),g=t,function(){if(localStorage&&JSON)try{const t=JSON.parse(localStorage.fsm);for(let e=0;e<t.nodes.length;e++){const n=t.nodes[e],s=new p(n.x,n.y);s.isAcceptState=n.isAcceptState,s.text=n.text,u.push(s)}for(let e=0;e<t.links.length;e++){const n=t.links[e];let s=null;"SelfLink"==n.type?(s=new x(u[n.node]),s.anchorAngle=n.anchorAngle,s.text=n.text):"StartLink"==n.type?(s=new A(u[n.node]),s.deltaX=n.deltaX,s.deltaY=n.deltaY,s.text=n.text):"Link"==n.type&&(s=new v(u[n.nodeA],u[n.nodeB]),s.parallelPart=n.parallelPart,s.perpendicularPart=n.perpendicularPart,s.text=n.text,s.lineAngleAdjust=n.lineAngleAdjust),null!=s&&f.push(s)}}catch(t){localStorage.fsm=""}}(),Y(),g.onmousedown=function(t){const e=S(t);return d.selectedObject=k(e.x,e.y),d.movingObject=!1,d.originalClick=e,null!=d.selectedObject?(T&&d.selectedObject instanceof p?d.currentLink=new x(d.selectedObject,e):(d.movingObject=!0,d.selectedObject.setMouseStart&&d.selectedObject.setMouseStart(e.x,e.y)),X()):T&&(d.currentLink=new R(e,e)),Y(),!O()&&(X(),!0)},g.ondblclick=function(t){const e=S(t);d.selectedObject=k(e.x,e.y),null==d.selectedObject?(d.selectedObject=new p(e.x,e.y),u.push(d.selectedObject),X(),Y()):d.selectedObject instanceof p&&(d.selectedObject.isAcceptState=!d.selectedObject.isAcceptState,Y())},g.onmousemove=function(t){const e=S(t);if(null!=d.currentLink){let t=k(e.x,e.y);t instanceof p||(t=null),null==d.selectedObject?d.currentLink=null!=t?new A(t,d.originalClick):new R(d.originalClick,e):t==d.selectedObject?d.currentLink=new x(d.selectedObject,e):d.currentLink=null!=t?new v(d.selectedObject,t):new R(d.selectedObject.closestPointOnCircle(e.x,e.y),e),Y()}d.movingObject&&(d.selectedObject.setAnchorPoint(e.x,e.y),d.selectedObject instanceof p&&function(t){for(let e=0;e<u.length;e++)u[e]!=t&&(Math.abs(t.x-u[e].x)<6&&(t.x=u[e].x),Math.abs(t.y-u[e].y)<6&&(t.y=u[e].y))}(d.selectedObject),Y())},g.onmouseup=function(t){d.movingObject=!1,null!=d.currentLink&&(d.currentLink instanceof R||(d.selectedObject=d.currentLink,f.push(d.currentLink),X()),d.currentLink=null,Y())}};let T=!1;document.addEventListener("keydown",(function(t){const e=w(t);if("Shift"==e)T=!0;else{if(!O())return!0;if("Backspace"==e)return null!=d.selectedObject&&"text"in d.selectedObject&&(d.selectedObject.text=d.selectedObject.text.substr(0,d.selectedObject.text.length-1),X(),Y()),!1;if("Delete"==e){if(null!=d.selectedObject){for(let t=0;t<u.length;t++)u[t]==d.selectedObject&&u.splice(t--,1);for(let t=0;t<f.length;t++)f[t]!=d.selectedObject&&f[t].node!=d.selectedObject&&f[t].nodeA!=d.selectedObject&&f[t].nodeB!=d.selectedObject||f.splice(t--,1);d.selectedObject=null,Y()}}else if("]"==e){if(null!=k)for(let t=0;t<u.length;t++)u[t]==d.selectedObject&&(L(d.selectedObject,u,f),d.selectedObject=null,Y())}else if(1==e.length&&e.charCodeAt(0)&&e.charCodeAt(0)&&null!=d.selectedObject&&"text"in d.selectedObject)return d.selectedObject.text+=e,X(),Y(),t.preventDefault(),!1}})),document.addEventListener("keyup",(function(t){"Shift"==w(t)&&(T=!1)}))})();