import { db, ref, get, set, remove, auth} from './firebaseConfig.mjs';
import { onAuthStateChanged, getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
// Store all batch data by year
let batchData = {};
let studentData = {};
let graphData;

const availableYears = [];

const batchesRef = ref(db, 'Batches');
const studentListRef = ref(db, 'studentList')

async function fetchApiForBatches() {

    try {
        const snapshot = await get(batchesRef);
        if (snapshot.exists()) {

            const allYears = snapshot.val();
            const yearKeys = Object.keys(allYears);
            console.log("BatchesData : ", allYears)
            console.log("years :", yearKeys)

            let lastBatchYear = null;
            let lastBatchKey = null;
            let lastBatchData = null;


            for (const yearKey of yearKeys) {
                const yearBatches = allYears[yearKey];
                const batchKeys = Object.keys(yearBatches);

                // Add the year only if it's not already in availableYears
                if (!availableYears.includes(yearKey)) {
                    availableYears.push(yearKey);
                }

                // Store batch data per year
                batchData[yearKey] = yearBatches;

                for (const batchKey of batchKeys) {
                    const currentBatchData = yearBatches[batchKey];
                    if (currentBatchData.active === "yes") {
                        lastBatchYear = yearKey;
                        lastBatchKey = batchKey;
                        lastBatchData = currentBatchData;

                    }
                }
            }

            initializeBatchData(lastBatchYear, availableYears);
            const selectedYear = document.getElementById('batchYearSelect').value; // Get the current selected year
            displayModuleAverages(lastBatchYear, lastBatchData.name);
        }
        else {
            console.log("No data available");
        }

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

async function fetchApiStudent() {

    const studentSnapshot = await get(studentListRef);
    if (studentSnapshot.exists()) {
        const allYears = studentSnapshot.val();
        const YearKeys = Object.keys(allYears);
        console.log("Student Data : ", allYears)
        console.log("studentYearKeys : ", YearKeys)

        for (const yearKey of YearKeys) {
            // Get the batch data for the current year
            const yearBatches = allYears[yearKey];
            console.log("yearBatches : ", yearBatches)

            // Get the batch keys for the current year's batches
            const batchKeys = Object.keys(yearBatches);
            console.log("batchKeys : ", batchKeys)


            // Store batch data for the year in batchData object
            studentData[yearKey] = yearBatches;
            console.log("student Data", studentData);
        }
    } else {
        console.log("No student data available");
    }
}


fetchApiStudent();
fetchApiForBatches();




// Initialize the dropdown and display for Firebase data
function initializeBatchData(lastBatchYear, availableYears) {

    // Populate dropdown and set latest year
    populateYearDropdown(availableYears);

    document.getElementById('batchYearSelect').value = lastBatchYear;
    DisplayBatchesUnderYear(lastBatchYear); // Display batches for the latest year

    const dropdown = document.getElementById('batchYearSelect')
    dropdown.addEventListener('change', (event) => {
        const selectedYear = event.target.value;
        DisplayBatchesUnderYear(selectedYear); // Pass the selected year
    });
}

// Function to populate the year dropdown
function populateYearDropdown(availableYears) {

    const dropdown = document.getElementById("batchYearSelect");
    dropdown.innerHTML = ""; // Clear existing dropdown options
    // Default option

    availableYears.forEach((year) => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        dropdown.appendChild(option);
    });
}

//function to Clear the Currently displayed batch from screen
function clearBatchesDisplay() {
    const batchLists = document.querySelector('.Config-Page-Right-batchLists');
    // if any batch lists displayed
    if (batchLists) {

        // Clear the inner content
        batchLists.innerHTML = '';
    }
}

document.getElementById('batchYearSelect').onchange = function () {
    DisplayBatchesUnderYear(this.value);
};


function getStudentCount(year, batchKey) {
    // Check if year and batchKey exist in studentData
    if (studentData[year] && studentData[year][batchKey]) {
        const studentIds = Object.keys(studentData[year][batchKey]);
        return studentIds.length; // Number of student IDs in the batch
    }
    return 0; // Return 0 if no data for the year or batch
}

function DisplayBatchesUnderYear(selectedYear) {

    // Clear previous batches displayed
    clearBatchesDisplay();


    if (selectedYear && batchData[selectedYear]) {
        // Get the batches for the selected year
        const batches = batchData[selectedYear];
        const students = studentData[selectedYear];
        console.log("students : ", students)

        // Display each batch for the selected year
        Object.keys(batches).forEach(batchKey => {
            const batch = batches[batchKey];

            // Get the number of students for this batch
            const studentCount = getStudentCount(selectedYear, batchKey);

            // Pass the batch and studentCount to displayBatch
            displayBatch(batch, studentCount);
        });
    } else {
        // If no specific year is selected, display all batches or handle accordingly
        for (const year in batchData) {
            Object.values(batchData[year]).forEach(batch => displayBatch(batch));
        }
    }
}

async function setActiveBatch(selectedYear, selectedBatchName) {

    try {
        const snapshot = await get(batchesRef);
        if (snapshot.exists()) {
            const allYears = snapshot.val();

            // Loop through each year
            for (const yearKey in allYears) {
                const yearBatches = allYears[yearKey];

                // Loop through each batch within the year
                for (const batchName in yearBatches) {
                    const currentBatchData = yearBatches[batchName];

                    // Update 'isActive' field based on the selected batch name
                    if (yearKey === selectedYear && batchName === selectedBatchName) {
                        currentBatchData.active = "yes";
                    } else {
                        currentBatchData.active = "no";
                    }
                }
            }
            // Write the updated data back to the database
            await set(batchesRef, allYears);
            fetchApiForBatches();
            showNotification(selectedBatchName + " activated successfully", 'success');
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error("Error updating active batch:", error);
        showNotification("Failed to activate batch", 'error');
    }
}

async function deleteBatch(selectedYear, selectedBatchName) {

    try {
        const batchRef = ref(db, `Batches/${selectedYear}/${selectedBatchName}`);

        // Remove the specific batch data
        await remove(batchRef);
        console.log("batch ref", batchRef)

        console.log(`Batch ${selectedBatchName} for year ${selectedYear} deleted successfully.`);

        // Re-fetch batches to update the UI after deletion
        fetchApiForBatches();
        showNotification(`${selectedBatchName} deleted successfully`, 'success');
    } catch (error) {
        console.error("Error deleting batch:", error);
        showNotification("Failed to delete batch", 'error');
    }

}

function displayBatch(batch, studentCount) {
    const eachBatchList = document.createElement('div');
    eachBatchList.classList.add('Config-Page-Right-eachBatchList');

    // Create container for labels
    const textContainer = document.createElement('div');
    textContainer.classList.add('Config-Page-Right-eachBatchList-textContainer');

    //created batch name box
    const batchNameBox = document.createElement('div');
    batchNameBox.classList.add('Config-Page-Right-eachBatchList-batchNameBox');

    const batchName = document.createElement('h2');
    batchName.textContent = batch.name;
    batchNameBox.appendChild(batchName);

    const dataBox = document.createElement('div');
    dataBox.classList.add('Config-Page-Right-eachBatchList-dataBox');

    //created label Box
    const labelBox = document.createElement('div');
    labelBox.classList.add('Config-Page-Right-eachBatchList-labelBox');

    const startDateLabel = document.createElement('p');
    startDateLabel.textContent = 'Start Date: ';
    labelBox.appendChild(startDateLabel);

    const endDateLabel = document.createElement('p');
    endDateLabel.textContent = 'End Date: ';
    labelBox.appendChild(endDateLabel);

    const numberOfBatchesLabel = document.createElement('p');
    numberOfBatchesLabel.textContent = 'No. of Students: ';
    labelBox.appendChild(numberOfBatchesLabel);

    //Created value box
    const valueBox = document.createElement('div');
    valueBox.classList.add('Config-Page-Right-eachBatchList-valueBox');

    const startDateValue = document.createElement('p');
    startDateValue.textContent = batch.startDate;
    valueBox.appendChild(startDateValue);

    const endDateValue = document.createElement('p');
    endDateValue.textContent = batch.endDate;
    valueBox.appendChild(endDateValue);

    const numberOfBatchesValue = document.createElement('p');
    numberOfBatchesValue.textContent = studentCount;
    valueBox.appendChild(numberOfBatchesValue);

    dataBox.appendChild(labelBox)
    dataBox.appendChild(valueBox)

    textContainer.appendChild(batchNameBox)
    textContainer.appendChild(dataBox)

    eachBatchList.appendChild(textContainer);

    // Create the first graph container for Tech Fundamentals
    const graphContainer1 = document.createElement('div')
    const graphContainer1Id = `${batch.batchName}`;
    graphContainer1.id = graphContainer1Id;
    graphContainer1.classList.add('Config-Page-Right-eachBatchList-graphContainer')


    // Add the click listener for outside clicks to hide the popup
    document.addEventListener('click', (event) => {
        const popup = document.getElementById('graphPopup');
        if (popup.style.display === 'block' && !popup.contains(event.target) && !event.target.closest('.Config-Page-Right-eachBatchList-graphContainer')) {
            hideGraphPopup();
        }
    });

    document.getElementById("add-batch-button").addEventListener("click", () => {
        // Navigate to Add-Batch.html
        window.location.href = "Batch-Entry.html";
    });

    eachBatchList.appendChild(graphContainer1);

    const activeBox = document.createElement('div')
    activeBox.classList.add('Config-Page-Right-eachBatchList-activeBox');


    const activeButton = document.createElement('button')
    activeButton.classList.add('Config-Page-Right-eachBatchList-activeButton');
    activeButton.textContent = batch.active === "yes" ? "Activated" : "Active"; // Set button text based on active status
    activeButton.disabled = batch.active === "yes"; // Disable button if the batch is active
    activeButton.onclick = () => {
        const selectedYear = document.getElementById('batchYearSelect').value; // Get the current selected year
        setActiveBatch(selectedYear, batch.name); // Call the function to set the active batch
    };
    activeBox.appendChild(activeButton)

    const deleteButton = document.createElement('button')
    deleteButton.classList.add('Config-Page-Right-eachBatchList-activeButton')
    deleteButton.textContent = 'Delete'
    deleteButton.onclick = () => {
        const selectedYear = document.getElementById('batchYearSelect').value;
        deleteBatch(selectedYear, batch.name);
    }
    activeBox.appendChild(deleteButton)
    const graphViewButton = document.createElement('button')
    graphViewButton.classList.add('Config-Page-Right-eachBatchList-activeButton')
    graphViewButton.textContent = 'View Graph'
    graphViewButton.onclick = () => {
        const selectedYear = document.getElementById('batchYearSelect').value; // Get the current selected year
        displayModuleAverages(selectedYear, batch.name);
    }
    activeBox.appendChild(graphViewButton)
    eachBatchList.appendChild(activeBox)


    // Append the complete batch element to the batchLists container
    const batchLists = document.querySelector(".Config-Page-Right-batchLists");
    batchLists.appendChild(eachBatchList);

}

async function displayModuleAverages(year, batchName,) {
    // Fetch the module averages as a percentage
    const moduleAverages = await fetchModuleAverages(year, batchName);
    console.log('Module Averages', moduleAverages)
  

    // Prepare data in a format suitable for the graph popup
    const graphData = {
        labels: Object.keys(moduleAverages),      // Module names as x-axis labels
        values: Object.values(moduleAverages)     // Percentage values as y-axis data
    };

    // Call the function to show the popup and pass the data
    showGraphPopup(null, { graphs: { 'Tech Fundamentals': graphData } }, 'Tech Fundamentals', batchName);
}


async function fetchModuleAverages(year, batchName, maxScore = 100) {
    // Initialize the output object
    const moduleAverages = {};

    // Step 1: Fetch module headers from `Batches/${year}/${batchName}/modules`
    const modulesRef = ref(db, `Batches/${year}/${batchName}/modules`);
    const modulesSnapshot = await get(modulesRef);
    const modules = modulesSnapshot.exists() ? modulesSnapshot.val() : {};

    // Step 2: Loop through each module to fetch students' marks from `Marks/${year}/${batchName}/${moduleKey}/students`
    for (const moduleKey of Object.keys(modules)) {
        const criteriaRef = ref(db, `Batches/${year}/${batchName}/modules/${moduleKey}/criteria`);

        // Fetch criteriaName
        const criteriaSnapshot = await get(criteriaRef);
        const criteriaName = criteriaSnapshot.val();

        // Reference to the Evaluation Criteria based on the criteriaName
        const evalCriteriaRef = ref(db, `Evaluation Criteria/${criteriaName}`);

        // Fetch all keys within criteriaName and sum up the points
        const evalCriteriaSnapshot = await get(evalCriteriaRef);
        maxScore = 0;

        // Summing the points in the Evaluation Criteria
        evalCriteriaSnapshot.forEach((childSnapshot) => {
            const points = parseFloat(childSnapshot.child('points').val()) || 0;
            maxScore += points;
        });
        console.log('max score', maxScore)

        const studentListRef = ref(db, `marks/${year}/${batchName}/${moduleKey}/students`);
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
        const percentage = (averageScore / maxScore) * 100;

        // Add the percentage average for the module to the output object
        moduleAverages[moduleKey] = percentage;
    }

    console.log(moduleAverages);
    return moduleAverages;
}

// Function to show the graph popup
function showGraphPopup(event, batch, graphType, batchName) {

    const popup = document.getElementById('graphPopup');
    const graphContent = document.getElementById('graphContent');
    const batchYear = document.getElementById("batchYearSelect").value

    // Clear previous graph content
    graphContent.innerHTML = '';

    console.log("graphTypes:", graphType)
    console.log("batch.graphs:", batch.graphs)

    const graphData = batch.graphs[graphType];
    console.log("graphData", graphData)
    // Render Plotly graph in the popup
    // const xArray = ["OOPS", "DBMS", "HTML", "ClOUD", "AGILE","GIT", "Mini Project", "Main Project"];
    // const yArray = [74, 99, 84, 94, 75, 96, 76, 90,];
    let data
    if (graphData) {
        data = [{
            x: graphData.labels,
            y: graphData.values,
            type: "bar",
            orientation: "v",
            marker: { color: "rgb(150, 124, 207)" }
        }];
    }

    const layout = { title: `Average Module Scores as Percentage for ${batchName} - ${batchYear}`,
    xaxis: {
        title: 'Modules' // Label for the x-axis
    },
    yaxis: {
        title: 'Average (%)' // Label for the y-axis
    }
};

    Plotly.newPlot("graphContent", data, layout);
    // Center the popup in the middle of the viewport
    const popupWidth = 400; // Set your popup width
    const popupHeight = 300; // Set your popup height
    const offset = 325; // Adjust this value to move the popup left
    const offsetTop = 50; // Adjust this value to move the popup up

    popup.style.left = (window.innerWidth - popupWidth - 20 - offset) + 'px'; // 20px margin + offset
    popup.style.top = (window.innerHeight / 2 - popupHeight / 2 - offsetTop) + 'px'; // Vertically centered with top offset
    popup.style.display = 'block'; // Ensure the popup is visible

}

// Function to hide the graph popup
function hideGraphPopup() {
    const popup = document.getElementById('graphPopup');
    popup.style.display = 'none';
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
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Sign out error:", error);
        });
});


function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${type}`;

    // Style the notification (you can also add CSS classes for this)
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.style.transition = 'opacity 0.5s ease';

    document.body.appendChild(notification);

    // Remove the notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500); // Wait for fade-out
    }, 3000);
}

//checking