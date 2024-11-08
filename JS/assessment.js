import { db, ref, get, set, remove, auth} from './firebaseConfig.mjs';
import { onAuthStateChanged, getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
let studentsList;
async function getLastAddedBatch() {
    const batchesRef = ref(db, 'Batches');

    try {
        const snapshot = await get(batchesRef);
        if (snapshot.exists()) {
            const allYears = snapshot.val();
            const yearKeys = Object.keys(allYears);

            let lastBatchYear = null;
            let lastBatchKey = null;
            let lastBatchData = null;

            // Loop through each year to find the last active batch
            for (const yearKey of yearKeys) {
                const yearBatches = allYears[yearKey];
                const batchKeys = Object.keys(yearBatches);

                for (const batchKey of batchKeys) {
                    const currentBatchData = yearBatches[batchKey];
                    if (currentBatchData.active === "yes") {
                        lastBatchYear = yearKey;
                        
                        lastBatchKey = batchKey;
                        localStorage.setItem("lastBatchKey",lastBatchKey);
                        console.log(lastBatchKey);
                        lastBatchData = currentBatchData;
                       
                    }
                }
            }

            // Display the batch data and populate module cards
            if (lastBatchData && lastBatchData.modules) {
                document.getElementById("batchName").innerHTML = `Score Assessment: ${lastBatchKey}`;
                document.getElementById("startDate").innerHTML = `Start Date&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;${lastBatchData.startDate}`;
                document.getElementById("endDate").innerHTML = `End Date&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;${lastBatchData.endDate}`;
                const container = document.getElementById("phaseName");
                const phaseGroups = {};

                Object.keys(lastBatchData.modules).forEach(moduleKey => {
                    const moduleData = lastBatchData.modules[moduleKey];
                    if (!phaseGroups[moduleData.phase]) {
                        phaseGroups[moduleData.phase] = [];
                    }
                    phaseGroups[moduleData.phase].push(moduleData);
                });

                Object.keys(phaseGroups).forEach(phase => {
                    const phaseHeading = document.createElement("h2");
                    phaseHeading.classList.add("phase");
                    phaseHeading.textContent = phase;
                    container.appendChild(phaseHeading);

                    const moduleContainer = document.createElement("div");
                    moduleContainer.classList.add("module-container");

                    phaseGroups[phase].forEach(moduleData => {
                        const card = document.createElement("div");
                        card.classList.add("card");
                        card.innerHTML = `<h1>${moduleData.moduleName}</h1><img src="./Assets/Graph.png" class="card-image">`;
                        card.onclick = () => {
                            // Store selected phase and module, along with last active batch data
                            localStorage.setItem("selectedPhase", phase);
                            localStorage.setItem("selectedModule", moduleData.moduleName);
                            localStorage.setItem("lastBatchData", JSON.stringify(lastBatchData));
                            localStorage.setItem("lastBatchKey",lastBatchKey);
                           console.log(lastBatchKey);
                           // Store whole last batch data
                            localStorage.setItem("lastBatchYear", lastBatchYear); // Store the year of the batch

                            window.location.href = "Mark-Entry.html";
                        };
                        moduleContainer.appendChild(card);
                    });

                    container.appendChild(moduleContainer);
                });
            }
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

getLastAddedBatch();
const lastBatchYear = localStorage.getItem("lastBatchYear");
const lastBatchKey = localStorage.getItem("lastBatchKey");
async function fetchStudentList() {
    const studentListRef = ref(db, `studentList/${lastBatchYear}/${lastBatchKey}`);
    console.log(`Fetching data from: ${studentListRef.toString()}`); // Log the path
    const studentNames = []; // Array to store student names

    try {
        const snapshot = await get(studentListRef);
        if (snapshot.exists()) {
            const students = snapshot.val();
            
            // Collect each student's name in the studentNames array
            Object.keys(students).forEach((studentId) => {
                const student = students[studentId];
                console.log("studentname"+student.Name); // Log each student's name
                studentNames.push(student.Name); // Add the name to the array
            });
        } else {
            console.log("No data available for the specified path.");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }

    return studentNames; // Return the list of student names
}

studentsList = await fetchStudentList()
document.getElementById("numberOfTrainees").innerHTML ="Number of Trainees&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;"+studentsList.length;



const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour

let inactivityTimer;

// Function to reset the inactivity timer
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        // Log out the user after 1 hour of inactivity
        signOut(auth)
            .then(() => {
                console.log("User signed out due to inactivity");
                window.location.href = "index.html";
            })
            .catch((error) => {
                console.error("Error signing out:", error);
            });
    }, INACTIVITY_TIMEOUT);
}

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user.email);

        // Reset inactivity timer whenever the user is authenticated
        resetInactivityTimer();

        // Monitor user activity to reset the timer on interaction
        document.addEventListener("mousemove", resetInactivityTimer);
        document.addEventListener("keypress", resetInactivityTimer);
    } else {
        // Redirect to login page if no user is signed in
        window.location.href = "index.html";
    }
}); 

document.getElementById("logout_button").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            // localStorage.setItem("logoutMessage", "Logged out successfully.");
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Sign out error:", error);
        });
});
