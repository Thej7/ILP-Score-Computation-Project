// Import the necessary functions from Firebase SDK
import { app, db, analytics, auth } from "./firebaseConfig.mjs";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js"; // Use the same version for auth
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js"; // Import Realtime Database methods

// Function to verify if the email is an admin email
async function isAdminEmail(email) {
    const adminEmailsRef = ref(db, 'userRoles/admin/emails'); // Reference to the admin emails in the database
    const snapshot = await get(adminEmailsRef);
    
    if (snapshot.exists()) {
        const adminEmails = snapshot.val(); // Get the list of admin emails
        console.log("Retrieved Admin Emails: ", adminEmails); // Log the retrieved admin emails

        // Normalize the input email
        const normalizedEmail = email.trim().toLowerCase();
        console.log("Checking for Email: ", normalizedEmail); // Log the email being checked

        // Check if the normalized email is in the list of admin emails
        const isAdmin = Array.isArray(adminEmails) && adminEmails.map(e => e.trim().toLowerCase()).includes(normalizedEmail);
        console.log("Is Admin Email:", isAdmin); // Log the result of admin check
        return isAdmin;
    }
    
    console.log("No admin emails found in the database."); // Log if no admin emails are found
    return false; // No admin emails found
}

// Add event listener for the login button
document.getElementById("loginbtn").addEventListener("click", async function () {
    await handleLogin();
});

// Listen for the Enter key press to trigger login
document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent form submission
        handleLogin();
    }
});

// Login function
async function handleLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // Attempt to sign in the user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch user email and check if it's an admin email
        const isAdmin = await isAdminEmail(user.email);
        if (isAdmin) {
            console.log("Logged in successfully as Admin:", user);
            window.location.href = "Admin-Homepage.html"; // Redirect upon successful login
        } else {
            alert("You do not have Admin privileges.");
            await auth.signOut(); // Sign out if not admin
        }
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
