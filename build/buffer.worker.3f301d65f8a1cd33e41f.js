!function(r){function e(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return r[n].call(o.exports,o,o.exports,e),o.l=!0,o.exports}var t={};e.m=r,e.c=t,e.d=function(r,t,n){e.o(r,t)||Object.defineProperty(r,t,{configurable:!1,enumerable:!0,get:n})},e.n=function(r){var t=r&&r.__esModule?function(){return r.default}:function(){return r};return e.d(t,"a",t),t},e.o=function(r,e){return Object.prototype.hasOwnProperty.call(r,e)},e.p="",e(e.s=0)}([function(r,e){self.addEventListener("message",function(r){for(var e=r.data.buffer,t=e.matrix,n=e.cols,o=e.rows,s=new Float32Array(t.length),a=[],u=1;u<n-1;u+=1)for(var f=1;f<o-1;f+=1){var c=u+f*n,i=t[c],l=u+1,p=u-1,x=(f+1)*n,d=(f-1)*n,v=t[p+d]||0,y=t[u+d]||0,b=t[l+d]||0,g=t[p+f*n]||0,m=t[l+f*n]||0,h=t[p+x]||0,w=t[u+x]||0,O=t[l+x]||0,j=v+y+b+g+m+h+w+O;1===i&&j<2?s[c]=0:1===i&&j>3?s[c]=0:0===i&&3===j?(s[c]=1,a.push({x:u,y:f})):(s[c]=i,1===i&&a.push({x:u,y:f}))}self.postMessage({matrix:s,pixels:a,cols:n,rows:o})})}]);