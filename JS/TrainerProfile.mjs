import { onAuthStateChanged, sendPasswordResetEmail, getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { db, ref, get, set, remove, auth} from './firebaseConfig.mjs';



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
// Reset password
function closePopup() {
    document.getElementById("popupMessage").style.display = "none";
}

// Add the DOMContentLoaded event for other code
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("reset_form").addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("resetEmail").value;

        sendPasswordResetEmail(auth, email)
            .then(() => {
                showPopup("Reset Password link sent to your Email");
            })
            .catch((error) => {
                console.log("Invalid Email Address");
                showPopup("Invalid Email Address");
            });
    });

    document.querySelector(".close-button").addEventListener("click", closePopup);

    function showPopup(message) {
        document.getElementById("popupText").innerText = message;
        document.getElementById("popupMessage").style.display = "flex";
    }

    function closePopup() {
        document.getElementById("popupMessage").style.display = "none";
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user.email);
    } else {
        window.location.href = "loginMain.html";
    }
}); 

document.getElementById("logout_button").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            // localStorage.setItem("logoutMessage", "Logged out successfully.");
            window.location.href = "./loginMain.html";
        })
        .catch((error) => {
            console.error("Sign out error:", error);
        });
});

