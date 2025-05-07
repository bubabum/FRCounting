const getDataForCharts = (data, key) => {
	return data.map(item => item[key])
}

const createDateLabels = (data, key) => {
	return data.map(item => new Date(item[key]).toLocaleString('uk-UA', {
		month: 'long',
	}))
}

export const updateChart = ({ chart, data, dataKey, labelsKey }) => {
	chart.data.datasets[0].data = getDataForCharts(data, dataKey);
	chart.data.labels = createDateLabels(data, labelsKey);
	chart.update();
}

export const createChart = ({ elem, data, label, backgroundColor }) => {
	return new Chart(elem, {
		type: 'bar',
		data: {
			labels: createDateLabels(data, labelsKey),
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

export const createReportChart = ({ elem, data, dataKey, label, labelsKey, backgroundColor }) => {
	return new Chart(elem, {
		type: 'bar',
		data: {
			labels: createDateLabels(data, labelsKey),
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