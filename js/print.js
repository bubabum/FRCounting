const createExpenseTable = report => {
	return report.expenses.map((item, i) => `
		<tr>
			<td>${i + 1}</td>
			<td>${(new Date(item.date)).toLocaleDateString()}</td>
			<td>${item.amount.toFixed(2)} ₴</td>
			<td>${report.expenseCategories?.find(category => category.id === Number(item.category)).category}</td>
			<td>${item.note}</td>
		</tr>
	`).join('');
}

const createDividentsTable = report => {
	return report.investors.map(item => `
		<tr>
			<td>${item.name}</td>
			<td>${item.amount.toFixed(2)} ₴</td>
		</tr>
	`).join('');
}

const createDateString = date => {
	return new Date(date).toLocaleString('uk-UA', {
		month: 'long',
		year: "numeric",
	});
}

const fillTemplate = (template, data) => {
	return Object.keys(data).reduce((result, key) => {
		if (typeof data[key] === "number") data[key] = data[key].toFixed(2) + " ₴";
		return result.replaceAll(`{{${key}}}`, data[key])
	}, template)
}

export async function openPrintWindow(report) {
	const printWindow = window.open('', '_blank', 'width=794,height=1123'); // A4 в пікселях при 96dpi
	report.expensesTable = createExpenseTable(report);
	report.dividentsTable = createDividentsTable(report);
	report.date = createDateString(report.date);
	const printTemplate = await fetch("./templates/print.html");
	const printTemplateHtml = await printTemplate.text();
	const printHtml = fillTemplate(printTemplateHtml, report);
	printWindow.document.open();
	printWindow.document.write(printHtml);
	printWindow.document.close();
	printWindow.addEventListener("afterprint", () => printWindow.close());
	//printWindow.print();
}