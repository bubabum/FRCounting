const chartInstances = new Map();

export const renderChart = ({ type, ctx, data, options, id }) => {
	if (chartInstances.has(id)) {
		const chart = chartInstances.get(id);
		chart.data = data;
		chart.options = options || {};
		chart.update();
	} else {
		const chart = chartTypes[type](ctx, data, options);
		chartInstances.set(id, chart);
	}
};

export const createChart = (ctx, label, { data, labels, label }) => {
	return new Chart(ctx, {
		type: 'bar',
		data: {
			labels,
			datasets: [
				{
					label,
					data,
					borderWidth: 1,
					backgroundColor: backgroundColor,
				},
			]
		},
	})
}