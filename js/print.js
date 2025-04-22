const createExpenseTable = (printReport, expensesCategories) => {
	return printReport.expenses.map((item, i) => `
		<tr>
			<td>${i + 1}</td>
			<td>${item.date}</td>
			<td>${item.amount.toFixed(2)} ₴</td>
			<td>${expensesCategories.find(category => category.id === Number(item.category)).category}</td>
			<td>${item.note}</td>
		</tr>
	`).join('');
}

const createDividentsTable = (printReport) => {
	return printReport.dividents.map((item, i) => `
		<tr>
			<td>${item.name}</td>
			<td>${item.amount.toFixed(2)} ₴</td>
		</tr>
	`).join('');
}

const fillTemplate = (template, data) => {
	return Object.keys(data).reduce((result, key) => {
		if (typeof data[key] === "number") data[key] = data[key].toFixed(2) + " ₴";
		return result.replaceAll(`{{${key}}}`, data[key])
	}, template)
}

export async function openPrintWindow({ currentReport, expensesCategories }) {
	const printWindow = window.open('', '_blank', 'width=794,height=1123'); // A4 в пікселях при 96dpi
	currentReport.expensesTable = createExpenseTable(currentReport, expensesCategories);
	currentReport.dividentsTable = createDividentsTable(currentReport);
	const printTemplate = await fetch("./templates/print.html");
	const printTemplateHtml = await printTemplate.text();
	const printHtml = fillTemplate(printTemplateHtml, currentReport);
	printWindow.document.open();
	printWindow.document.write(printHtml);
	printWindow.document.close();
	printWindow.addEventListener("afterprint", () => printWindow.close());
	//printWindow.print();
}