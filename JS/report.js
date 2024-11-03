
const tableBody = document.getElementById('table-body');
const sortNameAZ=document.getElementById('sort-alpha')
const sortHighest5Btn = document.getElementById('sort-highest-5');
const sortLowest5Btn = document.getElementById('sort-lowest-5');
const showAllBtn = document.getElementById('show-all');
const downloadBtn = document.getElementById('download-btn');

let fullData=[];

async function fetchData() {
    try {
        const response = await fetch('scripy.json'); // Ensure correct file path
        const json = await response.json();
        
        //  JSON

        if (json.headers && json.data) {
            renderHead(json.headers); 
             fullData=json.data
             renderTable(fullData)
        } else {
            console.log("JSON structure is incorrect.");
        }
    } catch (error) {
        console.log('Error loading JSON:', error);
    }
}
// Function for table head

function renderHead(headings){
    const tableHead=document.getElementById('table-head')
    tableHead.innerHTML = '';
    const tr=document.createElement('tr')
    headings.forEach(heading=>{
        const th=document.createElement('th')
        th.textContent=heading
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
function calculateTotalMarks(student){
    return student.slice(1).reduce((sum,mark)=>sum+parseFloat(mark),0)

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
sortNameAZ.addEventListener('click',sortByName)
sortHighest5Btn.addEventListener('click', sortTop5);
sortLowest5Btn.addEventListener('click', sortBottom5);
showAllBtn.addEventListener('click', showAll); // Re-renders the full dataset
downloadBtn.addEventListener('click', downloadExcel);

// Fetch data and render the table on page load
window.onload = fetchData();