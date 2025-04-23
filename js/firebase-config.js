import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

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
const auth = getAuth(app);

export { auth, app };