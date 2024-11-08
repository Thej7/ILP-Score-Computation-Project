import { db, ref, get, set, remove, auth } from './firebaseConfig.mjs';
import { onAuthStateChanged, getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const lastBatchKey = localStorage.getItem("lastBatchKey");
const lastBatchYear = localStorage.getItem("lastBatchYear");

const tableBody = document.getElementById('table-body');
const sortNameAZ = document.getElementById('sort-alpha')
const sortHighest5Btn = document.getElementById('sort-highest-5');
const sortLowest5Btn = document.getElementById('sort-lowest-5');
const showAllBtn = document.getElementById('show-all');
const downloadBtn = document.getElementById('download-btn');

let fullData = [];
let json;
let weightJson = [];

async function fetchData(jsonData) {
    try {
        // Directly use the provided JSON data instead of fetching from a file
        const json = jsonData;

        // Check JSON structure and render if correct
        if (json.headers && json.data) {
            renderHead(json.headers);
            fullData = json.data;
            renderTable(fullData);
        } else {
            console.log("JSON structure is incorrect.");
        }
    } catch (error) {
        console.log('Error processing JSON data:', error);
    }
}

async function fetchFirebase(year, batchName) {
    // Step 1: Fetch module headers from `Batches/${year}/${batchName}/modules`
    const modulesRef = ref(db, `Batches/${year}/${batchName}/modules`);
    const modulesSnapshot = await get(modulesRef);
    const modules = modulesSnapshot.exists() ? modulesSnapshot.val() : {};

    // Fetch total weightage for each module
    for (const moduleName of Object.keys(modules)) {
        const weightageRef = ref(db, `Batches/${year}/${batchName}/modules/${moduleName}/totalWeightage`);
        const weightageSnapshot = await get(weightageRef);

        if (weightageSnapshot.exists()) {
            const totalWeightage = weightageSnapshot.val();
            weightJson.push({
                modulename: moduleName,
                weightage: totalWeightage
            });
        }
    }

    console.log(weightJson);

    // Add "Name" as the first header
    const headers = ["Name", ...Object.keys(modules)];

    // Step 2: Initialize jsonData with headers and a map for students
    let jsonData = {
        headers,
        data: []
    };
    const studentMap = {};

    // Fetch all student names once
    const studentNamesRef = ref(db, `studentList/${year}/${batchName}`);
    const studentNamesSnapshot = await get(studentNamesRef);
    const studentNames = studentNamesSnapshot.exists() ? studentNamesSnapshot.val() : {};

    // Step 3: Loop through each module key to fetch students' marks
    for (const moduleKey of headers.slice(1)) {
        const studentListRef = ref(db, `marks/${year}/${batchName}/${moduleKey}/students`);
        const studentListSnapshot = await get(studentListRef);

        if (studentListSnapshot.exists()) {
            const students = studentListSnapshot.val();

            // For each student, retrieve "name" and "total"
            for (const id in students) {
                const studentData = students[id];
                const studentName = studentNames[id]?.Name || "Unknown";

                // Initialize the student's row if not already present
                if (!studentMap[id]) {
                    studentMap[id] = [studentName, ...headers.slice(1).map(() => null)];
                }

                // Update the student's mark for the current module
                const moduleIndex = headers.indexOf(moduleKey);
                if (moduleIndex >= 0) {
                    studentMap[id][moduleIndex] = studentData.total || 0;
                }
            }
        }
    }

    // Convert studentMap to jsonData.data
    jsonData.data = Object.values(studentMap);
    jsonData = transformJsonData(jsonData, weightJson);

    console.log("jsonData", jsonData);
    return jsonData;
}

let sortDirection = {}; // Keeps track of the sorting direction for each column

// Initialize headers and make each module header clickable
function initializeHeaders(headers) {
    const headerRow = document.getElementById('table-head');
    headerRow.innerHTML = ''; // Clear any existing headers

    headers.forEach((header, index) => {
        const th = document.createElement('th');
        th.textContent = header;

        // Make module headers clickable for sorting by highest score
        if (index > 0) {  // Skip the "Name" column
            th.addEventListener('click', () => sortColumnByHighestScore(index));
        }

        headerRow.appendChild(th);
    });
}

// Sort data by the selected module's score in descending or ascending order
function sortColumnByHighestScore(columnIndex) {
    if (!fullData || fullData.length === 0) return;

    // Check the current sorting direction for this column, default is descending
    let direction = sortDirection[columnIndex] || 'descending';

    // Sort data based on the direction
    const sortedData = [...fullData].sort((a, b) => {
        const scoreA = parseFloat(a[columnIndex]) || 0;
        const scoreB = parseFloat(b[columnIndex]) || 0;

        // Toggle between descending and ascending sorting
        if (direction === 'descending') {
            return scoreB - scoreA; // Sort descending for highest score
        } else {
            return scoreA - scoreB; // Sort ascending for lowest score
        }
    });

    // Reinsert the first student at the top of the sorted data
    renderTable(sortedData);

    // Toggle the sorting direction for next click
    sortDirection[columnIndex] = direction === 'descending' ? 'ascending' : 'descending';
}


function renderHead(headings) {
    const tableHead = document.getElementById('table-head')
    tableHead.innerHTML = '';
    const tr = document.createElement('tr')
    headings.forEach(heading => {
        const th = document.createElement('th')
        th.textContent = heading
        tr.appendChild(th)
        console.log('table handings are rendered')

    })
    tableHead.appendChild(tr)

}

function renderTable(data) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Clear existing table data

    data.forEach(student => {
        const row = document.createElement('tr');
        student.forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });
}

function transformJsonData(jsonData, weightJson) {
    // Initialize the new headers with the first header unchanged ("Name")
    const transformedHeaders = [jsonData.headers[0]];

    // Create a lookup map for weightage based on weightJson
    const weightMap = {};
    if (Array.isArray(weightJson)) {
        for (let i = 0; i < weightJson.length; i++) {
            const { modulename, weightage } = weightJson[i];
            if (modulename && weightage !== undefined) {
                weightMap[modulename] = weightage;
            }
        }
    }
    console.log("weight map", weightMap);

    // Loop through headers starting from the second element
    for (let i = 1; i < jsonData.headers.length; i++) {
        const moduleName = jsonData.headers[i];
        transformedHeaders.push(`${moduleName} mark`, `${moduleName} weight`);
    }

    // Initialize the transformed data array
    const transformedData = jsonData.data.map(row => {
        // Start the transformed row with the first element unchanged ("Name")
        const transformedRow = [row[0]];

        // Loop through the data values starting from the second element
        for (let j = 1; j < row.length; j++) {
            const moduleName = jsonData.headers[j];
            const mark = row[j];
            const weightage = weightMap[moduleName] || 0; // Default to 0 if not found

            // Calculate the weight using the specific weightage of the module
            const weight = ((mark / 50) * weightage).toFixed(2);
            transformedRow.push(mark, weight);
        }

        return transformedRow;
    });

    return {
        headers: transformedHeaders,
        data: transformedData
    };
}


// Function to search and filter the table
function searchTable() {
    const searchInput = document.getElementById('Search_input').value.toLowerCase();
    const tableBody = document.getElementById('table-body');
    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;

        // Check if the name matches the search input
        if (cells[0]) {
            const name = cells[0].textContent.toLowerCase();
            if (name.includes(searchInput)) {
                found = true;
            }
        }


        rows[i].style.display = found ? '' : 'none';
    }
}

function calculateTotalMarks(student) {
    // Remove any null, undefined, or non-numeric marks, then sum up
    return student.slice(1).reduce((sum, mark) => {
        const numericMark = parseFloat(mark);
        return !isNaN(numericMark) ? sum + numericMark : sum;
    }, 0);
}

// Sort and render the top 5 entries by total marks
function sortTop5() {
    const filteredData = fullData.filter(entry => {
        const totalMarks = calculateTotalMarks(entry);
        return totalMarks > 0; // Filter out entries with non-numeric or zero marks
    });

    const sortedData = filteredData.sort((a, b) => calculateTotalMarks(b) - calculateTotalMarks(a));
    renderTable(sortedData.slice(0, 5)); // Top 5 entries
}

// Sort and render the bottom 5 entries by total marks
function sortBottom5() {
    const filteredData = fullData.filter(entry => {
        const totalMarks = calculateTotalMarks(entry);
        return totalMarks > 0; // Filter out entries with non-numeric or zero marks
    });

    const sortedData = filteredData.sort((a, b) => calculateTotalMarks(a) - calculateTotalMarks(b));
    renderTable(sortedData.slice(0, 5)); // Bottom 5 entries
}


// Sort A-Z by Name
function sortByName() {
    const sortedData = [...fullData].sort((a, b) => a[0].localeCompare(b[0])); // Sort by name (first column)
    renderTable(sortedData);
}


// Function to show all rows (re-render fullData)
function showAll() {
    const filteredData = fullData.filter(entry => {
        const totalMarks = calculateTotalMarks(entry);
        return totalMarks > 0; // Filter out entries with non-numeric or zero marks
    });

    const sortedData = filteredData.sort((a, b) => calculateTotalMarks(b) - calculateTotalMarks(a));
    renderTable(sortedData); // Top 5 entries
}

// Download function for exporting the table as Excel
function downloadExcel() {
    const table = document.getElementById('marklist-table');
    const workbook = XLSX.utils.table_to_book(table);
    XLSX.writeFile(workbook, 'marklist_batch5.xlsx');
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

// Event listeners for buttons
sortNameAZ.addEventListener('click', sortByName)
sortHighest5Btn.addEventListener('click', sortTop5);
sortLowest5Btn.addEventListener('click', sortBottom5);
showAllBtn.addEventListener('click', showAll); // Re-renders the full dataset
downloadBtn.addEventListener('click', downloadExcel);
document.getElementById('Search_input').addEventListener('input', searchTable);


// Fetch data and render the table on page load
window.onload = async function () {
    // Show the loader
    document.getElementById("loader").style.display = "block";

    try {
        // Start loading the data
        json = await fetchFirebase(lastBatchYear, lastBatchKey);
        fetchData(json);
        initializeHeaders(json.headers);
    } catch (error) {
        console.error("Error loading data:", error);
    } finally {
        // Hide the loader
        document.getElementById("loader").style.display = "none";
    }
};