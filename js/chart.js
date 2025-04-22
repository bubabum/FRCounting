const getDataForCharts = (data, key) => {
	return data.map(item => item[key])
}

export const updateChart = ({ chart, data, dataKey, labelsKey }) => {
	chart.data.datasets[0].data = getDataForCharts(data, dataKey);
	chart.data.labels = getDataForCharts(data, labelsKey);
	chart.update();
}

export const createChart = ({ elem, data, dataKey, label, labelsKey, backgroundColor }) => {
	return new Chart(elem, {
		type: 'bar',
		data: {
			labels: getDataForCharts(data, labelsKey),
			datasets: [
				{
					label: label,
					data: getDataForCharts(data, dataKey),
					borderWidth: 1,
					backgroundColor: backgroundColor,
				},
			]
		},
		options: {
			scales: {
				y: {
					beginAtZero: true
				}
			}
		}
	});
}