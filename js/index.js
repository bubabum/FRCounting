"use strict"
import { readJsonFile } from "./import.js"
import { saveToFile } from "./export.js"
import { openPrintWindow } from "./print.js"
document.addEventListener("DOMContentLoaded", (async () => {
	let appData = {
		reports: [],
		investors: [
			{
				id: 1,
				percentage: 0.33,
				name: "Конаш А.",
			},
			{
				id: 2,
				percentage: 0.22,
				name: "Кислий І.",
			},
			{
				id: 3,
				percentage: 0.22,
				name: "Кислий А.",
			},
			{
				id: 4,
				percentage: 0.22,
				name: "Кислий М.",
			},
		],
		expensesCategories: [
			{
				id: 1,
				category: "Cировина і матеріали",
			},
			{
				id: 2,
				category: "Зарплата",
			},
			{
				id: 3,
				category: "Премія",
			},
			{
				id: 4,
				category: "Транспортні витрати",
			},
		],
		currentReport: {},
	}
	const importFromFile = async (file) => {
		appData = await readJsonFile(file);
		renderReports();
		updateCharts();
	}

	const investors = appData.investors;
	const expensesCategories = appData.expensesCategories;
	const expensesContainer = document.querySelector("#expenses");
	const reportInputs = [...document.querySelectorAll(".report-input")];
	const reportDateInput = document.querySelector("#reportDate");

	const formatToRender = num => num.toFixed(2) + " ₴";

	const openScreen = (btn) => {
		document.querySelectorAll(".content__screen").forEach(item => item.classList.remove("active"));
		document.querySelector(`#${btn.closest(".sidebar__btn").dataset.screen}`).classList.add("active");
		document.querySelectorAll(".sidebar__btn").forEach(item => item.classList.remove("active"));
		btn.closest(".sidebar__btn").classList.add("active");
	}

	const createReportHtml = report => {
		return `
		<tr>
			<td>${report.date}</td>
			<td>${formatToRender(report.mainIncome + report.subIncome)}</td>
			<td>${formatToRender(report.totalExpenses)}</td>
			<td>${formatToRender(report.grossProfit)}</td>
			<td class="reports__btns">
				<button data-id="${report.id}" class="report__open blue"><span class="material-icons-round">launch</span>Переглянути</button>
				<button data-id="${report.id}" class="report__delete red"><span class="material-icons-round">delete_outline</span></button>
			</td>
		</tr>
	`
	}

	const createSelectHtml = () => {
		return expensesCategories.map(item => `<option value="${item.id}">${item.category}</option>`).join('')
	}

	const createExpenseHtml = () => {
		return `
		<div class="expenses__item">
			<input class="expenses__date" type="date" name="date" value="${new Date().toISOString().split('T')[0]}">
			<input class="expenses__amount" type="number" value="0" min="0" name="amount">
			<select class="expenses__category" name="category">${createSelectHtml()}</select>
			<input class="expenses__note" type="text" name="note">
			<button class="expenses__delete red"><span class="material-icons-round">delete_outline</span></button>
		</div>
	`
	}

	const createDividentHtml = item => {
		return `
			<label for="">${item.name}</label>
			<div id="grossProfit" class="content__number">${item.amount} ₴</div>
		`
	}

	const addExpense = () => {
		expensesContainer.insertAdjacentHTML("beforeend", createExpenseHtml());
	}

	const removeExpense = (btn) => {
		btn.closest(".expenses__item").remove();
		updateReport();
	}

	const renderReports = () => {
		document.querySelector("#reports tbody").innerHTML = "";
		appData.reports.forEach(report => {
			document.querySelector("#reports tbody").insertAdjacentHTML("beforeend", createReportHtml(report));
		})
	}
	const removeReport = btn => {
		const id = btn.closest(".report__delete").dataset.id;
		appData.reports = appData.reports.filter(report => report.id !== id);
		btn.closest("tr").remove();
		if (id === appData.currentReport.id) closeReport();
	}

	const renderReport = report => {
		document.querySelector("#totalExpenses").textContent = formatToRender(report.totalExpenses);
		document.querySelector("#grossProfit").textContent = formatToRender(report.grossProfit);
		document.querySelector("#balance").textContent = formatToRender(report.balance);
		document.querySelector(".divivdents").innerHTML = "";
		report.dividents.forEach(item => {
			document.querySelector(".divivdents").insertAdjacentHTML("beforeend", createDividentHtml(item))
		});
		document.querySelector("#restBalance").textContent = formatToRender(report.restBalance);
	}

	const validateDividentsAmount = report => {
		if (report.dividentsAmount > report.balance) report.dividentsAmount = report.balance;
		if (report.dividentsAmount < 0) report.dividentsAmount = 0;
		document.querySelector("input[name='dividentsAmount']").value = report.dividentsAmount;
	}

	const calculateDividents = ({ dividentsAmount }) => {
		const dividents = investors.map(item => item).sort((a, b) => a.percentage - b.percentage);
		dividents.forEach((item, i, arr) => {
			if (dividentsAmount < 1000) return item.amount = 0;
			if (i === arr.length - 1) return item.amount = dividentsAmount - arr.filter(item => arr.indexOf(item) !== arr.length - 1).reduce((acc, cur) => acc + cur.amount, 0);
			item.amount = dividentsAmount * item.percentage + 100 - dividentsAmount * item.percentage % 100;
		});
		return dividents.sort((a, b) => a.id - b.id)
	}

	const getTotalExpenses = ({ expenses }) => {
		return expenses.map(item => item.amount).reduce((acc, cur) => acc + cur, 0);
	}

	const keepStringOrToNumber = (input) => {
		return input.type === 'number' ? Number(input.value) : input.value
	}

	const createExpense = elem => {
		return Object.fromEntries(Array.from(elem.querySelectorAll("input, select"), input => [input.name, keepStringOrToNumber(input)]))
	}

	const getReportExpensesData = () => {
		return Array.from(expensesContainer.children, item => createExpense(item));
	}

	const getReportInputData = () => {
		return Object.fromEntries(reportInputs.map(input => [input.name, Number(input.value)]))
	}

	const calculateReport = report => {
		report.totalExpenses = getTotalExpenses(report);
		report.grossProfit = report.mainIncome + report.subIncome - report.productionCosts - report.goodsCosts;
		report.balance = report.mainIncome + report.subIncome + report.initialBalance - report.totalExpenses;
		validateDividentsAmount(report);
		report.dividents = calculateDividents(report);
		report.restBalance = report.mainIncome + report.subIncome + report.initialBalance - report.totalExpenses - report.dividentsAmount;
		return report
	}

	const setDefaultReportDate = () => {
		document.querySelector("#reportDate").valueAsDate = new Date();
	}

	const createNewReport = () => {
		openScreen(document.querySelector("#openReport"));
		document.querySelector("#openReport").disabled = false;
		reportDateInput.disabled = false;
		setDefaultReportDate();
		const lastReport = appData.reports.slice(-1).pop();
		document.querySelector("input[name=initialBalance]").value = lastReport?.restBalance || 0;
		updateReport();
	}

	const renderExpense = expense => {
		const expenseElement = document.querySelector("#expenseTemplate").content.cloneNode(true);
		expenseElement.querySelector(".expenses__date").value = expense.data;
		expenseElement.querySelector(".expenses__amount").value = expense.amount;
		expenseElement.querySelector(".expenses__note").value = expense.note;
		console.log(expenseElement.querySelector(".expenses__date").value)
		return expenseElement
	}

	const renderExpenses = expenses => {
		expenses.forEach(expense => expensesContainer.insertAdjacentHTML("beforeend", createExpenseHtml(expense)))
	}

	const openReport = id => {
		const report = appData.reports.find(item => item.id === id);
		reportInputs.forEach(item => item.value = report[item.name]);
		reportDateInput.value = report.date;
		renderExpenses(report.expenses)

		// report.expenses.forEach(item => {
		// 	expensesContainer.insertAdjacentHTML("beforeend", `
		// 		<div class="expenses__item">
		// 			<input class="expenses__date" type="date" name="date" value="${item.date}">
		// 			<input class="expenses__amount" type="number" value="${item.amount}" min="0" name="amount">
		// 			<select class="expenses__category" name="category"></select>
		// 			<input class="expenses__note" type="text" name="note" value="${item.note}">
		// 			<button class="expenses__delete red"><span class="material-icons-round">delete_outline</span></button>
		// 		</div>
		// 		`);
		// });
		// [...document.querySelectorAll(".expenses .expenses__category")].forEach((item, index) => {
		// 	item.insertAdjacentHTML("beforeend", `
		// 		${expensesCategories.map((category, i) => `<option ${(Number(report.expenses[index].category) === category.id ? "selected" : "")} value="${category.id}">${category.category}</option>`).join('')}
		// 	`);
		// })

		document.querySelector("#openReport").disabled = false;
		reportDateInput.disabled = true;
		openScreen(document.querySelector("#openReport"));
		appData.currentReport = report;
		updateReport();
	}

	const closeReport = () => {
		openScreen(document.querySelector("#reportList"));
		document.querySelector("#openReport").disabled = true;
		reportInputs.forEach(input => input.value = input.defaultValue);
		expensesContainer.innerHTML = "";
		updateReport();
		appData.currentReport = {};
	}

	const saveReport = () => {
		const report = appData.currentReport;
		if (appData.reports.find(item => item.id !== report.id && item.date === report.date)) return alert("Звіт з такою датою вже існує")
		const oldReport = appData.reports.find(item => item.id === report.id);
		if (oldReport) {
			const oldReportIndex = appData.reports.indexOf(oldReport);
			appData.reports[oldReportIndex] = report;
		} else {
			report.id = crypto.randomUUID();
			appData.reports.push(report);
		}
		appData.reports.sort((a, b) => new Date(a.date) - new Date(b.date));
		renderReports();
	}

	const updateReport = () => {
		const epensesData = getReportExpensesData();
		const inputData = getReportInputData();
		appData.currentReport = calculateReport({ id: appData.currentReport.id, ...inputData, expenses: epensesData, date: reportDateInput.value });
		renderReport(appData.currentReport);
		updateCharts();
	}

	const updateCharts = () => {
		chart.data.labels = appData.reports.map(item => item.date);
		chart.data.datasets[0].data = appData.reports.map(item => item.grossProfit);
		chart.update();
	}

	const createChart = (redraw) => {
		const ctx = document.getElementById('myChart');
		const data = appData.reports.map(item => item.grossProfit)
		const labels = appData.reports.map(item => item.date)
		return new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [
					{
						label: 'прибуток',
						data: data,
						borderWidth: 1,
						backgroundColor: '#3498db',
					},
					{
						label: 'прибуток',
						data: appData.reports.map(item => item.totalExpenses),
						borderWidth: 1,
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

	const chart = createChart();
	// chart.destroy();


	[expensesContainer, ...reportInputs, reportDateInput].forEach(item => item.addEventListener("change", updateReport));
	document.querySelector(".add-expense").addEventListener("click", addExpense);
	document.querySelector(".expenses").addEventListener("click", (event) => {
		if (event.target.closest(".expenses__delete")) removeExpense(event.target);
	});
	document.querySelector('#printReport').addEventListener("click", () => openPrintWindow(appData));
	document.querySelector('#saveReport').addEventListener("click", saveReport);
	document.querySelector("#reports tbody").addEventListener("click", (event) => {
		if (event.target.closest(".report__open")) openReport(event.target.closest(".report__open").dataset.id);
		if (event.target.closest(".report__delete")) removeReport(event.target);
	})
	document.querySelector('#saveToFile').addEventListener("click", () => saveToFile(appData));
	document.querySelector('#importFromFile').addEventListener("click", async () => importFromFile(document.querySelector("#file").files[0]));
	document.querySelector("#createReport").addEventListener("click", createNewReport);
	document.querySelector("#closeReport").addEventListener("click", closeReport);
	document.querySelectorAll(".sidebar__btn").forEach(item => item.addEventListener("click", (event) => openScreen(event.target)));
})())
