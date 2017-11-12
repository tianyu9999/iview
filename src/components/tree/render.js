export default {
    name: 'RenderCell',
    functional: true,
    props: {
        render: Function,
        data: Object,
        node: Array
    },
    render: (h, ctx) => {
        const params = {
            root: ctx.props.node[1],
            node: ctx.props.node[2],
            data: ctx.props.data,
			$node:ctx.props.node[0]
        };
        return ctx.props.render(h, params);
    }
};