"use strict"
import { readJsonFile } from "./import.js"
import { saveToFile } from "./export.js"
import { openPrintWindow } from "./print.js"
import { createChart, updateChart } from "./chart.js"
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
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
	}

	const firebaseConfig = {
		apiKey: "AIzaSyDkAtXqSTMvbHhP9zKpg8eCneH4iflZdZI",
		authDomain: "frcounting.firebaseapp.com",
		databaseURL: "https://frcounting-default-rtdb.europe-west1.firebasedatabase.app",
		projectId: "frcounting",
		storageBucket: "frcounting.firebasestorage.app",
		messagingSenderId: "1055777877517",
		appId: "1:1055777877517:web:5deb415ed6206879c3ef44",
		measurementId: "G-JQENMKDRKS"
	};

	const app = initializeApp(firebaseConfig);
	const analytics = getAnalytics(app);
	const db = getDatabase(app);
	const auth = getAuth(app);
	const ALLOWED_UID = 'z1Zby7PlK3d9h4dJ1pnHAcVB51K2';

	const showApp = () => {
		document.querySelector(".wrapper").style.display = "flex";
	}

	const singIn = () => {
		const email = document.querySelector("#email").value;
		const password = document.querySelector("#password").value;
		signInWithEmailAndPassword(auth, email, password)
			.then((userCredential) => {
				const user = userCredential.user;
				console.log("Успішний вхід:", user.uid);
				showApp();

				// Можеш одразу викликати функцію читання/запису тут
			})
			.catch((error) => {
				document.querySelector(".wrapper").style.display = "none";
				console.error("Помилка входу:", error.code, error.message);
			});
	}

	function loadData() {
		get(ref(db, 'appData'))
			.then(snapshot => {
				if (snapshot.exists()) {
					appData = snapshot.val();
					console.log(appData)
					renderReports();
				} else {
					console.log("Дані не знайдено");
				}
			})
			.catch((error) => {
				console.error("Помилка при зчитуванні:", error);
			});
	}

	function saveData() {
		set(ref(db, 'appData'), appData)
			.then(() => {
				console.log("Дані успішно збережено");
				loadData();  // Знову зчитуємо дані після запису
			})
			.catch((error) => {
				console.error("Помилка при записі:", error);
			});
	}


	// document.getElementById("logoutBtn").addEventListener("click", () => {
	// 	signOut(auth)
	// 		.then(() => {
	// 			showLogin();
	// 		})
	// 		.catch((error) => {
	// 			console.error("Помилка виходу:", error.message);
	// 		});
	// });

	onAuthStateChanged(auth, (user) => {
		if (user) {
			if (user.uid === ALLOWED_UID) {
				console.log("Ввійдено")
				loadData();

			} else {
				document.querySelector(".content").style.display = "none";
				console.log("Недозволений користувач")
			}
		} else {
			// Користувач не увійшов
			console.log("Користувач не увійшов")
		}
	});

	const importFromFile = async (file) => {
		appData = await readJsonFile(file);
		renderReports();
		renderChartYears();
		changeCurrentChartYear();
		updateCharts();
	}
	let currentReport = {};
	let currentChartYear = '';
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

	const createSelectHtml = category => {
		return expensesCategories.map((item, i) => `<option value="${item.id}" ${Number(category) === i + 1 ? "selected" : ""}>${item.category}</option>`).join('')
	}

	const createExpenseHtml = expense => {
		return `
		<div class="expenses__item">
			<input class="expenses__date" type="date" name="date" value="${expense ? expense.date : new Date().toISOString().split('T')[0]}">
			<input class="expenses__amount" type="number" value="${expense ? expense.amount : 0}" min="0" name="amount">
			<select class="expenses__category" name="category">${createSelectHtml(expense ? expense.category : null)}</select>
			<input class="expenses__note" type="text" name="note" value="${expense ? expense.note : ''}">
			<button class="expenses__delete red"><span class="material-icons-round">delete_outline</span></button>
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
		expensesContainer.insertAdjacentHTML("beforeend", createExpenseHtml());
	}

	const removeExpense = (btn) => {
		btn.closest(".expenses__item").remove();
		updateReport();
	}

	const renderReports = () => {
		document.querySelector("#reportsContainer").innerHTML = appData.reports.map(item => item).sort((a, b) => new Date(b.date) - new Date(a.date)).map(createReportHtml).join('');
	}

	const removeReport = btn => {
		const id = btn.closest(".report__delete").dataset.id;
		appData.reports = appData.reports.filter(report => report.id !== id);
		btn.closest(".reports__item").remove();
		if (id === currentReport.id) closeReport();
		renderChartYears();
		changeCurrentChartYear();
		updateCharts();
	}

	const renderReport = report => {
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

	const createNewReport = () => {
		openScreen(document.querySelector("#openReport"));
		document.querySelector("#openReport").disabled = false;
		reportDateInput.disabled = false;
		document.querySelector("#reportDate").valueAsDate = new Date();
		const lastReport = appData.reports.slice(-1).pop();
		document.querySelector("input[name=initialBalance]").value = lastReport?.restBalance || 0;
		updateReport();
	}

	const renderExpenses = expenses => {
		expensesContainer.innerHTML = expenses.map(createExpenseHtml).join('');
	}

	const openReport = id => {
		const report = appData.reports.find(item => item.id === id);
		reportInputs.forEach(item => item.value = report[item.name]);
		reportDateInput.value = report.date;
		if (report?.expenses) renderExpenses(report.expenses);
		document.querySelector("#openReport").disabled = false;
		reportDateInput.disabled = true;
		openScreen(document.querySelector("#openReport"));
		currentReport = report;
		updateReport();
	}

	const closeReport = () => {
		openScreen(document.querySelector("#reportList"));
		document.querySelector("#openReport").disabled = true;
		reportInputs.forEach(input => input.value = input.defaultValue);
		expensesContainer.innerHTML = "";
		updateReport();
		currentReport = {};
	}

	const saveReport = () => {
		const report = currentReport;
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
		renderChartYears();
		changeCurrentChartYear();
		updateCharts();
		saveData();
	}

	const updateReport = () => {
		const epensesData = getReportExpensesData();
		const inputData = getReportInputData();
		currentReport = calculateReport({ id: currentReport.id, ...inputData, expenses: epensesData, date: reportDateInput.value });
		console.log(currentReport)
		renderReport(currentReport);
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
	document.querySelector(".add-expense").addEventListener("click", addExpense);
	document.querySelector(".expenses").addEventListener("click", (event) => {
		if (event.target.closest(".expenses__delete")) removeExpense(event.target);
	});
	document.querySelector('#printReport').addEventListener("click", () => openPrintWindow(appData));
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
	document.querySelector("#login").addEventListener("click", singIn);
})())
