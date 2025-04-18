export const readJsonFile = (file) => {
	return new Promise((resolve, reject) => {
		if (!file) return alert("Файл не додано!");
		const reader = new FileReader();
		reader.onload = function (e) {
			try {
				resolve(JSON.parse(e.target.result));
				alert("Успішно завантажено")
			} catch (err) {
				console.log("Помилка парсингу JSON: ", err)
				alert("Файл не є коректним JSON")
			}
		}
		reader.readAsText(file);
	})
}