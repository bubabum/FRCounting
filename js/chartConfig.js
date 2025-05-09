export const chartsTest = [
	{
		elem: '#dividentsAmountChartTest',
		// label: 'Дивіденти',
		// backgroundColor: '#71C9CE',
		dataBuilder: (reports) => {
			return {
				labels: reports.map(item => new Date(item.date).toLocaleString('uk-UA', {
					month: 'long',
				})),
				datasets: [{
					label: "Дивіденти",
					data: reports.map(item => item.dividentsAmount),
					borderWidth: 1,
					backgroundColor: "#71C9CE",
				}]
			}
		}
	},
	{
		elem: '#dividentsAmountByYearChart',
		// label: 'Дивіденти',
		// backgroundColor: '#71C9CE',
		dataBuilder: (reports) => {
			const data = reports.reduce((acc, { date, dividentsAmount }) => {
				const year = date.split('-')[0];
				acc[year] = (acc[year] || 0) + dividentsAmount;
				return acc;
			}, {})
			return {
				labels: Object.keys(data),
				datasets: [{
					label: "Дивіденти",
					data: Object.values(data),
					borderWidth: 1,
					backgroundColor: "#71C9CE",
				}]
			}
		}
	},
]
// export const dividentsAmountChart = {
// 	elem: '#dividentsAmountChartTest',
// 	// label: 'Дивіденти',
// 	// backgroundColor: '#71C9CE',
// 	dataBuilder: (reports) => {
// 		return {
// 			labels: reports.map(item => new Date(item.date).toLocaleString('uk-UA', {
// 				month: 'long',
// 			})),
// 			datasets: [{
// 				label: "Дивіденти",
// 				data: reports.map(item => item.dividentsAmount),
// 				borderWidth: 1,
// 				backgroundColor: "#71C9CE",
// 			}]
// 		}
// 	},
// }
// export const dividentsAmountByYearChart = {
// 	elem: '#dividentsAmountByYearChart',
// 	// label: 'Дивіденти',
// 	// backgroundColor: '#71C9CE',
// 	dataBuilder: (reports) => {
// 		const data = reports.reduce((acc, { date, dividentsAmount }) => {
// 			const year = date.split('-')[0];
// 			acc[year] = (acc[year] || 0) + dividentsAmount;
// 			return acc;
// 		}, {})
// 		return {
// 			labels: Object.keys(data),
// 			datasets: [{
// 				label: "Дивіденти",
// 				data: Object.values(data),
// 				borderWidth: 1,
// 				backgroundColor: "#71C9CE",
// 			}]
// 		}
// 	}
// }