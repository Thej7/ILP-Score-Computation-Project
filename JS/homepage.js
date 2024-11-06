import { db, ref, get, set, remove, auth} from './firebaseConfig.mjs';
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
                    container.appendChild(phaseHeading);
                
                    const moduleContainer = document.createElement("div");
                    moduleContainer.classList.add("module-container");
                
                    for (const moduleData of phaseGroups[phase]) {
                        const containerphasecard = document.createElement("div");
                        containerphasecard.classList.add("containerphasecard");
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
                
                        if (studentListSnapshot.exists()) {
                            const students = studentListSnapshot.val();
                
                            // Calculate total scores and count of students for the module
                            for (const id in students) {
                                const studentData = students[id];
                                totalScore += studentData.total || 0; // Add student score to the total
                                studentCount++; // Count the student
                            }
                        }
                
                        // Calculate average score for the module if there are students
                        const averageScore = studentCount > 0 ? totalScore / studentCount : 0;
                
                        // Convert average score to a percentage based on maxScore
                        const percentage = Math.round((averageScore / maxScore) * 100);
                
                        card.innerHTML = "Avg Score " + percentage + "%";
                        const phasename = document.createElement("div");
                        phasename.classList.add("phasename");
                        phasename.innerHTML = `<h1>${moduleData.moduleName}</h1>`;
                        console.log("moduleData", moduleData.moduleName);
                        
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
                
                        containerphasecard.appendChild(card);
                        containerphasecard.appendChild(phasename);
                        moduleContainer.appendChild(containerphasecard);
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

document.getElementById("view-report").addEventListener("click", () => {
    const referrerURL = document.referrer;
    const referrerPage = referrerURL.split("/").pop(); // Extracts just the page name

    let targetPage = "Report.html"; // Default page

    if (referrerPage === "Admin-Homepage.html") {
        targetPage = "Admin-Report.html";
    } else if (referrerPage === "Trainer-Homepage.html") {
        targetPage = "Trainer-Report.html";
    }

    window.location.href = targetPage;
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

getLastAddedBatch();