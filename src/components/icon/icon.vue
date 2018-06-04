<template>
    <i :class="classes" :style="styles" @click="handleClick" :title="title"></i>
</template>
<script>
    const prefixCls = 'ivu-icon';

    export default {
        name: 'Icon',
        props: {
            type: String,
            size: [Number, String],
            color: String,
			//添加提示 20170507
			title: String,
			//添加图标 20170507
			icon: String
        },
        computed: {
            classes () {
				if(this.icon){
					return `${this.icon}`;
				}
                return `${prefixCls} ${prefixCls}-${this.type}`;
            },
            styles () {
                let style = {};

                if (this.size) {
                    style['font-size'] = `${this.size}px`;
                }

                if (this.color) {
                    style.color = this.color;
                }

                return style;
            }
        },
        methods: {
            handleClick (event) {
                this.$emit('click', event);
            }
        }
    };
</script>
