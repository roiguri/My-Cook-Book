const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-controller-B2mcsM-8.js","assets/sw-register-nWNmA_5D.js","assets/sw-register-CsuhpVXX.css","assets/auth-avatar-BhsXcPk7.js","assets/auth-content-DLM3Yd_8.js","assets/login-form-hXhtH-WN.js","assets/message-modal-BCf8-UxT.js","assets/modal-CJCcv8_f.js","assets/signup-form-C5UqCACI.js","assets/forgot-password-ka97TXr_.js","assets/user-profile-Drzji1yT.js"])))=>i.map(i=>d[i]);
import{F as S,i as b,_ as u,f as y}from"./sw-register-nWNmA_5D.js";import"./recipe-card-D1tGobeN.js";import"./navigation-script-6EMbmBri.js";import"./recipe-image-utils-BxyJQeAp.js";import"./recipe-ingredients-utils-z11E7uy4.js";class w extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.itemWidth=200,this.gap=20,this.bgColor="var(--background-color)",this.borderRadius=10,this.showScrollbar=!1,this.scrollableWidth=0,this.currentIndex=0,this.handleResize=this.handleResize.bind(this),this.contentObserver=new MutationObserver(this.handleContentChanges.bind(this)),this.isUpdating=!1,this.touchState={startX:0,startY:0,startTime:0,currentX:0,isDragging:!1,currentTranslate:0,prevTranslate:0,animationID:null},this.handleTouchStart=this.handleTouchStart.bind(this),this.handleTouchMove=this.handleTouchMove.bind(this),this.handleTouchEnd=this.handleTouchEnd.bind(this)}setupContentObserver(){const e=this.shadowRoot.querySelector("slot").assignedElements()[0];e&&this.contentObserver.observe(e,{childList:!0,subtree:!1,attributes:!1})}handleContentChanges(t){if(!this.isUpdating)try{this.isUpdating=!0,this.applyItemStyles(),this.calculateVisibleWidth(),this.calculateTotalWidth();const e=this.getMaxScroll();this.currentIndex>e&&(this.currentIndex=e),this.updateLayout(),this.updateArrowVisibility()}finally{this.isUpdating=!1}}static get observedAttributes(){return["padding","item-width","background-color","border-radius","title"]}attributeChangedCallback(t,e,s){switch(t){case"item-width":e!==s&&(this.itemWidth=parseInt(s,10)||200,this.applyItemStyles(),this.calculateTotalWidth(),this.isScrollNeeded());break;case"padding":e!==s&&(this.containerPadding=parseInt(s,10)||20,this.updatePadding(),this.isConnected&&(this.calculateTotalWidth(),this.isScrollNeeded()));break;case"background-color":e!==s&&(this.bgColor=s,this.updateContainerStyles());break;case"border-radius":e!==s&&(this.borderRadius=s,this.updateBorderRadius());break;case"title":this.title=s||void 0;break}}connectedCallback(){this.render(),this.setupSlotted(),this.setupArrowHandlers(),this.calculateVisibleWidth(),window.addEventListener("resize",this.handleResize),this.updateArrowVisibility(),this.setupContentObserver(),this.setupTouchEvents(),this.updateScrollbarWidth(),this.setupScrollbarClick(),this.setupScrollbarDrag()}disconnectedCallback(){window.removeEventListener("resize",this.handleResize),this.contentObserver.disconnect(),this.removeTouchEvents()}handleResize(){this.calculateVisibleWidth(),this.isScrollNeeded();const t=this.getMaxScroll();this.currentIndex>t&&(this.currentIndex=t,this.updateScroll()),this.updateLayout(),this.updateArrowVisibility(),this.updateScrollbarWidth()}calculateVisibleWidth(){const t=this.shadowRoot.querySelector(".scroller-container");return(t==null?void 0:t.offsetWidth)||0}calculateTotalWidth(){const e=this.shadowRoot.querySelector("slot").assignedElements()[0];if(!e)return 0;const s=e.children.length,n=this.itemWidth*s+20*(s-1),r=this.containerPadding*2;return n+r}isScrollNeeded(){const t=this.calculateVisibleWidth();return this.calculateTotalWidth()>t}setupSlotted(){this.shadowRoot.querySelector("slot").addEventListener("slotchange",()=>{this.applyItemStyles(),this.calculateVisibleWidth(),this.isScrollNeeded(),this.updateLayout(),this.updateArrowVisibility()})}applyItemStyles(){const e=this.shadowRoot.querySelector("slot").assignedElements()[0];e&&(e.style.display="flex",e.style.gap=`${this.gap}px`,Array.from(e.children).forEach(s=>{s.style.width=`${this.itemWidth}px`,s.style.flexShrink="0"}))}getCurrentIndex(){return this.currentIndex}getVisibleItems(){const t=this.calculateVisibleWidth(),e=this.containerPadding||20,s=t-e*2;return Math.floor((s+this.gap)/(this.itemWidth+this.gap))}getMaxScroll(){const e=this.shadowRoot.querySelector("slot").assignedElements()[0];if(!e)return 0;const s=e.children.length,i=this.getVisibleItems();return Math.max(0,s-i)}validateScroll(t){return Math.min(Math.max(0,t),this.getMaxScroll())}setupArrowHandlers(){const t=this.shadowRoot.querySelector(".scroller-arrow--left"),e=this.shadowRoot.querySelector(".scroller-arrow--right");t.addEventListener("click",()=>this.scrollLeft()),e.addEventListener("click",()=>this.scrollRight())}scrollToIndex(t){const e=this.validateScroll(t);e!==this.currentIndex&&(this.currentIndex=e,this.updateScroll(),this.updateArrowVisibility(),this.updateScrollbarPosition())}scrollLeft(){this.scrollToIndex(this.currentIndex-1),this.updateScrollbarPosition()}scrollRight(){this.scrollToIndex(this.currentIndex+1),this.updateScrollbarPosition()}updateScroll(){const t=this.shadowRoot.querySelector("slot").assignedElements()[0];if(!t)return;const e=this.calculateTotalWidth(),s=this.calculateVisibleWidth(),i=e-s,n=this.itemWidth+this.gap;let r;this.currentIndex===this.getMaxScroll()?r=i:this.currentIndex===0?r=0:r=this.currentIndex*n,t.style.transform=`translateX(-${r}px)`,t.style.transition="transform 0.3s ease"}setupTouchEvents(){const t=this.shadowRoot.querySelector(".items-wrapper");t&&(t.addEventListener("touchstart",this.handleTouchStart,{passive:!1}),t.addEventListener("touchmove",this.handleTouchMove,{passive:!1}),t.addEventListener("touchend",this.handleTouchEnd),t.addEventListener("mousedown",this.handleTouchStart),window.addEventListener("mousemove",this.handleTouchMove),window.addEventListener("mouseup",this.handleTouchEnd))}removeTouchEvents(){const t=this.shadowRoot.querySelector(".items-wrapper");t&&(t.removeEventListener("touchstart",this.handleTouchStart),t.removeEventListener("touchmove",this.handleTouchMove),t.removeEventListener("touchend",this.handleTouchEnd),t.removeEventListener("mousedown",this.handleTouchStart),window.removeEventListener("mousemove",this.handleTouchMove),window.removeEventListener("mouseup",this.handleTouchEnd))}handleTouchStart(t){t.type==="mousedown"&&t.preventDefault();const e=t.touches?t.touches[0]:t;this.touchState={...this.touchState,startX:e.clientX,startY:e.clientY,startTime:Date.now(),isDragging:!0,currentTranslate:this.touchState.prevTranslate},this.touchState.animationID&&cancelAnimationFrame(this.touchState.animationID);const s=this.shadowRoot.querySelector("slot").assignedElements()[0];if(s){const i=window.getComputedStyle(s).transform;i!=="none"&&(this.touchState.prevTranslate=parseFloat(i.split(",")[4])||0)}}handleTouchMove(t){if(!this.touchState.isDragging)return;t.preventDefault();const e=t.touches?t.touches[0]:t,s=e.clientX;e.clientY;const i=s-this.touchState.startX;this.touchState.currentTranslate=this.touchState.prevTranslate+i;const n=this.calculateMaxTranslate();this.touchState.currentTranslate=Math.max(-n,Math.min(0,this.touchState.currentTranslate)),this.applyTransform(this.touchState.currentTranslate);const r=this.itemWidth+this.gap,l=Math.round(Math.abs(this.touchState.currentTranslate)/r);this.currentIndex!==l&&(this.currentIndex=this.validateScroll(l),this.updateArrowVisibility());const c=Math.abs(this.touchState.currentTranslate)/n,o=this.shadowRoot.querySelector(".scroll-indicator"),{trackWidth:a}=this.calculateScrollbarDimensions();if(o){const d=c*(a-o.offsetWidth);o.style.transform=`translateX(${d}px)`}}handleTouchEnd(){if(!this.touchState.isDragging)return;const t=this.touchState.currentTranslate-this.touchState.prevTranslate,e=Date.now()-this.touchState.startTime,s=t/e,i=this.itemWidth+this.gap,n=Math.abs(this.touchState.currentTranslate);let r=Math.round(n/i);if(Math.abs(s)>.5){const l=Math.min(Math.ceil(Math.abs(s)*2),this.getVisibleItems());s<0?r+=l:r-=l}this.touchState.isDragging=!1,this.scrollToIndex(r)}snapToNearestItem(){const t=this.currentItemWidth+this.gap,e=this.touchState.currentTranslate,i=-Math.round(Math.abs(e)/t)*t;this.animateToPosition(i)}animateToPosition(t){const e=this.touchState.currentTranslate,s=t-e,i=performance.now(),n=300,r=l=>{const c=l-i,o=Math.min(c/n,1),a=1-Math.pow(1-o,3),d=e+s*a;this.applyTransform(d);const p=this.itemWidth+this.gap,h=Math.round(Math.abs(d)/p);this.currentIndex!==h&&(this.currentIndex=this.validateScroll(h),this.updateArrowVisibility()),o<1?this.touchState.animationID=requestAnimationFrame(r):(this.touchState.prevTranslate=t,this.touchState.currentTranslate=t,this.updateArrowVisibility())};this.touchState.animationID=requestAnimationFrame(r)}applyTransform(t){const e=this.shadowRoot.querySelector("slot").assignedElements()[0];e&&(e.style.transform=`translateX(${t}px)`,e.style.transition="none")}calculateMaxTranslate(){if(!this.shadowRoot.querySelector("slot").assignedElements()[0])return 0;const e=this.calculateVisibleWidth(),s=this.calculateTotalWidth();return Math.max(0,s-e)}updateArrowVisibility(){console.log("updateArrowVisibility");const t=this.shadowRoot.querySelector(".scroller-arrow--left"),e=this.shadowRoot.querySelector(".scroller-arrow--right");this.isScrollNeeded()?(t.classList.toggle("visible",this.currentIndex>0),e.classList.toggle("visible",this.currentIndex<this.getMaxScroll())):(t.classList.remove("visible"),e.classList.remove("visible"))}updateLayout(){const t=this.shadowRoot.querySelector("slot").assignedElements()[0];t&&(this.isScrollNeeded()?(t.style="",t.style.display="flex",t.style.gap="20px",Array.from(t.children).forEach(e=>{e.style.width="${this.itemWidth}px",e.style.flexShrink="0"}),this.updateScroll()):(t.style.display="flex",t.style.justifyContent="center",t.style.transform=""))}updatePadding(){const t=this.shadowRoot.querySelector(".items-wrapper");t&&(t.style.padding=`${this.containerPadding}px`)}updateContainerStyles(){const t=this.shadowRoot.querySelector(".scroller-container");t&&(t.style.backgroundColor=this.bgColor||"var(--background-color)")}updateBorderRadius(){const t=this.shadowRoot.querySelector(".scroller-container");t&&(t.style.borderRadius=`${this.borderRadius}px`||"10px")}render(){this.shadowRoot.innerHTML=`
          <style>
              .scroller-container {
                  width: 100%;
                  overflow: hidden;
                  position: relative;
                  background-color: ${this.bgColor};
                  border-radius: ${this.borderRadius}px;
              }

              .element-scroller__title {
                  display: flex;
                  justify-content: center;
                  margin: 10px auto;
                  font-size: var(--size-header2, 1.2rem);
                  font-weight: bold;
              }

              .items-wrapper {
                  padding: ${this.getAttribute("padding")||20}px;
              }

              .scroller-arrow {
                  position: absolute;
                  top: 50%;
                  transform: translateY(-50%);
                  background-color: var(--primary-color, #3498db);
                  color: white;
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  cursor: pointer;
                  z-index: 10;
                  display: none;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                  border: 2px solid white;
                  font-size: 18px;
                  transition: transform 0.2s ease, background-color 0.2s ease;
              }

              .scroller-container:hover .scroller-arrow.visible {
                  display: flex;
              }

              .scroller-arrow--left {
                  left: 15px;
              }

              .scroller-arrow--right {
                  right: 15px;
              }

              .scroller-arrow:hover {
                  background-color: var(--primary-dark, #2980b9);
                  transform: translateY(-50%) scale(1.1);
              }

              .scroller-arrow:active {
                  transform: translateY(-50%) scale(0.95);
              }

              .scroll-indicator-container {
                  height: 4px;
                  background: rgba(0, 0, 0, 0.1);
                  position: absolute;
                  bottom: 0;
                  left: ${this.getAttribute("padding")||20}px;
                  right: ${this.getAttribute("padding")||20}px; /* Apply padding to both sides */
              }

              .scroll-indicator {
                  height: 100%;
                  background: var(--primary-color, #3498db);
                  position: absolute;
                  left: 0;
                  transition: all 0.3s ease;
                  border-radius: 2px;
              }

              /* Add hover effect */
              .scroll-indicator-container:hover {
                  height: 6px;
              }
              
              .scroll-indicator-container:hover .scroll-indicator {
                  background: var(--primary-dark, #2980b9);
              }
          </style>

          <div class="scroller-container">
              ${this.hasAttribute("title")?`
                  <div class="element-scroller__title">
                      <span>${this.getAttribute("title")}</span>
                  </div>
              `:""}
              <div class="items-wrapper">
                  <slot name="items"></slot>
              </div>

              <div class="scroller-arrow scroller-arrow--left">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
              </div>
              <div class="scroller-arrow scroller-arrow--right">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
              </div>
              ${this.hasAttribute("show-scrollbar")?`
                <div class="scroll-indicator-container">
                    <div class="scroll-indicator"></div>
                </div>
            `:""}
          </div>
      `}calculateScrollbarDimensions(){const t=this.itemWidth*this.getItemCount()+this.gap*(this.getItemCount()-1),e=this.calculateVisibleWidth()-this.containerPadding*2,s=Math.min(e/t,1),i=this.shadowRoot.querySelector(".scroll-indicator-container"),n=i?i.offsetWidth:0,r=Math.max(s*n,20);return{ratio:s,trackWidth:n,indicatorWidth:r,contentWidth:t,containerWidth:e}}updateScrollbarWidth(){const t=this.shadowRoot.querySelector(".scroll-indicator");if(!t)return;const{indicatorWidth:e}=this.calculateScrollbarDimensions();t.style.width=`${e}px`}getItemCount(){const e=this.shadowRoot.querySelector("slot").assignedElements()[0];return e?e.children.length:0}setupScrollbarClick(){const t=this.shadowRoot.querySelector(".scroll-indicator-container");t&&t.addEventListener("click",e=>{if(e.target.classList.contains("scroll-indicator"))return;const s=t.getBoundingClientRect(),n=(e.clientX-s.left)/s.width;this.scrollToRatio(n)})}scrollToRatio(t){const e=this.getMaxScroll(),s=Math.round(t*e);this.scrollToIndex(s),this.updateScrollbarPosition()}updateScrollbarPosition(){const t=this.shadowRoot.querySelector(".scroll-indicator");if(!t)return;const{trackWidth:e}=this.calculateScrollbarDimensions(),s=this.getMaxScroll(),i=this.currentIndex/s*(e-t.offsetWidth);t.style.transform=`translateX(${i}px)`}setupScrollbarDrag(){const t=this.shadowRoot.querySelector(".scroll-indicator"),e=this.shadowRoot.querySelector(".scroll-indicator-container");if(this.shadowRoot.querySelector(".scroller-container"),!t||!e)return;let s=!1,i=0,n=0;const r=o=>{s=!0,i=o.type.includes("mouse")?o.clientX:o.touches[0].clientX,n=parseFloat(getComputedStyle(t).transform.split(",")[4])||0,t.style.transition="none",document.addEventListener("mousemove",l),document.addEventListener("mouseup",c),document.addEventListener("touchmove",l),document.addEventListener("touchend",c)},l=o=>{if(!s)return;o.preventDefault();const d=(o.type.includes("mouse")?o.clientX:o.touches[0].clientX)-i,{trackWidth:p}=this.calculateScrollbarDimensions(),h=p-t.offsetWidth;let m=Math.max(0,Math.min(h,n+d));t.style.transform=`translateX(${m}px)`;const f=m/h,v=this.getMaxScroll();this.currentIndex=Math.round(f*v),this.updateScroll(),this.updateArrowVisibility()},c=()=>{if(!s)return;s=!1,t.style.transition="transform 0.3s ease";const{trackWidth:o}=this.calculateScrollbarDimensions(),a=o-t.offsetWidth,p=(parseFloat(getComputedStyle(t).transform.split(",")[4])||0)/a,h=this.getMaxScroll();this.currentIndex=Math.round(p*h),this.updateScroll(),this.updateScrollbarPosition(),this.updateArrowVisibility(),document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",c),document.removeEventListener("touchmove",l),document.removeEventListener("touchend",c)};t.addEventListener("mousedown",r),t.addEventListener("touchstart",r)}}customElements.define("element-scroller",w);async function x(){const g=document.getElementById("featured-recipes-grid"),t=document.querySelector(".featured-recipes"),e=document.createElement("p");e.dir="rtl",e.style.fontSize="var(--size-header2)",t.insertBefore(e,g),e.innerHTML="טוען את המתכונים הכי חדשים...";const i=document.querySelector("element-scroller").querySelector('[slot="items"]');try{const n={where:[["approved","==",!0]]},r=await S.queryDocuments("recipes",n);if(!r.length){console.log("No matching documents."),e.innerHTML="לא נמצאו מתכונים מומלצים.";return}r.sort((o,a)=>{var h,m;const d=((h=o.creationTime)==null?void 0:h.seconds)||0;return(((m=a.creationTime)==null?void 0:m.seconds)||0)-d});const l=r.slice(0,3);e.remove(),l.forEach(o=>{const a=document.createElement("recipe-card");a.setAttribute("recipe-id",o.id),a.setAttribute("layout","vertical"),a.setAttribute("card-width","200px"),a.setAttribute("card-height","300px"),i.appendChild(a)}),g.addEventListener("recipe-card-open",o=>{const a=o.detail.recipeId;window.location.href=`/My-Cook-Book-Staging/pages/recipe-page.html?id=${a}`});const c=document.querySelector("element-scroller");c&&(c.setAttribute("item-width","200"),c.setAttribute("padding","20"),setTimeout(()=>{c.handleResize()},100))}catch(n){console.error("Error fetching featured recipes:",n),e.innerHTML="Error loading featured recipes. Please try again later."}}document.addEventListener("DOMContentLoaded",x);b(y);u(()=>import("./auth-controller-B2mcsM-8.js"),__vite__mapDeps([0,1,2]));u(()=>import("./auth-content-DLM3Yd_8.js"),[]);u(()=>import("./auth-avatar-BhsXcPk7.js"),__vite__mapDeps([3,1,2,4]));u(()=>import("./login-form-hXhtH-WN.js"),__vite__mapDeps([5,4,6,7]));u(()=>import("./signup-form-C5UqCACI.js"),__vite__mapDeps([8,4,6,7]));u(()=>import("./forgot-password-ka97TXr_.js"),__vite__mapDeps([9,4,6,7]));u(()=>import("./user-profile-Drzji1yT.js"),__vite__mapDeps([10,4,6,7,1,2]));
