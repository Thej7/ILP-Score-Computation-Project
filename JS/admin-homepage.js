import { db, ref, get, set, remove, auth } from './firebaseConfig.mjs';
import { onAuthStateChanged, getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

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
                        localStorage.setItem("lastBatchKey", lastBatchKey);
                        localStorage.setItem("lastBatchYear", lastBatchYear)
                        console.log(lastBatchKey);
                        lastBatchData = currentBatchData;

                    }
                }
            }

            // Display the batch data and populate module cards
            if (lastBatchData && lastBatchData.modules) {
                document.getElementById("batchName").innerHTML = `Overview: ${lastBatchKey}`;
                const container = document.getElementById("phaseName");
                const phaseGroups = {};

                Object.keys(lastBatchData.modules).forEach(moduleKey => {
                    const moduleData = lastBatchData.modules[moduleKey];
                    if (!phaseGroups[moduleData.phase]) {
                        phaseGroups[moduleData.phase] = [];
                    }
                    phaseGroups[moduleData.phase].push(moduleData);
                });

                for (const phase of Object.keys(phaseGroups)) {
                    const phaseHeading = document.createElement("h2");
                    phaseHeading.classList.add("phase");
                    phaseHeading.textContent = phase;
                    const button = document.createElement('button');
                    button.id = 'view-report';
                    button.textContent = 'View Report';



                    button.addEventListener("click", () => {
                        localStorage.setItem('setPhase', phase);
                        window.location.href = "Admin-Report.html";
                    });

                    container.appendChild(phaseHeading);
                    container.appendChild(button);

                    const moduleContainer = document.createElement("div");
                    moduleContainer.classList.add("module-container");



                    for (const moduleData of phaseGroups[phase]) {

                        const card = document.createElement("div");
                        card.classList.add("card");

                        const criteriaRef = ref(db, `Batches/${lastBatchYear}/${lastBatchKey}/modules/${moduleData.moduleName}/criteria`);

                        // Fetch criteriaName
                        const criteriaSnapshot = await get(criteriaRef);
                        const criteriaName = criteriaSnapshot.val();

                        // Reference to the Evaluation Criteria based on the criteriaName
                        const evalCriteriaRef = ref(db, `Evaluation Criteria/${criteriaName}`);

                        // Fetch all keys within criteriaName and sum up the points
                        const evalCriteriaSnapshot = await get(evalCriteriaRef);
                        let maxScore = 0;

                        // Summing the points in the Evaluation Criteria
                        evalCriteriaSnapshot.forEach((childSnapshot) => {
                            const points = parseInt(childSnapshot.child('points').val()) || 0;
                            maxScore += points;
                        });
                        console.log('max score', maxScore);

                        const studentListRef = ref(db, `marks/${lastBatchYear}/${lastBatchKey}/${moduleData.moduleName}/students`);
                        const studentListSnapshot = await get(studentListRef);

                        let totalScore = 0;
                        let studentCount = 0;
                        let scoreHigh = 0;
                        let scoreMid = 0;
                        let scoreLow = 0;

                        if (studentListSnapshot.exists()) {
                            const students = studentListSnapshot.val();

                            // Calculate total scores and count of students for the module
                            for (const id in students) {
                                const studentData = students[id];
                                totalScore += studentData.total || 0; // Add student score to the total
                                const studentPercent = (studentData.total/maxScore)*100;
                                if (studentPercent >= 80) {
                                    scoreHigh++;
                                }
                                else if (studentPercent >= 60) {
                                    scoreMid++;
                                }
                                else if (studentPercent < 60) {
                                    scoreLow++;
                                }
                                studentCount++; // Count the student
                            }
                        }

                        // Calculate average score for the module if there are students
                        const averageScore = studentCount > 0 ? totalScore / studentCount : 0;

                        // Convert average score to a percentage based on maxScore
                        const percentage = Math.round((averageScore / maxScore) * 100);


                        const phasename = document.createElement("div");
                        phasename.classList.add("phasename");
                        phasename.innerHTML = `<h1>${moduleData.moduleName}</h1>`;
                        // card.innerHTML = "Avg Score " + percentage + "%";
                        console.log("moduleData", moduleData.moduleName);

                        // Create a unique div for the chart
                        const chartDiv = document.createElement("div");
                        chartDiv.id = `chart-${moduleData.moduleName}`;  // Unique ID for each chart

                        let data

                        data = [{
                            x: ["80 above", "60-80", "below 60"],
                            y: [scoreHigh, scoreMid, scoreLow],  // Dynamic data goes here
                            type: "bar",
                            orientation: "v",
                            marker: { color: "rgb(150, 124, 207)" }
                        }];

                        const layout = {
                            title: `${moduleData.moduleName} `,
                            grid: { rows: 1, columns: 2, pattern: 'independent' }, // Two graphs in a single row
                            height: 400,  // Height of the entire plot (both graphs will share this height)
                            width: 600,
                            showlegend: false,  // Hide legends for simplicity (you can turn it on if needed)
                            xaxis: {
                                title: 'Score Range' // Label for the x-axis
                            },
                            yaxis: {
                                title: 'Number of students', // Label for the y-axis
                                range: [0, studentCount]
                            },
                            // bargap: 0.1, // Controls the gap between bars (default is 0.2)
                            // bargroupgap: 0.1, // Controls the gap between bar groups (default is 0.15)
                            // barmode: "group" // Group bars together
                        };
                        // Create the mode bar configuration to hide it
                        let config = {
                            displayModeBar: false  // Disable the mode bar entirely
                        };

                        Plotly.newPlot(chartDiv, data, layout, config);


                        // card.onclick = () => {
                        //     // Store selected phase and module, along with last active batch data
                        //     localStorage.setItem("selectedPhase", phase);
                        //     localStorage.setItem("selectedModule", moduleData.moduleName);
                        //     localStorage.setItem("lastBatchData", JSON.stringify(lastBatchData));
                        //     localStorage.setItem("lastBatchKey", lastBatchKey);
                        //     console.log(lastBatchKey);
                        //     // Store whole last batch data
                        //     localStorage.setItem("lastBatchYear", lastBatchYear); // Store the year of the batch

                        //     window.location.href = "TrainerAssessment.html";
                        // };

                        card.appendChild(chartDiv);
                        moduleContainer.appendChild(card);
                    }

                    container.appendChild(moduleContainer);
                }

            }
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

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
            window.location.href = "./index.html";
        })
        .catch((error) => {
            console.error("Sign out error:", error);
        });
});

getLastAddedBatch();

window.onload = () => {
    document.body.style.zoom = "80%";
};