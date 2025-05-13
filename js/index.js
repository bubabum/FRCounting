"use strict"
import { readJsonFile } from "./import.js"
import { saveToFile } from "./export.js"
import { openPrintWindow } from "./print.js"
import { initAuthListener, login, logout } from "./auth.js"
import { loadData, saveData } from "./db.js"
import { renderChart } from "./chartManager.js"
import { charts } from "./chartConfig.js"
import { app } from "./firebase-config.js"

document.addEventListener("DOMContentLoaded", (async () => {
	let appData = {
		reports: [],
		investors: [],
		expenseCategories: [],
	};
	let chartState = {
		year: "",
		indicator: "dividentsAmount",
	};
	let currentReport = {};


	const expensesContainer = document.querySelector("#expensesList");
	const investorsContainer = document.querySelector("#investorsContainer");
	const reportInputs = [...document.querySelectorAll(".report-input")];
	const reportDateInput = document.querySelector("#reportDate");
	const openReportBtn = document.querySelector("#openReportBtn");
	const openReportListBtn = document.querySelector("#reportListBtn");

	const sortFunctions = {
		dateNewest: (a, b) => new Date(b.date) - new Date(a.date),
		dateOldest: (a, b) => new Date(a.date) - new Date(b.date),
		profit: (a, b) => b.grossProfit - a.grossProfit,
		income: (a, b) => b.mainIncome - a.mainIncome,
	}

	const formatToRender = num => num.toFixed(2) + " ₴";
	const safeRound = value => Number(value.toFixed(2));

	const createReportHtml = report => {
		return `
		<div class="reports__item ${report.status === 'draft' ? 'reports__item_draft' : ''}">
			<div class="reports__date">${report.date.split("-").reverse().join(".")}</div>
			<div>${formatToRender(report.mainIncome + report.subIncome)}</div>
			<div>${formatToRender(report.totalExpenses)}</div>
			<div>${formatToRender(report.grossProfit)}</div>
			<div class="reports__btns">
				<button data-id="${report.id}" class="report__open secondary"><span class="material-symbols-outlined">open_in_new</span>Переглянути</button>
				<button data-id="${report.id}" class="report__delete secondary"><span class="material-symbols-outlined">delete</span></button>
			</div>
		</div>
	`
	}

	const createExpenseCategoryHtml = category => {
		return `
			<div data-id="${category.id}" class="category__item list-item">
				<input type="text" value="${category.category}">
				<button class="category__save primary"><span class="material-symbols-outlined">edit</span>Змінити</button>
				<button class="category__delete secondary"><span class="material-symbols-outlined">delete_outline</span>Видалити</button>
			</div>
		`
	}

	const createInvestorHtml = investor => {
		return `
			<div data-id="${investor.id}" class="investor__item list-item">
				<input type="text" value="${investor.name}" min="0">
				<input type="number" class="investor__percentage" value="${investor.percentage}" min="0">
				<button class="investor__delete secondary"><span class="material-symbols-outlined">delete_outline</span>Видалити</button>
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
				<button class="expenses__delete secondary"><span class="material-symbols-outlined">delete_outline</span></button>
			</div>
		`
	}

	const createExpenseFilledInputHtml = (expense, expenseCategories) => {
		return `
			<div class="expenses__item">
				<input class="expenses__date" type="date" name="date" value="${expense.date}">
				<input class="expenses__amount" type="number" value="${expense.amount}" min="0" name="amount">
				<select class="expenses__category" name="category">
					<option value="${expense.category}" selected>${expenseCategories.find(item => item.id === Number(expense.category)).category}</option>
				</select>
				<input class="expenses__note" type="text" name="note" value="${expense.note}">
				<button class="expenses__delete secondary"><span class="material-symbols-outlined">delete_outline</span></button>
			</div>
		`
	}

	const createExpenseHtml = (expense, expenseCategories) => {
		return `
			<div class="expenses__item expenses__item_grid">
				<div class="expenses__date">${(new Date(expense.date)).toLocaleDateString()}</div>
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
		updateReport();
	}

	const removeExpense = (btn) => {
		btn.closest(".expenses__item").remove();
		updateReport();
	}

	const sortReports = () => {
		renderReports(sortFunctions[document.querySelector("#sortReports").value])
	}

	const renderReports = sortFunctionName => {
		document.querySelector("#reportsContainer").innerHTML = appData.reports.map(item => item).sort(sortFunctionName).map(createReportHtml).join('');
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
		alert("Збережено")
	}

	const removeExpenseCategory = id => {
		if (!confirm("Видалити категорію витрат?")) return
		appData.expenseCategories = appData.expenseCategories.filter(item => item.id !== Number(id));
		saveData("appData", appData);
		renderExpenseCategories();
	}

	const renderInvestors = () => {
		investorsContainer.innerHTML = appData.investors.map(createInvestorHtml).join('')
	}

	const addInvestor = () => {
		const id = appData.investors.map(item => item.id).sort().pop() + 1 || 1;
		const name = document.querySelector("#newInvestor").value;
		if (name.length === 0) return alert("Ім'я не заповнене")
		appData.investors.push({ id, percentage: 0, name });
		saveData("appData", appData);
		renderInvestors();
		document.querySelector("#newInvestor").value = "";
	}

	const changeInvestors = () => {
		if ([...document.querySelectorAll(".investor__percentage")].reduce((acc, cur) => acc + Number(cur.value), 0) > 100) return alert("Сума перевищує 100%");
		appData.investors.forEach(item => item.percentage = Number(document.querySelector(`.investor__item[data-id="${item.id}"] .investor__percentage`).value))
		saveData("appData", appData);
		alert("Збережено")
	}

	const removeInvestor = id => {
		if (!confirm("Видалити інвестора?")) return
		appData.investors = appData.investors.filter(item => item.id !== Number(id));
		saveData("appData", appData);
		renderInvestors();
	}

	const renderReportInputs = report => {
		reportInputs.forEach(item => item.value = report[item.name]);
		reportDateInput.value = report.date;
		let createHtml = createExpenseHtml;
		if (report.status === "draft") createHtml = createExpenseFilledInputHtml;
		expensesContainer.innerHTML = report.expenses.map(item => createHtml(item, report.expenseCategories)).join('');
	}

	const renderReportCalculations = report => {
		document.querySelector("#totalExpenses").textContent = formatToRender(report.totalExpenses);
		document.querySelector("#grossProfit").textContent = formatToRender(report.grossProfit);
		document.querySelector("#balance").textContent = formatToRender(report.balance);
		document.querySelector(".divivdents").innerHTML = report.investors.map(createDividentHtml).join('');
		document.querySelector("#restBalance").textContent = formatToRender(report.restBalance);
	}

	const validateDividentsAmount = report => {
		if (report.dividentsAmount > report.balance) report.dividentsAmount = report.balance;
		if (report.dividentsAmount < 0) report.dividentsAmount = 0;
		document.querySelector("input[name='dividentsAmount']").value = report.dividentsAmount;
	}

	const calculateDividents = ({ dividentsAmount, investors }) => {
		investors.sort((a, b) => a.percentage - b.percentage).forEach((item, i, arr) => {
			if (dividentsAmount < 1000) return item.amount = 0;
			if (i === arr.length - 1) {
				item.amount = dividentsAmount - arr
					.slice(0, -1)
					.reduce((acc, cur) => acc + cur.amount, 0);
				arr.sort((a, b) => a.id - b.id)
			} else {
				item.amount = Math.ceil(dividentsAmount * item.percentage / 100 / 100) * 100;
			}
		})
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
		report.grossProfit = safeRound(report.mainIncome + report.subIncome - report.productionCosts - report.goodsCosts);
		report.balance = safeRound(report.mainIncome + report.subIncome + report.initialBalance - report.totalExpenses);
		validateDividentsAmount(report);
		calculateDividents(report);
		report.restBalance = safeRound(report.mainIncome + report.subIncome + report.initialBalance - report.totalExpenses - report.dividentsAmount);
		return report
	}

	const isDateDuplicate = () => {
		return appData.reports.some(item => item.date === currentReport.date && item.id !== currentReport.id)
	}

	const createNewReport = () => {
		if (appData.reports.filter(r => r.status === "draft").length > 0) return alert("Є не закритий звіт-чернетка")
		changeUIState("newReport")
		currentReport = { id: crypto.randomUUID(), status: "draft" }
		const lastReport = appData.reports.slice(-1).pop();
		document.querySelector("input[name=initialBalance]").value = lastReport?.restBalance || 0;
		updateReport();
	}

	const openReport = id => {
		currentReport = appData.reports.find(item => item.id === id);
		renderReportInputs(currentReport);
		renderReportCalculations(currentReport);
		if (currentReport.status === "draft") return changeUIState("draftReport")
		changeUIState("completedReport")
	}

	const closeReport = () => {
		changeUIState();
		currentReport = {};
	}

	const updateOrAddReport = () => {
		const reportIndex = appData.reports.findIndex(item => item.id === currentReport.id);
		if (reportIndex !== -1) appData.reports[reportIndex] = currentReport;
		if (reportIndex === -1) appData.reports.push(currentReport);
		appData.reports.sort((a, b) => new Date(a.date) - new Date(b.date));
		saveData("appData", appData);
		renderApp();
	}

	const saveReport = () => {
		if (isDateDuplicate()) return alert("Звіт з такою датою вже існує")
		alert("Збережено")
		updateOrAddReport();
	}

	const completeReport = () => {
		if (isDateDuplicate()) return alert("Звіт з такою датою вже існує")
		if (!confirm("Завершити звіт?")) return
		currentReport.status = "completed";
		updateOrAddReport();
		closeReport();
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
			status: currentReport.status,
			date: reportDateInput.value,
			expenseCategories: appData.expenseCategories.map(cat => ({ ...cat })),
			investors: appData.investors.map(investor => ({ ...investor })),
			expenses: epensesData,
			...inputData,
		});
		renderReportCalculations(currentReport);
	}

	const changeUIState = state => {
		switch (state) {
			case 'completedReport':
				openScreen(openReportBtn);
				openReportBtn.disabled = false;
				[reportDateInput, ...reportInputs].forEach(item => item.disabled = true);
				document.querySelectorAll("#saveReport, #completeReport, #addExpense").forEach(btn => btn.classList.add("hidden"))
				break
			case 'newReport':
				openScreen(openReportBtn);
				openReportBtn.disabled = false;
				[reportDateInput, ...reportInputs].forEach(item => item.disabled = false);
				reportDateInput.valueAsDate = new Date();
				document.querySelectorAll("#saveReport, #completeReport, #addExpense").forEach(btn => btn.classList.remove("hidden"))
				break
			case 'draftReport':
				openScreen(openReportBtn);
				openReportBtn.disabled = false;
				reportDateInput.disabled = false;
				reportInputs.forEach(item => item.disabled = false);
				document.querySelectorAll("#saveReport, #completeReport, #addExpense").forEach(btn => btn.classList.remove("hidden"))
				break
			default:
				openScreen(openReportListBtn);
				openReportBtn.disabled = true;
				reportInputs.forEach(input => input.value = input.defaultValue);
				expensesContainer.innerHTML = "";
				break
		}
	}

	const renderChartYears = () => {
		const years = Array.from(new Set(appData.reports.map(item => item.date.split('-')[0]))).sort((a, b) => b - a);
		document.querySelector("#chartYears").innerHTML = years.map(createChartYearHtml).join('');
		chartState.year = years[0];
	}

	const changeCurrentChartYear = () => {
		chartState.year = document.querySelector("#chartYears").value;
		renderCharts('#byIndicatorChart');
	}

	const changeChartIndicator = () => {
		chartState.indicator = document.querySelector("#chartType").value
		renderCharts('#byIndicatorChart');
	}

	const openScreen = btn => {
		document.querySelectorAll(".content__screen").forEach(item => item.classList.remove("active"));
		document.querySelector(`#${btn.closest(".sidebar__btn").dataset.screen}`).classList.add("active");
		document.querySelectorAll(".sidebar__btn").forEach(item => item.classList.remove("active"));
		btn.closest(".sidebar__btn").classList.add("active");
	}

	const renderCharts = id => {
		document.querySelector("#openCharts").disabled = false;
		if (appData.reports.length === 0) document.querySelector("#openCharts").disabled = true;
		charts.filter(item => !id || item.elem === id).forEach(item => renderChart({
			id: item.elem,
			ctx: document.querySelector(item.elem),
			data: item.dataBuilder({ ...appData, ...chartState })
		}))
	}

	const renderApp = () => {
		renderReports(sortFunctions.dateNewest);
		renderExpenseCategories();
		renderInvestors();
		renderChartYears();
		renderCharts();
	}

	const showApp = async () => {
		openScreen(openReportListBtn);
		document.querySelector(".loader").classList.add("loaded");
		document.querySelectorAll(".login, .sidebar, .content").forEach(item => item.classList.add("logged"));
		await initApp();
	}

	const hideApp = () => {
		document.querySelector(".loader").classList.add("loaded");
		document.querySelectorAll(".login, .sidebar, .content").forEach(item => item.classList.remove("logged"));
	}

	const authentication = async () => {
		const email = document.querySelector("#email").value;
		const password = document.querySelector("#password").value;
		document.querySelector(".login").classList.add("loading")
		try {
			await login(email, password);
		} catch (error) {
			alert("Помилка входу: " + error)
		} finally {
			document.querySelector(".login").classList.remove("loading")
		}
	}

	const initApp = async () => {
		try {
			appData = await loadData("appData");
			// appData.reports.forEach(item => {
			// 	if (item.dividents) delete item.dividents
			// 	calculateDividents(item);
			// })
			// saveData("appData", appData);
			renderApp();
		} catch (error) {
			alert("Помилка завантаження даних з хмари: " + error)
		}
	}

	const importFromFile = async file => {
		appData = await readJsonFile(file);
		renderApp();
	}

	const saveToCloud = () => {
		saveData("appData", appData);
		alert("Дані вивантажено в хмару")
	}

	initAuthListener(showApp, hideApp);

	[expensesContainer, ...reportInputs, reportDateInput].forEach(item => item.addEventListener("change", updateReport));
	document.querySelector("#addExpense").addEventListener("click", addExpense);
	document.querySelector(".expenses").addEventListener("click", (event) => {
		if (event.target.closest(".expenses__delete")) removeExpense(event.target);
	});
	document.querySelector("#sortReports").addEventListener("change", sortReports);
	document.querySelector('#printReport').addEventListener("click", () => openPrintWindow({ ...currentReport }));
	document.querySelector('#saveReport').addEventListener("click", saveReport);
	document.querySelector('#completeReport').addEventListener("click", completeReport);
	document.querySelector("#reportsContainer").addEventListener("click", (event) => {
		if (event.target.closest(".report__open")) openReport(event.target.closest(".report__open").dataset.id);
		if (event.target.closest(".report__delete")) removeReport(event.target);
	})
	document.querySelector('#saveToFile').addEventListener("click", () => saveToFile(appData));
	document.querySelector('#importFromFile').addEventListener("click", async () => importFromFile(document.querySelector("#file").files[0]));
	document.querySelector("#saveToCloud").addEventListener("click", saveToCloud);
	document.querySelector("#createReport").addEventListener("click", createNewReport);
	document.querySelector("#closeReport").addEventListener("click", closeReport);
	document.querySelectorAll(".open-screen").forEach(item => item.addEventListener("click", (event) => openScreen(event.target)));
	document.querySelector("#addExpenseCategory").addEventListener("click", addExpenseCategory);
	document.querySelector("#expenseCategories").addEventListener("click", (event) => {
		if (event.target.closest(".category__save")) changeExpenseCategory(event.target.closest(".category__item").dataset.id, event.target.closest(".category__item").querySelector("input").value);
		if (event.target.closest(".category__delete")) removeExpenseCategory(event.target.closest(".category__item").dataset.id);
	});
	document.querySelector("#addInvestor").addEventListener("click", addInvestor);
	document.querySelector("#saveInvestors").addEventListener("click", changeInvestors)
	investorsContainer.addEventListener("click", (event) => {
		if (event.target.closest(".investor__delete")) removeInvestor(event.target.closest(".investor__item").dataset.id);
	});
	document.querySelector("#chartYears").addEventListener("change", changeCurrentChartYear);
	document.querySelector("#chartType").addEventListener("change", changeChartIndicator)
	document.querySelector("#login").addEventListener("click", authentication);
	document.querySelector("#logout").addEventListener("click", logout);
})());
