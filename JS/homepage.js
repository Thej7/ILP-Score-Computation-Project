import { db, ref, get } from './firebaseConfig.mjs';

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
                        card.innerHTML = `<h1>${moduleData.moduleName}</h1><img src="Graph.png">`;
                        card.onclick = () => {
                            // Store selected phase and module, along with last active batch data
                            localStorage.setItem("selectedPhase", phase);
                            localStorage.setItem("selectedModule", moduleData.moduleName);
                            localStorage.setItem("lastBatchData", JSON.stringify(lastBatchData));
                            localStorage.setItem("lastBatchKey", lastBatchKey);
                            console.log(lastBatchKey);
                            // Store whole last batch data
                            localStorage.setItem("lastBatchYear", lastBatchYear); // Store the year of the batch

                            window.location.href = "TrainerAssessment.html";
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
