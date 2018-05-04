<style>
  .ivu-table .demo-table-info-cell-age {
        background-color: #2db7f5;
        color: #fff;
  }
  .ivu-table .demo-table-info-cell-name {
        background-color: #ff6600;
        color: #fff;
    }
</style>
<template>
    <div>
        <Table border :columns="columns7" :data="data6"></Table>
        <Button @click="handleAdd"> + 1</Button>
    </div>
</template>
<script>
    import abc from '../components/test.vue';
    export default {
        components: { abc },
        data () {
            return {
                data1: 1,
//                self: this,
                columns7: [{key:'radio',type:'radio'},
                    {
                        title: '姓名',
                        key: 'name',
//                        render (row, column, index) {
//                            return `<abc></abc>`;
//                        }
                        render: (h, row, column, index) => {
                            return h('div', [
                                h('Button',{
                                    on: {
                                        click: this.handleClick
                                    }
                                }, 'hello')
                            ])
                        }
                    },
                    {
                        title: '年龄',
                        key: 'age',
						editRender:function(row,index){
							return '<input-number v-model="row.age" ref="input" :min="1" :max="150"></input-number>';
						}
                    },
                    {
                        title: '地址',
                        key: 'address',
						editRender:function(row,index){
							return '<i-input v-model="row.address"></i-input>';
						}
                    },
                    {
                        title: '操作',
                        key: 'action',
                        width: 150,
                        align: 'center',
                        render (row, column, index) {
                            return `<i-button type="primary" size="small" @click="show(${index})">查看</i-button> <i-button type="error" size="small" @click="remove(${index})">删除</i-button>`;
                        }
                    }
                ],
                data6: [
                    {
                        name: '王小明',
                        age: 18,
                        address: '北京市朝阳区芍药居'
                    },
                    {
                        name: '张小刚',
                        age: 25,
                        address: '北京市海淀区西二旗'
                    },
                    {
                        name: '李小红',
                        age: 30,
                        address: '上海市浦东新区世纪大道',
						cellClassName: {
                            name: 'demo-table-info-cell-name'
                        }
                    },
                    {
                        name: '周小伟',
                        age: 26,
                        address: '深圳市南山区深南大道',
						cellClassName: {
                            age: 'demo-table-info-cell-age'
                        }
                    }
                ]
            }
        },
        computed: {
            ttt () {
                return this.data1 + 1;
            }
        },
        methods: {
            show (index) {
                this.$Modal.info({
                    title: '用户信息',
                    content: `姓名：${this.data6[index].name}<br>年龄：${this.data6[index].age}<br>地址：${this.data6[index].address}`
                })
            },
            remove (index) {
                this.data6.splice(index, 1);
            },
            handleAdd () {
                this.data1++;
				this.data6.push({name:'111',age:0,address:null});
            },
            handleClick () {
                this.$Message.info('111')
            }
        }
    }
</script>
