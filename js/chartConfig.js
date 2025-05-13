export const charts = [
	{
		elem: '#byIndicatorChart',
		dataBuilder: ({ reports, year, indicator }) => {
			const labels = {
				dividentsAmount: "Дивіденти",
				mainIncome: "Дохід",
				totalExpenses: "Витрати",
			}
			const chartData = reports.filter(item => item.date.split('-')[0] === year);
			return {
				labels: chartData.map(item => new Date(item.date).toLocaleString('uk-UA', {
					month: 'long',
				})),
				datasets: [{
					label: labels[indicator],
					data: chartData.map(item => item[indicator]),
					borderWidth: 1,
					backgroundColor: "#71C9CE",
				}]
			}
		}
	},
	{
		elem: '#dividentsAmountByYearChart',
		dataBuilder: ({ reports }) => {
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
					backgroundColor: "#34797D",
				}]
			}
		}
	},
]