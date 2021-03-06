<template>
    <div :class="classes">
        <div :class="[prefixCls + '-bar']">
           <div :class="[prefixCls + '-nav-right']" v-if="showSlot"><slot name="extra"></slot></div>            
	   <div 
	        :class="[prefixCls + '-nav-container']"
		tabindex="0"
                ref="navContainer"
                @keydown="handleTabKeyNavigation"
                @keydown.space.prevent="handleTabKeyboardSelect(false)"
	   >
                 <div ref="navWrap" :class="[prefixCls + '-nav-wrap', scrollable ? prefixCls + '-nav-scrollable' : '']" >
		    <span :class="[prefixCls + '-nav-prev', scrollable ? '' : prefixCls + '-nav-scroll-disabled']" @click="scrollPrev"><Icon type="chevron-left"></Icon></span>
                    <span :class="[prefixCls + '-nav-next', scrollable ? '' : prefixCls + '-nav-scroll-disabled']" @click="scrollNext"><Icon type="chevron-right"></Icon></span>
					<div ref="navScroll" :class="[prefixCls + '-nav-scroll']">
						<div ref="nav" :class="[prefixCls + '-nav']" class="nav-text"  :style="navStyle">
							<div :class="barClasses" :style="barStyle"></div>
							<div :class="tabCls(item)" v-for="(item, index) in navList" @click="handleChange(index)" @contextmenu="stopRight($event)"  @mousedown="showMenu($event,item,index)">
								<Icon v-if="(item.img !== '' || item.icon!=='')" :icon="item.img" :type="item.icon"></Icon>
								<Render v-if="item.labelType === 'function'" :render="item.label"></Render>
								<template v-else>{{ item.label }}</template>
								<Icon v-if="showClose(item)" type="ios-close-empty" @click.native.stop="handleRemove(index)"></Icon>
							</div>
						</div>
					</div>						
                </div>
            </div>
        </div>
        <div :class="contentClasses" :style="contentStyle" ref="panes"><slot></slot></div>
		<div v-if="showRightMenu" ref="rightMenu"  :style="{top:rightPosition.y+'px',left:rightPosition.x+'px',position:'absolute'}" v-clickoutside="handleHide">
			<Menu  mode="vertical" @on-select="menuSelect" width="140">
				<Menu-item name="closeother">
					关闭其它页
				</Menu-item>
				<Menu-item name="closeall">
					关闭所有页
				</Menu-item>
			</Menu>
		</div>
    </div>
</template>
<script>
    import Icon from '../icon/icon.vue';
    import Render from '../base/render';
    import { oneOf, MutationObserver,isIE,ieVersion} from '../../utils/assist';
    import Emitter from '../../mixins/emitter';
	import clickoutside from '../../directives/clickoutside';
	import elementResizeDetectorMaker from 'element-resize-detector';

    const prefixCls = 'ivu-tabs';
    const transitionTime = 300; // from CSS

    const getNextTab = (list, activeKey, direction, countDisabledAlso) => {
        const currentIndex = list.findIndex(tab => tab.name === activeKey);
        const nextIndex = (currentIndex + direction + list.length) % list.length;
        const nextTab = list[nextIndex];
        if (nextTab.disabled) return getNextTab(list, nextTab.name, direction, countDisabledAlso);
        else return nextTab;
    };

    const focusFirst = (element, root) => {
        try {element.focus();}
        catch(err) {} // eslint-disable-line no-empty

        if (document.activeElement == element && element !== root) return true;

        const candidates = element.children;
        for (let candidate of candidates) {
            if (focusFirst(candidate, root)) return true;
        }
        return false;
    };

    export default {
        name: 'Tabs',
        mixins: [ Emitter ],
        components: { Icon, Render  },
		directives: { clickoutside },
        props: {
            value: {
                type: [String, Number]
            },
            type: {
                validator (value) {
                    return oneOf(value, ['line', 'card']);
                },
                default: 'line'
            },
            size: {
                validator (value) {
                    return oneOf(value, ['small', 'default']);
                },
                default: 'default'
            },
            animated: {
                type: Boolean,
                default: true
            },
            captureFocus: {
                type: Boolean,
                default: false
            },
            closable: {
                type: Boolean,
                default: false
            }
        },
        data () {
            return {
                prefixCls: prefixCls,
                navList: [],
                barWidth: 0,
                barOffset: 0,
                activeKey: this.value,
                focusedKey: this.value,
                showSlot: false,
		navStyle: {
                    transform: ''
                },
				showRightMenu:false,
				rightTab:null,
				rightPosition:{},
				rightTarget:null,
				scrollable: false,
				transitioning: false
            };
        },
        computed: {
            classes () {
                return [
                    `${prefixCls}`,
                    {
                        [`${prefixCls}-card`]: this.type === 'card',
                        [`${prefixCls}-mini`]: this.size === 'small' && this.type === 'line',
                        [`${prefixCls}-no-animation`]: !this.animated
                    }
                ];
            },
            contentClasses () {
                return [
                    `${prefixCls}-content`,
                    {
                        [`${prefixCls}-content-animated`]: this.animated
                    }
                ];
            },
            barClasses () {
                return [
                    `${prefixCls}-ink-bar`,
                    {
                        [`${prefixCls}-ink-bar-animated`]: this.animated
                    }
                ];
            },
            contentStyle () {
                const x = this.getTabIndex(this.activeKey);
                const p = x === 0 ? '0%' : `-${x}00%`;

                let style = {};
                if (x > -1) {
                    style = {
                        transform: `translateX(${p}) translateZ(0px)`
                    };
                }
                return style;
            },
            barStyle () {
                let style = {
                    visibility: 'hidden',
                    width: `${this.barWidth}px`
                };
                if(isIE() && ieVersion()<=11){
                    this.animated = false;
                }
                if (this.type === 'line') style.visibility = 'visible';
                if (this.animated) {
                    style.transform = `translate3d(${this.barOffset}px, 0px, 0px)`;
                } else {
                    style.left = `${this.barOffset}px`;
                }

                return style;
            }
        },
        methods: {
            getTabs () {
                return this.$children.filter(item => item.$options.name === 'TabPane');
            },
            updateNav () {
                this.navList = [];
                this.getTabs().forEach((pane, index) => {
                    this.navList.push({
                        labelType: typeof pane.label,
                        label: pane.label,
                        icon: pane.icon || '',
                        name: pane.currentName || index,
                        disabled: pane.disabled,
                        closable: pane.closable
                    });
                    if (!pane.currentName) pane.currentName = index;
                    if (index === 0) {
                        if (!this.activeKey) this.activeKey = pane.currentName || index;
                    }
                });
                this.updateStatus();
                this.updateBar();
            },
            updateBar () {
                this.$nextTick(() => {
                    const index = this.getTabIndex(this.activeKey);
                    if (!this.$refs.nav) return;  // 页面销毁时，这里会报错，为了解决 #2100
                    const prevTabs = this.$refs.nav.querySelectorAll(`.${prefixCls}-tab`);
                    const tab = prevTabs[index];
                    this.barWidth = tab ? parseFloat(tab.offsetWidth) : 0;

                    if (index > 0) {
                        let offset = 0;
                        const gutter = this.size === 'small' ? 0 : 16;
                        for (let i = 0; i < index; i++) {
                            offset += parseFloat(prevTabs[i].offsetWidth) + gutter;
                        }

                        this.barOffset = offset;
                    } else {
                        this.barOffset = 0;
                    }
                    this.updateNavScroll();
                });
            },
            updateStatus () {
                const tabs = this.getTabs();
                tabs.forEach(tab => tab.show = (tab.currentName === this.activeKey) || this.animated);
            },
            tabCls (item) {
                return [
                    `${prefixCls}-tab`,
                    {
                        [`${prefixCls}-tab-disabled`]: item.disabled,
                        [`${prefixCls}-tab-active`]: item.name === this.activeKey,
                        [`${prefixCls}-tab-focused`]: item.name === this.focusedKey,
                    }
                ];
            },
            handleChange (index) {
                if (this.transitioning) return;

                this.transitioning = true;
                setTimeout(() => this.transitioning = false, transitionTime);

                const nav = this.navList[index];
                if (nav.disabled) return;
                this.activeKey = nav.name;
                this.$emit('input', nav.name);
                this.$emit('on-click', nav.name);
            },
            handleTabKeyNavigation(e){
                if (e.keyCode !== 37 && e.keyCode !== 39) return;
                const direction = e.keyCode === 39 ? 1 : -1;
                const nextTab = getNextTab(this.navList, this.focusedKey, direction);
                this.focusedKey = nextTab.name;
            },
            handleTabKeyboardSelect(init = false){
                if (init) return;
                const focused = this.focusedKey || 0;
                const index = this.getTabIndex(focused);
                this.handleChange(index);
            },
            handleRemove (index) {
                const tabs = this.getTabs();
                const tab = tabs[index];
                tab.$destroy();

                if (tab.currentName === this.activeKey) {
                    const newTabs = this.getTabs();
                    let activeKey = -1;

                    if (newTabs.length) {
                        const leftNoDisabledTabs = tabs.filter((item, itemIndex) => !item.disabled && itemIndex < index);
                        const rightNoDisabledTabs = tabs.filter((item, itemIndex) => !item.disabled && itemIndex > index);

                        if (rightNoDisabledTabs.length) {
                            activeKey = rightNoDisabledTabs[0].currentName;
                        } else if (leftNoDisabledTabs.length) {
                            activeKey = leftNoDisabledTabs[leftNoDisabledTabs.length - 1].currentName;
                        } else {
                            activeKey = newTabs[0].currentName;
                        }
                    }
                    this.activeKey = activeKey;
                    this.$emit('input', activeKey);
                }
                this.$emit('on-tab-remove', tab.currentName);
                this.updateNav();
            },
            showClose (item) {
                if (this.type === 'card') {
                    if (item.closable !== null) {
                        return item.closable;
                    } else {
                        return this.closable;
                    }
                } else {
                    return false;
                }
            },
			scrollPrev() {
				const navWidth = this.$refs.nav.offsetWidth;
                const containerWidth = this.$refs.navScroll.offsetWidth;
                const currentOffset = this.getCurrentScrollOffset();

                if (navWidth-containerWidth-currentOffset<=0) return;

				let w=navWidth-containerWidth-currentOffset;
                let newOffset = w-80>0?currentOffset+80:currentOffset+w;

                this.setOffset(newOffset);
            },
			scrollNext() {
                const navWidth = this.$refs.nav.offsetWidth;
                const containerWidth = this.$refs.navScroll.offsetWidth;
                const currentOffset = this.getCurrentScrollOffset();
                if (currentOffset<=0) return;

                let newOffset = currentOffset-80>0?currentOffset-80:0;

                this.setOffset(newOffset);
            },
            getCurrentScrollOffset() {
                const { navStyle } = this;
                return navStyle.transform
                    ? Number(navStyle.transform.match(/translateX\(-(\d+(\.\d+)*)px\)/)[1])
                    : 0;
            },
            getTabIndex(name){
                return this.navList.findIndex(nav => nav.name === name);
            },
            setOffset(value) {
                this.navStyle.transform = `translateX(-${value}px)`;
            },
            scrollToActiveTab() {
                if (!this.scrollable) return;
                const nav = this.$refs.nav;
                const activeTab = this.$el.querySelector(`.${prefixCls}-tab-active`);
                if(!activeTab) return;

                const navScroll = this.$refs.navScroll;
                const activeTabBounding = activeTab.getBoundingClientRect();
                const navScrollBounding = navScroll.getBoundingClientRect();
                const navBounding = nav.getBoundingClientRect();
                const currentOffset = this.getCurrentScrollOffset();
                let newOffset = currentOffset;

                if (navBounding.right < navScrollBounding.right) {
                    newOffset = nav.offsetWidth - navScrollBounding.width;
                }

                if (activeTabBounding.left < navScrollBounding.left) {
                    newOffset = currentOffset - (navScrollBounding.left - activeTabBounding.left);
                }else if (activeTabBounding.right > navScrollBounding.right) {
                    newOffset = currentOffset + activeTabBounding.right - navScrollBounding.right;
                }

                if(currentOffset !== newOffset){
                    this.setOffset(Math.max(newOffset, 0));
                }
            },
            updateNavScroll(){
                const navWidth = this.$refs.nav.offsetWidth;
                const containerWidth = this.$refs.navScroll.offsetWidth;
                const currentOffset = this.getCurrentScrollOffset();
                if (containerWidth < navWidth) {
                    this.scrollable = true;
                    if (navWidth - currentOffset < containerWidth) {
                        this.setOffset(navWidth - containerWidth);
                    }
                } else {
                    this.scrollable = false;
                    if (currentOffset > 0) {
                        this.setOffset(0);
                    }
                }
            },
            handleResize(){
                this.updateNavScroll();
            },
			stopRight (evt){
				if(window.event){
					window.event.returnvalue=false;
				}
				evt.preventDefault();
				return false;
			},
			showMenu(evt,item,index){
				if(evt.button==2){
					this.rightTab=null;
					if(this.showClose(item)){
						this.stopRight(evt);
						this.rightTab=item;
						this.rightTarget=evt.target;
						
						const p={x:this.rightTarget.offsetLeft+evt.offsetX+5,y:evt.offsetY+2};
						
						this.rightPosition=p;
						this.showRightMenu=true;
						return false;
					}
				}
			},
			handleHide(e){
				if(this.showRightMenu && e.target!=this.rightTarget){
					this.rightTab=null;
					this.rightPosition={};
					this.rightTarget=null;
					this.showRightMenu=false;
				}
			},
			menuSelect(menuName){
				var nvs=this.navList;
				for(var i=0;i<nvs.length;i++){
					const itm=nvs[i];
					if(this.rightTab===itm){
						if(menuName==='closeall' && this.closable && (itm.closable==null || (itm.closable!=null && itm.closable))){
							this.handleRemove(i);
							i=0;
							nvs=this.navList;
							continue;
						}
					}else{
						if(this.closable && (itm.closable==null || (itm.closable!=null && itm.closable))){
							this.handleRemove(i);
							i=0;
							nvs=this.navList;	
						}
					}								
				}
				this.rightTab=null;
				this.rightTarget=null;
				this.rightPosition={};
				this.showRightMenu=false;
			},
	   isInsideHiddenElement () {
                let parentNode = this.$el.parentNode;
                while(parentNode && parentNode !== document.body) {
                    if (parentNode.style && parentNode.style.display === 'none') {
                        return parentNode;
                    }
                    parentNode = parentNode.parentNode;
                }
                return false;
            },
            updateVisibility(index){
                [...this.$refs.panes.children].forEach((el, i) => {
                    if (index === i) {
                        [...el.children].forEach(child => child.style.visibility = 'visible');
                        if (this.captureFocus) setTimeout(() => focusFirst(el, el), transitionTime);
                    } else {
                        setTimeout(() => {
                            [...el.children].forEach(child => child.style.visibility = 'hidden');
                        }, transitionTime);
                    }
                });
            }
        },
        watch: {
            value (val) {
                this.activeKey = val;
                this.focusedKey = val;
            },
            activeKey (val) {
                this.focusedKey = val;
                this.updateBar();
                this.updateStatus();
                this.broadcast('Table', 'on-visible-change', true);
                this.$nextTick(() => {
                    this.scrollToActiveTab();
                });

                // update visibility
                const nextIndex = Math.max(this.getTabIndex(this.focusedKey), 0);
                this.updateVisibility(nextIndex);
            }
        },
        mounted () {
            this.showSlot = this.$slots.extra !== undefined;
            this.observer = elementResizeDetectorMaker();
            this.observer.listenTo(this.$refs.navWrap, this.handleResize);

            const hiddenParentNode = this.isInsideHiddenElement();
            if (hiddenParentNode) {
                this.mutationObserver = new MutationObserver(() => {
                    if (hiddenParentNode.style.display !== 'none') {
                        this.updateBar();
                        this.mutationObserver.disconnect();
                    }
                });

                this.mutationObserver.observe(hiddenParentNode, { attributes: true, childList: true, characterData: true, attributeFilter: ['style'] });
            }

            this.handleTabKeyboardSelect(true);
            this.updateVisibility(this.getTabIndex(this.activeKey));
        },
        beforeDestroy() {
            this.observer.removeListener(this.$refs.navWrap, this.handleResize);
            if (this.mutationObserver) this.mutationObserver.disconnect();
        }
    };
</script>
