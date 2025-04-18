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
		currentReportId: "",
	}
	const importFromFile = async (file) => {
		appData = await readJsonFile(file);
		renderReports();
	}

	let currentReportId = "";
	const currentReport = {};
	const investors = appData.investors;
	const expensesCategories = appData.expensesCategories;
	const reportInputs = document.querySelectorAll(".report-input");

	const formatToRender = num => num.toFixed(2) + " ₴";

	const openScreen = (btn) => {
		document.querySelectorAll(".content__screen").forEach(item => item.classList.remove("active"));
		document.querySelector(`#${btn.closest(".sidebar__btn").dataset.screen}`).classList.add("active");
		document.querySelectorAll(".sidebar__btn").forEach(item => item.classList.remove("active"));
		btn.closest(".sidebar__btn").classList.add("active");
	}

	const createReportHtml = (report) => {
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

	const createExpenseHtml = () => {
		return `
		<div class="expenses__item">
			<input class="expenses__date" type="date" name="date">
			<input class="expenses__amount" type="number" value="0" min="0" name="amount">
			<select class="expenses__category" name="category"></select>
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
		document.querySelector("#expenses").appendChild(document.querySelector("#expenseTemplate").content.cloneNode(true));
		[...document.querySelectorAll(".expenses .expenses__category")].pop().insertAdjacentHTML("beforeend", `
			${expensesCategories.map(item => `<option value="${item.id}">${item.category}</option>`).join('')}
		`);
		[...document.querySelectorAll(".expenses .expenses__date")].pop().valueAsDate = new Date();
	}

	const removeExpense = (btn) => {
		btn.closest(".expenses__item").remove();
		renderReport(calculateReport());
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
		if (id === currentReportId) closeReport();
	}

	const renderReport = ({ currentReport }) => {
		document.querySelector("#totalExpenses").textContent = formatToRender(currentReport.totalExpenses);
		document.querySelector("#grossProfit").textContent = formatToRender(currentReport.grossProfit);
		document.querySelector("#balance").textContent = formatToRender(currentReport.balance);
		document.querySelector(".divivdents").innerHTML = "";
		currentReport.dividents.forEach(item => {
			document.querySelector(".divivdents").insertAdjacentHTML("beforeend", createDividentHtml(item))
		});
		document.querySelector("#restBalance").textContent = formatToRender(currentReport.restBalance);
	}

	const createExpense = (elem) => {
		const expense = {};
		elem.querySelectorAll("input, select").forEach(item => {
			expense[item.name] = item.type === "number" ? Number(item.value) : item.value;
		})
		return expense
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

	const getReportInputData = () => {
		const report = {};
		reportInputs.forEach(item => {
			report[item.name] = Number(item.value);
		});
		return report
	}

	const calculateReport = (inputData) => {
		reportInputs.forEach(item => {
			currentReport[item.name] = item.type === "number" ? Number(item.value) : item.value;
		});
		currentReport.expenses = [];
		document.querySelectorAll(".expenses__item").forEach(item => currentReport.expenses.push(createExpense(item)));
		currentReport.totalExpenses = getTotalExpenses(currentReport);
		currentReport.grossProfit = currentReport.mainIncome + currentReport.subIncome - currentReport.productionCosts - currentReport.goodsCosts;
		currentReport.balance = currentReport.mainIncome + currentReport.subIncome + currentReport.initialBalance - currentReport.totalExpenses;
		validateDividentsAmount(currentReport);
		currentReport.dividents = calculateDividents(currentReport);
		currentReport.restBalance = currentReport.mainIncome + currentReport.subIncome + currentReport.initialBalance - currentReport.totalExpenses - currentReport.dividentsAmount;
		return currentReport
	}

	const setDefaultReportDate = () => {
		document.querySelector("#reportDate").valueAsDate = new Date();
	}

	const createNewReport = () => {
		openScreen(document.querySelector("#openReport"));
		document.querySelector("#openReport").disabled = false;
		appData.currentReport = {
			expenses: [],
			dividents: [],
			totalExpenses: 0,
			grossProfit: 0,
			balance: 0,
			restBalance: 0,
		}
		renderReport(appData);
	}

	const openReport = (id) => {
		const report = appData.reports.find(item => item.id === id);
		reportInputs.forEach(item => item.value = report[item.name]);
		report.expenses.forEach(item => {
			document.querySelector("#expenses").insertAdjacentHTML("beforeend", `
				<div class="expenses__item">
					<input class="expenses__date" type="date" name="date" value="${item.date}">
					<input class="expenses__amount" type="number" value="${item.amount}" min="0" name="amount">
					<select class="expenses__category" name="category"></select>
					<input class="expenses__note" type="text" name="note" value="${item.note}">
					<button class="expenses__delete red"><span class="material-icons-round">delete_outline</span></button>
				</div>
				`);
		});
		[...document.querySelectorAll(".expenses .expenses__category")].forEach((item, index) => {
			item.insertAdjacentHTML("beforeend", `
				${expensesCategories.map((category, i) => `<option ${(Number(report.expenses[index].category) === category.id ? "selected" : "")} value="${category.id}">${category.category}</option>`).join('')}
			`);
		})
		renderReport(calculateReport());
		document.querySelector("#openReport").disabled = false;
		openScreen(document.querySelector("#openReport"));
		currentReportId = report.id;
	}

	const closeReport = () => {
		openScreen(document.querySelector("#reportList"));
		document.querySelector("#openReport").disabled = true;
		reportInputs.forEach(input => input.value = input.defaultValue);
		setDefaultReportDate();
		document.querySelector("#expenses").innerHTML = "";
		renderReport(appData);
		currentReportId = "";
	}

	const saveReport = () => {
		const report = calculateReport(appData);
		if (appData.reports.find(item => item.id !== report.id && item.date === report.date)) return alert("Звіт з такою датою вже існує")
		const oldReport = appData.reports.find(item => item.id === report.id);
		if (oldReport) {
			const oldReportIndex = appData.reports.indexOf(oldReport);
			appData.reports[oldReportIndex] = report;
		} else {
			report.id = crypto.randomUUID();
			currentReportId = report.id;
			appData.reports.push(report);
		}
		appData.reports.sort((a, b) => new Date(a.date) - new Date(b.date));
		renderReports();
	}

	const updateReport = () => {
		const inputData = getReportInputData();
		appData.currentReport = calculateReport(inputData);
		renderReport(appData);
	}

	setDefaultReportDate();

	[document.querySelector("#expenses"), ...reportInputs].forEach(item => item.addEventListener("change", updateReport))
	document.querySelector(".add-expense").addEventListener("click", addExpense);
	document.querySelector(".expenses").addEventListener("click", (event) => {
		if (event.target.closest(".expenses__delete")) removeExpense(event.target);
	});
	document.querySelector('#printReport').addEventListener("click", () => openPrintWindow(calculateReport()));
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
