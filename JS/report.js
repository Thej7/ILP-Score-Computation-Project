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

const neededPhase = localStorage.getItem('setPhase');

let fullData = [];
let json;
let weightJson = [];
let extendedHeaders = [];
let checker;

async function fetchData(jsonData) {
    try {
        // Directly use the provided JSON data instead of fetching from a file
        const json = jsonData;
        console.log("JSON", json)

        // Check JSON structure and render if correct
        if (json.headers && json.data) {
            extendedHeaders = [...json.headers, 'Total'];
            renderHead(extendedHeaders);
            fullData = json.data;
            checker = true;
            const sortedData = [...fullData].sort((a, b) => a[0].localeCompare(b[0])); // Sort by name (first column)
            renderTable(sortedData, checker);
        } else {
            console.log("JSON structure is incorrect.");
        }
    } catch (error) {
        console.log('Error processing JSON data:', error);
    }
}

async function fetchProject(jsonData) {
    try {
        // Directly use the provided JSON data instead of fetching from a file
        const json = jsonData;
        console.log("JSON", json)

        // Check JSON structure and render if correct
        if (json.criteriaHeaders && json.data) {
            extendedHeaders = [...json.criteriaHeaders, 'Total'];
            renderHead(extendedHeaders);
            fullData = json.data;
            checker = false;
            const sortedData = [...fullData].sort((a, b) => a[0].localeCompare(b[0])); // Sort by name (first column)
            renderTable(sortedData, checker);
        } else {
            console.log("JSON structure is incorrect.");
        }
    } catch (error) {
        console.log('Error processing JSON data:', error);
    }
}

async function fetchFirebaseTotal(year, batchName, neededPhase) {
    // Step 1: Fetch module headers from `Batches/${year}/${batchName}/modules`
    const modulesRef = ref(db, `Batches/${year}/${batchName}/modules`);
    const modulesSnapshot = await get(modulesRef);
    const modules = modulesSnapshot.exists() ? modulesSnapshot.val() : {};

    // Initialize arrays for weightage data
    let weightJson = [];
    let criteriaMod = {};

    // Fetch total weightage for each module if the phase matches `neededPhase`
    for (const moduleName of Object.keys(modules)) {
        const phaseRef = ref(db, `Batches/${year}/${batchName}/modules/${moduleName}/phase`);
        const criteriaRef = ref(db, `Batches/${year}/${batchName}/modules/${moduleName}/criteria`);

        const [phaseSnapshot, criteriaSnapshot] = await Promise.all([
            get(phaseRef),
            get(criteriaRef)
        ]);

        if (phaseSnapshot.exists() && phaseSnapshot.val() === neededPhase) {
            criteriaMod[moduleName] = criteriaSnapshot.exists() ? criteriaSnapshot.val() : {};
            const weightageRef = ref(db, `Batches/${year}/${batchName}/modules/${moduleName}/totalWeightage`);
            const weightageSnapshot = await get(weightageRef);

            if (weightageSnapshot.exists()) {
                weightJson.push({
                    modulename: moduleName,
                    weightage: weightageSnapshot.val()
                });
            }
        }
    }

    // Get matching modules
    const matchingModules = await Promise.all(Object.keys(modules).map(async (moduleName) => {
        const phaseRef = ref(db, `Batches/${year}/${batchName}/modules/${moduleName}/phase`);
        const phaseSnapshot = await get(phaseRef);
        return (phaseSnapshot.exists() && phaseSnapshot.val() === neededPhase) ? moduleName : null;
    }));

    const headers = ["Name", ...matchingModules.filter(module => module !== null)];
    let jsonData = { headers, data: [] };

    // Fetch student list first
    const studentNamesRef = ref(db, `studentList/${year}/${batchName}`);
    const studentNamesSnapshot = await get(studentNamesRef);
    const studentNames = studentNamesSnapshot.exists() ? studentNamesSnapshot.val() : {};

    // Create a map of normalized names to student IDs and original names
    const normalizedNameMap = {};
    for (const id in studentNames) {
        const name = studentNames[id]?.Name;
        if (name) {
            const normalizedName = name.toLowerCase().trim();
            normalizedNameMap[normalizedName] = { id, originalName: name };
        }
    }

    // Create a map to store all student data
    const studentDataMap = {};

    // Initialize data structure for all students from studentList
    for (const id in studentNames) {
        const name = studentNames[id]?.Name;
        if (name) {
            studentDataMap[id] = {
                name: name,
                marks: {}
            };
        }
    }

    // Fetch and process marks for each module
    for (const moduleKey of headers.slice(1)) {
        const studentListRef = ref(db, `marks/${year}/${batchName}/${moduleKey}/students`);
        const studentListSnapshot = await get(studentListRef);

        if (studentListSnapshot.exists()) {
            const students = studentListSnapshot.val();

            for (const markId in students) {
                const studentData = students[markId];
                const marksName = studentData.studentName?.toLowerCase().trim();
                
                // Find matching student from studentList
                let matchedId = markId;
                if (normalizedNameMap[marksName]) {
                    matchedId = normalizedNameMap[marksName].id;
                }

                // If student exists in studentDataMap, update their marks
                if (studentDataMap[matchedId]) {
                    studentDataMap[matchedId].marks[moduleKey] = studentData.total || 0;
                }
            }
        }
    }

    // Convert studentDataMap to array format for jsonData
    jsonData.data = Object.entries(studentDataMap).map(([id, data]) => {
        const row = [data.name];
        headers.slice(1).forEach(moduleKey => {
            row.push(data.marks[moduleKey] || null);
        });
        return row;
    });

    // Sort data by student name
    jsonData.data.sort((a, b) => a[0].localeCompare(b[0]));

    jsonData = transformJsonData(jsonData, weightJson, criteriaMod);
    console.log("Final jsonData", jsonData);
    return jsonData;
}

async function fetchFirebaseOverall(year, batchName, neededPhase) {
    // Fetch module headers and initialize criteriaHeaders
    const modulesRef = ref(db, `Batches/${year}/${batchName}/modules`);
    const modulesSnapshot = await get(modulesRef);
    const modules = modulesSnapshot.exists() ? modulesSnapshot.val() : {};

    const matchingModules = await Promise.all(Object.keys(modules).map(async (moduleName) => {
        const phaseRef = ref(db, `Batches/${year}/${batchName}/modules/${moduleName}/phase`);
        const [phaseSnapshot] = await Promise.all([get(phaseRef)]);
        return (phaseSnapshot.exists() && phaseSnapshot.val() === neededPhase) ? moduleName : null;
    }));

    // Fetch criteria data for headers
    const criteriaRef = ref(db, `Evaluation Criteria/Final Assessment`);
    const criteriaSnapshot = await get(criteriaRef);
    const criteriaData = criteriaSnapshot.exists() ? criteriaSnapshot.val() : {};

    const matchingHeaders = await Promise.all(Object.keys(criteriaData).map(async (criteriaKey) => {
        const nameRef = ref(db, `Evaluation Criteria/Final Assessment/${criteriaKey}/name`);
        const nameSnapshot = await get(nameRef);
        return nameSnapshot.exists() ? nameSnapshot.val() : null;
    }));

    const criteriaHeaders = ["Name", ...matchingHeaders.filter(header => header !== null)];

    // Initialize jsonData
    let jsonData = {
        criteriaHeaders,
        data: []
    };

    // Fetch student names and create normalized name map
    const studentNamesRef = ref(db, `studentList/${year}/${batchName}`);
    const studentNamesSnapshot = await get(studentNamesRef);
    const studentNames = studentNamesSnapshot.exists() ? studentNamesSnapshot.val() : {};

    // Create normalized name map
    const normalizedNameMap = {};
    const studentMap = {};
    
    for (const id in studentNames) {
        const name = studentNames[id]?.Name;
        if (name) {
            const normalizedName = name.toLowerCase().trim();
            normalizedNameMap[normalizedName] = { id, originalName: name };
            // Initialize student data structure
            studentMap[id] = [name, ...new Array(criteriaHeaders.length - 1).fill(null)];
        }
    }

    // Process each matching module
    for (const moduleKey of matchingModules.filter(module => module !== null)) {
        const studentListRef = ref(db, `marks/${year}/${batchName}/${moduleKey}/students`);
        const studentListSnapshot = await get(studentListRef);

        if (studentListSnapshot.exists()) {
            const students = studentListSnapshot.val();

            for (const markId in students) {
                const studentData = students[markId];
                const marksName = studentData.studentName?.toLowerCase().trim();
                
                // Find matching student using normalized name
                let matchedId = markId;
                if (normalizedNameMap[marksName]) {
                    matchedId = normalizedNameMap[marksName].id;
                }

                if (studentMap[matchedId]) {
                    const criteriaData = studentData.criteria || {};
                    
                    // Update criteria marks
                    for (const criteriaKey in criteriaData) {
                        const normalizedCriteriaKey = criteriaKey.trim().toLowerCase().replace(/\s+/g, '');
                        const normalizedHeaders = criteriaHeaders.slice(1).map(header => 
                            header.trim().toLowerCase().replace(/\s+/g, '')
                        );

                        const criteriaIndex = normalizedHeaders.indexOf(normalizedCriteriaKey);
                        if (criteriaIndex >= 0) {
                            // If there's an existing value, take the highest
                            const currentValue = studentMap[matchedId][criteriaIndex + 1];
                            const newValue = criteriaData[criteriaKey] || 0;
                            studentMap[matchedId][criteriaIndex + 1] = Math.max(
                                currentValue || 0,
                                newValue
                            );
                        }
                    }
                }
            }
        }
    }

    // Convert studentMap to jsonData.data and sort by name
    jsonData.data = Object.values(studentMap).sort((a, b) => a[0].localeCompare(b[0]));
    
    console.log("Project view jsonData", jsonData);
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

    let direction = sortDirection[columnIndex] || 'descending';

    const sortedData = [...fullData].sort((a, b) => {
        const scoreA = parseFloat(a[columnIndex]) || 0;
        const scoreB = parseFloat(b[columnIndex]) || 0;

        if (direction === 'descending') {
            return scoreB - scoreA;
        } else {
            return scoreA - scoreB;
        }
    });

    // Reinsert the first student at the top of the sorted data
    renderTable(sortedData, checker);

    // Toggle the sorting direction for next click
    sortDirection[columnIndex] = direction === 'descending' ? 'ascending' : 'descending';
}

function renderHead(headings) {
    const tableHead = document.getElementById('table-head');
    tableHead.innerHTML = '';
    const tr = document.createElement('tr');

    // Create table headers
    headings.forEach(heading => {
        const th = document.createElement('th');
        th.textContent = heading;
        tr.appendChild(th);
    });

    tableHead.appendChild(tr);
    console.log('Table headings are rendered:', headings);
}


function renderTable(data, checker) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';

    data.forEach(student => {
        const row = document.createElement('tr');

        // Add columns with appropriate decimal display
        student.forEach((value, index) => {
            const cell = document.createElement('td');
            
            if (!isNaN(value) && value !== null) {
                // If this is a weight column (out of X) and is a number
                if (index % 2 === 1 && index > 1 && checker) {
                    // Format to exactly 3 decimal places
                    cell.textContent = parseFloat(value).toFixed(3);
                } else {
                    cell.textContent = value;
                }
            } else {
                cell.textContent = value;
            }
            row.appendChild(cell);
        });

        // Calculate total marks with exact values (for calculation)
        const totalMarks = calculateTotalMarks(student, checker);
        const totalCell = document.createElement('td');
        
        // Format to exactly 3 decimal places
        totalCell.textContent = totalMarks.toFixed(3);
        
        // Store the actual rounded value for sorting/calculations
        totalCell.dataset.actualValue = totalMarks;
        
        row.appendChild(totalCell);
        tableBody.appendChild(row);
    });
}

async function transformJsonData(jsonData, weightJson, criteriaMod) {
    console.log("here this data", jsonData);

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
        transformedHeaders.push(`${moduleName} Mark`, `${moduleName} out of ${weightMap[moduleName]}`);
    }

    // Initialize the transformed data array
    const transformedData = [];

    for (const row of jsonData.data) {
        // Start the transformed row with the first element unchanged ("Name")
        const transformedRow = [row[0]];

        // Loop through the data values starting from the second element
        for (const [j, moduleName] of jsonData.headers.slice(1).entries()) {
            const mark = row[j + 1]; // Adjust index because slice(1) starts from the second header

            const evalCriteriaRef = ref(db, `Evaluation Criteria/${criteriaMod[moduleName]}`);

            try {
                // Fetch evaluation criteria asynchronously
                const evalCriteriaSnapshot = await get(evalCriteriaRef);
                let maxScore = 0;

                // Sum up the points from the evaluation criteria
                if (evalCriteriaSnapshot.exists()) {
                    evalCriteriaSnapshot.forEach((childSnapshot) => {
                        const points = parseInt(childSnapshot.child('points').val()) || 0;
                        maxScore += points;
                    });
                }

                // Calculate weight based on the mark and format to exactly 3 decimal places
                let weight = '';
                if (mark) {
                    const calculatedWeight = ((mark / maxScore) * (weightMap[moduleName] || 0)) / 100;
                    // Round to 3 decimal places to avoid floating point errors
                    weight = (Math.round(calculatedWeight * 1000) / 1000).toFixed(3);
                }
                
                transformedRow.push(mark, weight);

            } catch (error) {
                console.error(`Error fetching evaluation criteria for module ${moduleName}:`, error);
                transformedRow.push(mark, ''); // Push empty weight in case of error
            }
        }

        // Push the transformed row to the result array
        transformedData.push(transformedRow);
    }

    return {
        headers: transformedHeaders,
        data: transformedData
    };
}


// Function to search and filter the table
window.searchTable = function() {
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

function calculateTotalMarks(student, checker) {
    let total = 0;
    
    // If checker is true, we have alternating mark/weight columns
    if (checker) {
        for (let i = 2; i < student.length; i += 2) {
            const numericMark = parseFloat(student[i]);
            if (!isNaN(numericMark)) {
                total += numericMark;
            }
        }
    } 
    // If checker is false, we have only mark columns
    else {
        for (let i = 1; i < student.length; i++) {
            const numericMark = parseFloat(student[i]);
            if (!isNaN(numericMark)) {
                total += numericMark;
            }
        }
    }
    
    // Return the number rounded to exactly 3 decimal places to avoid floating point issues
    return Math.round(total * 1000) / 1000;
}

// Sort and render the top 5 entries by total marks
function sortTop5() {
    const filteredData = fullData.filter(entry => {
        const totalMarks = calculateTotalMarks(entry);
        return totalMarks > 0; // Filter out entries with non-numeric or zero marks
    });

    const sortedData = filteredData.sort((a, b) => calculateTotalMarks(b) - calculateTotalMarks(a));
    renderTable(sortedData.slice(0, 5), checker); // Top 5 entries
}

// Sort and render the bottom 5 entries by total marks
function sortBottom5() {
    const filteredData = fullData.filter(entry => {
        const totalMarks = calculateTotalMarks(entry);
        return totalMarks > 0; // Filter out entries with non-numeric or zero marks
    });

    const sortedData = filteredData.sort((a, b) => calculateTotalMarks(a) - calculateTotalMarks(b));
    renderTable(sortedData.slice(0, 5), checker); // Bottom 5 entries
}


// Sort A-Z by Name
function sortByName() {
    const sortedData = [...fullData].sort((a, b) => a[0].localeCompare(b[0])); // Sort by name (first column)
    renderTable(sortedData, checker);
}


// Function to show all rows (re-render fullData)
function showAll() {
    const filteredData = fullData.filter(entry => {
        const totalMarks = calculateTotalMarks(entry);
        return totalMarks > 0; // Filter out entries with non-numeric or zero marks
    });

    const sortedData = filteredData.sort((a, b) => calculateTotalMarks(b) - calculateTotalMarks(a));
    renderTable(sortedData, checker); // Top 5 entries
}

// Download function for exporting the table as Excel
function downloadExcel() {
    const table = document.getElementById('marklist-table');
    
    // Ensure the table exists
    if (table) {
        
        // Create a new table element
        const newTable = document.createElement('table');
        
        // Create a new row for the extendedHeaders
        const newRow = document.createElement('tr');
        extendedHeaders.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            newRow.appendChild(th);
        });

        // Append the new row to the new table
        newTable.appendChild(newRow);
        
        // Copy the rows from the original table to the new table
        for (let i = 0; i < table.rows.length; i++) {
            newTable.appendChild(table.rows[i].cloneNode(true));
        }
        
        // Generate the Excel file with the new table structure
        const workbook = XLSX.utils.table_to_book(newTable);
        XLSX.writeFile(workbook, 'marklist_batch5.xlsx');
    } else {
        console.error('Table is missing');
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
        document.body.style.zoom = "80%";

        // Initially load with `fetchFirebaseTotal`
        json = await fetchFirebaseTotal(lastBatchYear, lastBatchKey, neededPhase);
        fetchData(json);
        initializeHeaders(extendedHeaders);

        // Set the toggle flag
        isTotalView = true;

        // Set the button text initially
        myButton.innerText = "Show Project Table"; // Change text for initial state
    } catch (error) {
        console.error("Error loading data:", error);
    } finally {
        // Hide the loader
        document.getElementById("loader").style.display = "none";
    }
};

// Initialize the toggle flag
let isTotalView = true;
const myButton = document.getElementById("show-project");

// Attach a click event listener to the button
myButton.addEventListener("click", async () => {
    try {
        // Show the loader
        document.getElementById("loader").style.display = "block";

        // Toggle between `fetchFirebaseTotal` and `fetchFirebaseOverall`
        if (isTotalView) {
            json = await fetchFirebaseOverall(lastBatchYear, lastBatchKey, neededPhase);
            fetchProject(json);

            // Change button text for Full Data View
            myButton.innerText = "Show Full Table"; // Update button text
        } else {
            json = await fetchFirebaseTotal(lastBatchYear, lastBatchKey, neededPhase);
            fetchData(json);

            // Change button text for Project View
            myButton.innerText = "Show Project Marks"; // Update button text
        }

        // Reinitialize headers after data switch
        initializeHeaders(extendedHeaders);

        // Toggle the flag
        isTotalView = !isTotalView;
    } catch (error) {
        console.error("Error loading data:", error);
    } finally {
        // Hide the loader
        document.getElementById("loader").style.display = "none";
    }
});
