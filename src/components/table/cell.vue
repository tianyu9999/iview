<template>
    <div :class="classes">
        <template v-if="renderType === 'index'">{{naturalIndex + 1}}</template>
        <template v-if="renderType === 'selection'">
            <Checkbox :value="checked" @click.native.stop="handleClick" @on-change="toggleSelect" :disabled="disabled"></Checkbox>
        </template>
	 <template v-if="renderType === 'html'"><span v-html="row.item[column.key]"></span></template>
        <template v-if="renderType === 'normal'"><span v-html="column.format?column.format(row.item,row.item[column.key]):row.item[column.key]"></span></template>
        <template v-if="renderType === 'expand' && !row._disableExpand">
            <div :class="expandCls" @click="toggleExpand">
                <Icon type="ios-arrow-right"></Icon>
            </div>
        </template>
		<template v-if="renderType === 'radio'">
				<radio v-model="radioCheck" @on-change="singleSelect" :disabled="disabled"></radio>
		</template>
		<template v-if="renderType === 'editRender' || renderType==='edit'"><span ref="renderContainer"></span></template>	
        <Cell
            v-if="renderType === 'render'"
            :row="row"
            :column="column"
            :index="index"
            :render="column.render"></Cell>
    </div>
</template>
<script>
     import Vue from 'vue';
    import Cell from './expand';
    import Icon from '../icon/icon.vue';
    import Checkbox from '../checkbox/checkbox.vue';
	import clickoutside from '../../directives/clickoutside';
    import { findComponentUpward } from '../../utils/assist';

    export default {
        name: 'TableCell',
        components: { Icon, Checkbox, Cell },
		directives: { clickoutside },
        props: {
            prefixCls: String,
            row: Object,
            column: Object,
            naturalIndex: Number,    // index of rebuildData
            index: Number,           // _index of data
            checked: Boolean,
            disabled: Boolean,
            expanded: Boolean,
            fixed: {
                type: [Boolean, String],
                default: false
            }
        },
        data () {
            return {
                renderType: '',
                uid: -1,
                context: this.$parent.$parent.$parent.currentContext,
				oldRenderType:null,
				renderCell:null,
				editCell:null,
				radioCheck:false
            };
        },
        computed: {
            classes () {
                return [
                    `${this.prefixCls}-cell`,
                    {
                        [`${this.prefixCls}-hidden`]: !this.fixed && this.column.fixed && (this.column.fixed === 'left' || this.column.fixed === 'right'),
                        [`${this.prefixCls}-cell-ellipsis`]: this.column.ellipsis || false,
                        [`${this.prefixCls}-cell-with-expand`]: this.renderType === 'expand'
                    }
                ];
            },
            expandCls () {
                return [
                    `${this.prefixCls}-cell-expand`,
                    {
                        [`${this.prefixCls}-cell-expand-expanded`]: this.expanded
                    }
                ];
            }
        },
        methods: {
		    destroy () {
				if(this.renderCell){
					this.renderCell.$destroy();
					this.renderCell=null;
				}
				if(this.editCell){
					this.editCell.$destroy();
					this.editCell=null;
				}
            },
            toggleSelect () {
                this.$parent.$parent.$parent.toggleSelect(this.index);
            },
            toggleExpand () {
                this.$parent.$parent.$parent.toggleExpand(this.index);
            },
            handleClick () {
                // 放置 Checkbox 冒泡
            },
			singleSelect () {
				 this.$parent.$parent.$parent.singleSelect(this.index);
			},
			cellClickHandel(){
				if(this.renderType === 'edit'){
					return;
				}
				if(this.column.editRender){
					this.oldRenderType = this.renderType;
					this.renderType = 'edit';
					this.$nextTick(()=>{
						if(this.renderCell){
							this.$refs.renderContainer.innerHTML = '';
						}
						if(this.editCell){
							this.$refs.renderContainer.appendChild(this.editCell.$el);
						}else{
							const component = new Vue({
								functional: true,
								template:this.column.editRender(this.row.item, this.column)					
							});
							component.row = this.row.item;
							component.column = this.column;
							this.editCell = component.$mount();
							this.$refs.renderContainer.appendChild(this.editCell.$el);
						}
						if(this.editCell._vnode.componentInstance && this.editCell._vnode.componentInstance.focus){
							const g=this;
							this.$nextTick(()=>{
								g.editCell._vnode.componentInstance.focus();
								
							});
						}		
					});
				}
			},
			handleHide(){
				if(this.$refs.renderContainer && this.editCell && this.oldRenderType && this.renderType === 'edit'){
					this.renderType = this.oldRenderType;
					this.oldRenderType = null;
					if(this.editCell){
						this.$refs.renderContainer.innerHTML = '';
					}
					if(this.renderCell){						
						this.$refs.renderContainer.appendChild(this.renderCell);
					}
				}
			}
        },
        created () {
            if (this.column.type === 'index') {
                this.renderType = 'index';
            } else if (this.column.type === 'selection') {
                this.renderType = 'selection';
            }else if (this.column.type === 'html') {
                this.renderType = 'html';
            } else if (this.column.type === 'expand') {
                this.renderType = 'expand';
            } else if (this.column.type==='render') {
                this.renderType = 'render';
            }else if(this.column.type === 'radio'){
				this.renderType = 'radio';
			}else if(this.column.type==='editRender'){
				this.renderType = 'editRender';
			} else {
                this.renderType = 'normal';
            }
        },
		beforeDestroy () {
            this.destroy();
        },
		watch: {
			checked (val) {
				this.radioCheck = val;
			}
        }
    };
</script>
