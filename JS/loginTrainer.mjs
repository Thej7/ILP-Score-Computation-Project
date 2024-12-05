// Import the necessary functions from Firebase SDK
import { app, db, analytics, auth } from "./firebaseConfig.mjs";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js"; // Use the same version for auth
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js"; // Import Realtime Database methods
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// Add event listener to the Forget Password button
document.getElementById("forget").addEventListener("click", function () {
    // Create the modal dynamically
    const modal = document.createElement("div");
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(6px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        width: 450px;
        max-width: 90%;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        text-align: center;
        animation: fadeIn 0.3s ease-in-out;
    `;

    // Add title, input field, and buttons to the modal content
    modalContent.innerHTML = `
        <h3 style="margin: 0 0 10px;">Reset Password</h3>
        <p id="modal-message" style="margin: 0 0 20px;">Please enter your email address to reset your password:</p>
        <input type="email" id="reset-email" placeholder="Enter your email" required style="
            width: 95%;
            padding: 10px;
            margin-bottom: 20px;
            border: 1px solid #ccc;
            border-radius: 5px;
        ">
        <div style="display: flex; justify-content: space-between;" id="modal-buttons">
            <button id="reset-cancel-btn" style="
                padding: 10px 20px;
                border: none;
                background-color: #ccc;
                border-radius: 5px;
                cursor: pointer;
            ">Cancel</button>
            <button id="reset-confirm-btn" style="
                padding: 10px 20px;
                border: none;
                background-color: #3F69BA;
                color: white;
                border-radius: 5px;
                cursor: pointer;
            ">Send Reset Link</button>
        </div>
    `;

    // Append the modal content to the modal
    modal.appendChild(modalContent);

    // Append the modal to the body
    document.body.appendChild(modal);

    // Close modal on Cancel button click
    document.getElementById("reset-cancel-btn").addEventListener("click", () => {
        document.body.removeChild(modal);
    });

    // Handle password reset on Confirm button click
    document.getElementById("reset-confirm-btn").addEventListener("click", async () => {
        const email = document.getElementById("reset-email").value.trim();
        const modalMessage = document.getElementById("modal-message");
        const modalButtons = document.getElementById("modal-buttons");

        if (email) {
            try {
                // Send password reset email
                await sendPasswordResetEmail(auth, email);
                modalMessage.innerHTML = `A password reset email has been sent to <strong>${email}</strong>. Please check your inbox.`;
                modalButtons.style.display = "none"; // Hide buttons after success
                // Optionally, you can hide the email input here
                document.getElementById("reset-email").style.display = "none";
            } catch (error) {
                const errorCode = error.code;
                let errorMessage;

                // Handle specific Firebase errors
                switch (errorCode) {
                    case "auth/invalid-email":
                        errorMessage = "Invalid email address. Please enter a valid email.";
                        break;
                    case "auth/user-not-found":
                        errorMessage = "No account found with this email address.";
                        break;
                    default:
                        errorMessage = "Failed to send password reset email. Please try again later.";
                }

                modalMessage.innerHTML = `<span style="color: red;">${errorMessage}</span>`;
            }
        } else {
            modalMessage.innerHTML = `<span style="color: red;">Email address is required to reset the password.</span>`;
        }
    });

    // Close modal when clicking outside of it
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
});


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

window.onload = () => {
    document.body.style.zoom = "80%";
};
