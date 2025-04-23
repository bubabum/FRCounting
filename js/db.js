import { app } from './firebase-config.js';
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const db = getDatabase(app);

export const loadData = async key => {
	try {
		const snapshot = await get(ref(db, key));
		if (snapshot.exists()) {
			return snapshot.val();
		} else {
			console.log("Дані не знайдено");
		}
	} catch (error) {
		console.error("Помилка при зчитуванні:", error);
	}
}

export const saveData = (key, data) => {
	set(ref(db, key), data)
		.then(() => {
			console.log("Дані успішно збережено");
			//loadData();  // Знову зчитуємо дані після запису
		})
		.catch((error) => {
			console.error("Помилка при записі:", error);
		});
}