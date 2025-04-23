import { auth } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const ALLOWED_UID = 'z1Zby7PlK3d9h4dJ1pnHAcVB51K2';
let unsubscribeAuth = null;

export function initAuthListener(onLogin, onLogout) {
	// Зняти попередній слухач
	if (typeof unsubscribeAuth === 'function') {
		unsubscribeAuth();
	}

	// Створити нового
	unsubscribeAuth = onAuthStateChanged(auth, (user) => {
		if (user && user.uid === ALLOWED_UID) {
			onLogin(user);
		} else {
			onLogout();
		}
	});
}

export async function login(email, password) {
	try {
		await signInWithEmailAndPassword(auth, email, password);
	} catch (error) {
		// console.error("Login error:", error);
		throw error;
	}
}

export async function logout() {
	await signOut(auth);
	if (typeof unsubscribeAuth === 'function') {
		unsubscribeAuth();
		unsubscribeAuth = null;
	}
}