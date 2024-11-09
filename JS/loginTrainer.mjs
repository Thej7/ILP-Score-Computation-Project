// Import the necessary functions from Firebase SDK
import { app, db, analytics, auth } from "./firebaseConfig.mjs";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js"; // Use the same version for auth
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js"; // Import Realtime Database methods

// Function to verify if the email is a trainer email
async function isTrainerEmail(email) {
    const trainerEmailsRef = ref(db, 'userRoles/trainer/emails'); // Reference to the trainer emails in the database
    const snapshot = await get(trainerEmailsRef);
    
    if (snapshot.exists()) {
        const trainerEmails = snapshot.val(); // Get the list of trainer emails
        console.log("Retrieved Trainer Emails: ", trainerEmails); // Log the retrieved trainer emails

        // Normalize the input email
        const normalizedEmail = email.trim().toLowerCase();
        console.log("Checking for Email: ", normalizedEmail); // Log the email being checked

        // Check if the normalized email is in the list of trainer emails
        const isTrainer = Array.isArray(trainerEmails) && trainerEmails.map(e => e.trim().toLowerCase()).includes(normalizedEmail);
        console.log("Is Trainer Email:", isTrainer); // Log the result of trainer check
        return isTrainer;
    }
    
    console.log("No trainer emails found in the database."); // Log if no trainer emails are found
    return false; // No trainer emails found
}

// Add event listener for the login button
document.getElementById("loginbtn").addEventListener("click", handleLogin);

// Listen for Enter key press anywhere on the page
document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        handleLogin();
    }
});

// Login function
async function handleLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // Check if the entered email is a trainer email first
        const isTrainer = await isTrainerEmail(email);

        if (!isTrainer) {
            alert("You do not have Trainer privileges.");
            return; // Stop further execution if not a trainer
        }

        // Attempt to sign in the user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("Logged in successfully as Trainer:", user);
        window.location.href = "Trainer-Homepage.html"; // Redirect to Trainer Dashboard
    } catch (error) {
        const errorCode = error.code;
        let errorMessage = '';

        // Customize error message based on Firebase authentication error code
        switch (errorCode) {
            case 'auth/wrong-password':
                errorMessage = "Incorrect password. Please try again.";
                break;
            case 'auth/user-not-found':
                errorMessage = "No account found with this email. Please sign up.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Invalid email format.";
                break;
            case 'auth/too-many-requests':
                errorMessage = "Too many login attempts. Please try again later.";
                break;
            default:
                errorMessage = "Login failed. Please try again.";
        }

        // Display the error message
        document.getElementById("error-message").innerText = errorMessage;
        console.error("Error logging in:", errorMessage);
    }
}

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        const uid = user.uid;
        console.log("User is signed in with UID:", uid); // Log the signed-in user's UID
    } else {
        // User is signed out
        console.log("User is signed out."); // Log when the user is signed out
    }
});
