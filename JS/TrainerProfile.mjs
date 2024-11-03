import { app, db, analytics, auth } from "./firebaseConfig.mjs"; // Ensure path is correct
import { onAuthStateChanged, sendPasswordResetEmail, getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js"; // Import Realtime Database methods



// Function to fetch user profile from Realtime Database
async function fetchUserProfile(user) {
    try {
        // Reference to the user's profile in the Realtime Database using the user's UID
        const userRef = ref(db, 'user/' + user.uid); // Adjust the path according to your database structure
        const snapshot = await get(userRef); // Fetch the data

        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log("User Data:", userData);
            document.getElementById("profile-name").innerText = userData.Name || 'N/A';
            document.getElementById("profile-email").innerText = user.email;
            document.getElementById("profile-position").innerText = userData.Position || 'N/A';
            document.getElementById("profile-reports-to").innerText = userData['Reports to'] || 'N/A';
            document.getElementById("profile-contact").innerText = userData.Contact || 'N/A';
            document.getElementById("profile-location").innerText = userData.Location || 'N/A'; // Ensure these keys match your Realtime Database data
        } else {
            console.log("No data available for this user!");
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
    }
}

// Listen for authentication state changes and fetch profile data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await fetchUserProfile(user);
    } else {
        console.log("No user is signed in, redirecting to login.");
        window.location.href = "loginMain.html";
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, so you can access the email
            const userEmail = user.email;
            console.log("User's email address:", userEmail);
        
            // You can use the email address in your logic, for example, autofill fields
            document.getElementById("resetEmail").value = userEmail;
        } else {
            // No user is signed in, handle accordingly (e.g., redirect to login)
            console.log("No user is logged in.");
        }
    });
});

// Reset password
document.getElementById("reset_form").addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("resetEmail").value;

    sendPasswordResetEmail(auth, email)
        .then(() => {
            alert("Reset Password link sent to your Email");
        })
        .catch((error) => {
            console.log("Invalid Email Address");
            const errorCode = error.code;
            const errorMessage = error.message;
        });
});
