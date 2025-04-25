"use strict"
import { readJsonFile } from "./import.js"
import { saveToFile } from "./export.js"
import { openPrintWindow } from "./print.js"
import { createChart, updateChart } from "./chart.js"
import { initAuthListener, login, logout } from "./auth.js"
import { loadData, saveData } from "./db.js"

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
		expenseCategories: [],
	}


	const authentication = async () => {
		const email = document.querySelector("#email").value;
		const password = document.querySelector("#password").value;
		document.querySelector(".login").classList.add("loading")
		try {
			await login(email, password);
			initAuthListener(showApp, hideApp);
			// saveData("appData", appData)
			appData = await loadData("appData");
			console.log(appData)
			renderApp();
		} catch (error) {
			alert("Помилка входу: " + error)
		} finally {
			document.querySelector(".login").classList.remove("loading")
		}
	}

	const showApp = () => {
		document.querySelectorAll(".login, .sidebar, .content").forEach(item => item.classList.add("logged"));
	}

	const hideApp = () => {
		document.querySelectorAll(".login, .sidebar, .content").forEach(item => item.classList.remove("logged"));
	}

	const renderApp = () => {
		renderReports();
		renderExpenseCategories();
		renderChartYears();
		changeCurrentChartYear();
		updateCharts();
	}

	const importFromFile = async (file) => {
		appData = await readJsonFile(file);
		renderApp();
	}

	let currentReport = {};
	let currentChartYear = '';
	const expensesContainer = document.querySelector("#expenses");
	const reportInputs = [...document.querySelectorAll(".report-input")];
	const reportDateInput = document.querySelector("#reportDate");
	const openReportBtn = document.querySelector("#openReportBtn");

	const formatToRender = num => num.toFixed(2) + " ₴";

	const openScreen = (btn) => {
		document.querySelectorAll(".content__screen").forEach(item => item.classList.remove("active"));
		document.querySelector(`#${btn.closest(".sidebar__btn").dataset.screen}`).classList.add("active");
		document.querySelectorAll(".sidebar__btn").forEach(item => item.classList.remove("active"));
		btn.closest(".sidebar__btn").classList.add("active");
	}

	const createReportHtml = report => {
		return `
		<div class="reports__item">
			<div>${report.date}</div>
			<div>${formatToRender(report.mainIncome + report.subIncome)}</div>
			<div>${formatToRender(report.totalExpenses)}</div>
			<div>${formatToRender(report.grossProfit)}</div>
			<div class="reports__btns">
				<button data-id="${report.id}" class="report__open blue"><span class="material-icons-round">launch</span>Переглянути</button>
				<button data-id="${report.id}" class="report__delete red"><span class="material-icons-round">delete_outline</span></button>
			</div>
		</div>
	`
	}

	//make css
	const createExpenseCategoryHtml = category => {
		return `
			<div data-id="${category.id}" class="category__item">
				<input type="text" name="note" value="${category.category}">
				<button class="category__save blue"><span class="material-icons-round">edit</span></button>
				<button class="category__delete red"><span class="material-icons-round">delete_outline</span></button>
			</div>
		`
	}

	const createSelectHtml = () => {
		return appData.expenseCategories.map(item => `<option value="${item.id}">${item.category}</option>`).join('')
	}

	const createExpenseInputHtml = () => {
		return `
			<div class="expenses__item">
				<input class="expenses__date" type="date" name="date" value="${new Date().toISOString().split('T')[0]}">
				<input class="expenses__amount" type="number" value="0" min="0" name="amount">
				<select class="expenses__category" name="category">${createSelectHtml()}</select>
				<input class="expenses__note" type="text" name="note" value="">
				<button class="expenses__delete red"><span class="material-icons-round">delete_outline</span></button>
			</div>
		`
	}

	const createExpenseHtml = (expense, expenseCategories) => {
		return `
			<div class="expenses__item expenses__item_grid">
				<div class="expenses__date">${expense.date}</div>
				<div class="expenses__amount">${formatToRender(expense.amount)}</div>
				<div class="expenses__category">${expenseCategories.find(item => item.id === Number(expense.category)).category}</div>
				<div class="expenses__note">${expense.note}</div>
			</div>
		`
	}

	const createDividentHtml = item => {
		return `
			<div class="content__label">${item.name}</div>
			<div id="grossProfit" class="content__number">${item.amount} ₴</div>
		`
	}

	const createChartYearHtml = item => {
		return `
			<option value="${item}">${item}</option>
		`
	}

	const addExpense = () => {
		expensesContainer.insertAdjacentHTML("beforeend", createExpenseInputHtml());
	}

	const removeExpense = (btn) => {
		btn.closest(".expenses__item").remove();
		updateReport();
	}

	const renderReports = () => {
		document.querySelector("#reportsContainer").innerHTML = appData.reports.map(item => item).sort((a, b) => new Date(b.date) - new Date(a.date)).map(createReportHtml).join('');
	}

	const renderExpenseCategories = () => {
		document.querySelector("#expenseCategories").innerHTML = appData.expenseCategories.map(createExpenseCategoryHtml).join('')
	}

	const addExpenseCategory = () => {
		const id = appData.expenseCategories.map(item => item.id).sort().pop() + 1 || 1;
		const category = document.querySelector("#newExpenseCategory").value;
		if (category.length === 0) return alert("Назва не заповнена")
		appData.expenseCategories.push({ id, category });
		saveData("appData", appData);
		renderExpenseCategories();
		document.querySelector("#newExpenseCategory").value = "";
	}

	const changeExpenseCategory = (id, value) => {
		appData.expenseCategories.find(item => item.id === Number(id)).category = value;
		saveData("appData", appData);
	}

	const removeExpenseCategory = (id) => {
		appData.expenseCategories = appData.expenseCategories.filter(item => item.id !== Number(id));
		saveData("appData", appData);
		renderExpenseCategories();
	}

	const renderReportInputs = report => {
		reportInputs.forEach(item => item.value = report[item.name]);
		reportDateInput.value = report.date;
		expensesContainer.innerHTML = report.expenses.map(item => createExpenseHtml(item, report.expenseCategories)).join('');
	}

	const renderReportCalculations = report => {
		document.querySelector("#totalExpenses").textContent = formatToRender(report.totalExpenses);
		document.querySelector("#grossProfit").textContent = formatToRender(report.grossProfit);
		document.querySelector("#balance").textContent = formatToRender(report.balance);
		document.querySelector(".divivdents").innerHTML = report.dividents.map(createDividentHtml).join('');
		document.querySelector("#restBalance").textContent = formatToRender(report.restBalance);
	}


	const validateDividentsAmount = report => {
		if (report.dividentsAmount > report.balance) report.dividentsAmount = report.balance;
		if (report.dividentsAmount < 0) report.dividentsAmount = 0;
		document.querySelector("input[name='dividentsAmount']").value = report.dividentsAmount;
	}

	const calculateDividents = ({ dividentsAmount, investors }) => {
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

	const createNewReport = () => {
		changeUIState("openedNewReport")
		currentReport = { id: crypto.randomUUID() }
		const lastReport = appData.reports.slice(-1).pop();
		document.querySelector("input[name=initialBalance]").value = lastReport?.restBalance || 0;
		updateReport();
	}

	const openReport = id => {
		changeUIState("openedOldReport")
		currentReport = appData.reports.find(item => item.id === id);
		renderReportInputs(currentReport);
		renderReportCalculations(currentReport);
	}

	const closeReport = () => {
		changeUIState();
		currentReport = {};
	}

	const saveReport = () => {
		if (!confirm("Зберегти звіт?")) return
		if (appData.reports.find(item => item.date === currentReport.date)) return alert("Звіт з такою датою вже існує")
		appData.reports.push(currentReport);
		appData.reports.sort((a, b) => new Date(a.date) - new Date(b.date));
		saveData("appData", appData);
		renderApp();
	}

	const removeReport = btn => {
		if (!confirm("Видалити звіт?")) return
		const id = btn.closest(".report__delete").dataset.id;
		appData.reports = appData.reports.filter(report => report.id !== id);
		btn.closest(".reports__item").remove();
		if (id === currentReport.id) closeReport();
		saveData("appData", appData);
		renderApp();
	}

	const updateReport = () => {
		const epensesData = getReportExpensesData();
		const inputData = getReportInputData();
		currentReport = calculateReport({
			id: currentReport.id,
			date: reportDateInput.value,
			expenseCategories: appData.expenseCategories,
			investors: appData.investors,
			expenses: epensesData,
			...inputData,
		});
		renderReportCalculations(currentReport);
	}

	const changeUIState = state => {
		switch (state) {
			case 'openedOldReport':
				openScreen(openReportBtn);
				openReportBtn.disabled = false;
				[reportDateInput, ...reportInputs].forEach(item => item.disabled = true);
				document.querySelectorAll("#saveReport, #addExpense").forEach(btn => btn.classList.add("hidden"))
				break
			case 'openedNewReport':
				openScreen(openReportBtn);
				openReportBtn.disabled = false;
				[reportDateInput, ...reportInputs].forEach(item => item.disabled = false);
				reportDateInput.valueAsDate = new Date();
				document.querySelectorAll("#saveReport, #addExpense").forEach(btn => btn.classList.remove("hidden"))
				break
			default:
				openScreen(document.querySelector("#reportList"));
				openReportBtn.disabled = true;
				reportInputs.forEach(input => input.value = input.defaultValue);
				expensesContainer.innerHTML = "";
				break
		}
	}

	const renderChartYears = () => {
		const years = Array.from(new Set(appData.reports.map(item => item.date.split('-')[0]))).sort((a, b) => b - a);
		document.querySelector("#chartYears").innerHTML = years.map(createChartYearHtml).join('');
	}

	const updateCharts = () => {
		document.querySelector("#openCharts").disabled = false;
		if (appData.reports.length === 0) document.querySelector("#openCharts").disabled = true;
		charts.forEach(item => updateChart({ data: getReportsByYear(currentChartYear), ...item }));
	}

	const getReportsByYear = year => {
		return appData.reports.filter(item => item.date.split('-')[0] === year)
	}

	const changeCurrentChartYear = () => {
		currentChartYear = document.querySelector("#chartYears").value;
		updateCharts();
	}

	const charts = [
		{
			elem: document.querySelector('#grossProfitChart'),
			dataKey: 'grossProfit',
			label: 'Прибуток',
			labelsKey: 'date',
			backgroundColor: '#29b95e',
		},
		{
			elem: document.querySelector('#totalExpensesChart'),
			dataKey: 'totalExpenses',
			label: 'Витрати',
			labelsKey: 'date',
			backgroundColor: '#b9293c',
		},
		{
			elem: document.querySelector('#revenueChart'),
			dataKey: 'mainIncome',
			label: 'Дохід',
			labelsKey: 'date',
			backgroundColor: '#b98729',
		},
	];

	charts.forEach(item => item.chart = createChart({ data: appData.reports, ...item }));

	[expensesContainer, ...reportInputs, reportDateInput].forEach(item => item.addEventListener("change", updateReport));
	document.querySelector("#addExpense").addEventListener("click", addExpense);
	document.querySelector(".expenses").addEventListener("click", (event) => {
		if (event.target.closest(".expenses__delete")) removeExpense(event.target);
	});
	document.querySelector('#printReport').addEventListener("click", () => openPrintWindow(currentReport));
	document.querySelector('#saveReport').addEventListener("click", saveReport);
	document.querySelector("#reportsContainer").addEventListener("click", (event) => {
		if (event.target.closest(".report__open")) openReport(event.target.closest(".report__open").dataset.id);
		if (event.target.closest(".report__delete")) removeReport(event.target);
	})
	document.querySelector('#saveToFile').addEventListener("click", () => saveToFile(appData));
	document.querySelector('#importFromFile').addEventListener("click", async () => importFromFile(document.querySelector("#file").files[0]));
	document.querySelector("#createReport").addEventListener("click", createNewReport);
	document.querySelector("#closeReport").addEventListener("click", closeReport);
	document.querySelectorAll(".sidebar__btn").forEach(item => item.addEventListener("click", (event) => openScreen(event.target)));
	document.querySelector("#chartYears").addEventListener("change", changeCurrentChartYear);
	document.querySelector("#addExpenseCategory").addEventListener("click", addExpenseCategory);
	document.querySelector("#expenseCategories").addEventListener("click", (event) => {
		if (event.target.closest(".category__save")) changeExpenseCategory(event.target.closest(".category__item").dataset.id, event.target.closest(".category__item").querySelector("input").value);
		if (event.target.closest(".category__delete")) removeExpenseCategory(event.target.closest(".category__item").dataset.id);
	});
	document.querySelector("#login").addEventListener("click", authentication);
	document.querySelector("#logout").addEventListener("click", logout);
})())
