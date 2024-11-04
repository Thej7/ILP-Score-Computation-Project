import { db, ref, set, get, remove, child } from './firebaseConfig.mjs';

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
    // Step 1: Fetch module headers from `Batches/${year}/${batchname}/modules`
    const modulesRef = ref(db, `Batches/${year}/${batchName}/modules`);
    const modulesSnapshot = await get(modulesRef);
    const modules = modulesSnapshot.exists() ? modulesSnapshot.val() : {};

    // Add "Name" as the first header
    const headers = ["Name", ...Object.keys(modules)];

    // Step 2: Initialize jsonData with headers and a map for students
    const jsonData = {
        headers,
        data: []
    };
    const studentMap = {}; // Map to store student data by id

    // Step 3: Loop through each module key to fetch students' marks from `Marks/${year}/${batchname}/studentlist/${modulekey}`
    for (const moduleKey of headers.slice(1)) { // Skip "Name" in headers for moduleKey
        const studentListRef = ref(db, `marks/${year}/${batchName}/${moduleKey}/students`);
        const studentListSnapshot = await get(studentListRef);

        if (studentListSnapshot.exists()) {
            const students = studentListSnapshot.val();

            // For each student (id), retrieve "name" and "total"
            for (const id in students) {
                const studentData = students[id];
                
                // If the student isn't already in the map, initialize their row
                if (!studentMap[id]) {
                    console.log("batch name", batchName)
                    const studentNameRef = ref(db, `studentList/${year}/${batchName}/${id}/name`);
                    const studentNameSnapshot = await get(studentNameRef);
                    const studentName = studentNameSnapshot.exists() ? studentNameSnapshot.val() : "Unknown";

                    // Initialize the row with "Name" and empty values for each module
                    studentMap[id] = [studentName, ...headers.slice(1).map(() => null)];
                }

                // Update the row with the student's mark for the current module
                const moduleIndex = headers.indexOf(moduleKey);
                studentMap[id][moduleIndex] = studentData.total || 0;
            }
        }
    }

    // Convert the studentMap to jsonData.data
    jsonData.data = Object.values(studentMap);

    console.log(jsonData);
    return jsonData;
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
    return student.slice(1).reduce((sum, mark) => sum + parseFloat(mark), 0)

}

function sortTop5() {
    const sortedData = [...fullData].sort((a, b) => calculateTotalMarks(b) - calculateTotalMarks(a));
    renderTable(sortedData.slice(0, 5));
}

// Sort bottom 5 by total marks
function sortBottom5() {
    const sortedData = [...fullData].sort((a, b) => calculateTotalMarks(a) - calculateTotalMarks(b));
    renderTable(sortedData.slice(0, 5));
}

// Sort A-Z by Name
function sortByName() {
    const sortedData = [...fullData].sort((a, b) => a[0].localeCompare(b[0])); // Sort by name (first column)
    renderTable(sortedData);
}


// Function to show all rows (re-render fullData)
function showAll() {
    renderTable(fullData);
    console.log('Show all data');
}

// Download function for exporting the table as Excel
function downloadExcel() {
    const table = document.getElementById('marklist-table');
    const workbook = XLSX.utils.table_to_book(table);
    XLSX.writeFile(workbook, 'marklist_batch5.xlsx');
}

// Event listeners for buttons
sortNameAZ.addEventListener('click', sortByName)
sortHighest5Btn.addEventListener('click', sortTop5);
sortLowest5Btn.addEventListener('click', sortBottom5);
showAllBtn.addEventListener('click', showAll); // Re-renders the full dataset
downloadBtn.addEventListener('click', downloadExcel);
document.getElementById('Search_input').addEventListener('input', searchTable);


// Fetch data and render the table on page load
window.onload = async function() {
    json = await fetchFirebase(lastBatchYear, lastBatchKey);
    fetchData(json);
};