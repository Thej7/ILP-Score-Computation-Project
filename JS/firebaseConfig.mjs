import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
import { getDatabase, ref, set, get, child, remove } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// const firebaseConfig = {
//   apiKey: "AIzaSyCpyEVGeN2rB6r094P0BKKs24wjGczjtJY",
//   authDomain: "ilp-score-computation.firebaseapp.com",
//   databaseURL: "https://ilp-score-computation-default-rtdb.europe-west1.firebasedatabase.app",
//   projectId: "ilp-score-computation",
//   storageBucket: "ilp-score-computation.appspot.com",
//   messagingSenderId: "840907514414",
//   appId: "1:840907514414:web:e271c0e6f2a641f98bb5bf",
//   measurementId: "G-B7TKR5NQYT"
// };s

const firebaseConfig = {
  apiKey: "AIzaSyCL29xsSD9Z4MyZbfdsWIj59HKYn12haNQ",
  authDomain: "ilp-score-computation-5c1ae.firebaseapp.com",
  databaseURL: "https://ilp-score-computation-5c1ae-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ilp-score-computation-5c1ae",
  storageBucket: "ilp-score-computation-5c1ae.firebasestorage.app",
  messagingSenderId: "733432934367",
  appId: "1:733432934367:web:04b601659432b154039e6a",
  measurementId: "G-T6D49SZ789"
}

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth(app);

export { app, db, analytics, auth, ref, set, get, child, remove };
