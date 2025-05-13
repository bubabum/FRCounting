const chartInstances = new Map();

export const renderChart = ({ id, ctx, data }) => {
	if (chartInstances.has(id)) {
		const chart = chartInstances.get(id);
		chart.data = data;
		chart.update();
	} else {
		const chart = createChart(ctx, data);
		chartInstances.set(id, chart);
	}
};

export const createChart = (ctx, data) => {
	return new Chart(ctx, {
		type: 'bar',
		data,
	})
}