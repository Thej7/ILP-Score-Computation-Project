//final ecxel but students get enetred to last current year
let savedData;

import { currentBatchYear, currentBatchName } from '../JS/moduleEntry.js';

async function handleFileUpload(event) {
    const file = event.target.files[0];

    // Check the file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(`.${fileExtension}`)) {
        alert("Invalid file format. Please upload an Excel file (.xlsx or .xls).");
        return;
    }

    const reader = new FileReader();

    reader.onload = async function (e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Parse the sheet data into JSON format
        const studentData = XLSX.utils.sheet_to_json(sheet);
        console.log("Parsed Student Data:", studentData);

        // Validate student data format
        if (!validateStudentData(studentData)) {
            alert("Invalid data format. Ensure the spreadsheet contains 'Name' and 'Email' columns.");
            return;
        }

        // Use currentBatchYear which is set when adding a batch
        if (!currentBatchYear) {
            console.error("Batch year is not set. Please add a batch first.");
            alert("Batch year is not set. Please add a batch first.");
            return;
        }

        const batchName = currentBatchName; // Use the batch name directly

        if (batchName) {
            console.log(`Current Batch Name: ${batchName}`);
            saveStudentsLocally(studentData, currentBatchYear, batchName);
        } else {
            console.error("No batch found for the current year.");
            alert("No batch found for the current year.");
        }
    };

    reader.readAsBinaryString(file);
}

// Function to validate the structure of student data
function validateStudentData(studentData) {
    // Check if there are any entries in the data
    if (studentData.length === 0) {
        console.error("No student data found.");
        return false;
    }

    // Check for required columns
    const requiredColumns = ['Name', 'Email'];
    const keys = Object.keys(studentData[0]);

    // Ensure all required columns are present
    const hasAllColumns = requiredColumns.every(column => keys.includes(column));

    if (!hasAllColumns) {
        console.error("Required columns are missing:", requiredColumns.filter(column => !keys.includes(column)));
    }

    return hasAllColumns;
}

function saveStudentsLocally(studentData, year, batch) {
    const dataToSave = {
        year: year,
        batch: batch,
        students: studentData,
    };

    const json = JSON.stringify(dataToSave, null, 2); // Convert data to JSON string
    
    // Save the JSON string in a variable and log it to the console
    localStorage.setItem("savedData", json);
    savedData = json;
    console.log(savedData);

    // Optionally, if you want to work with it as an object again, you can parse it back
    const parsedData = JSON.parse(savedData);
    console.log(parsedData); // This will show it in object format in the console
}


// HTML input listener for file upload
const fileInput = document.getElementById("Config-Page-Right-top-buttonpart-AddFile");

fileInput.addEventListener("change", (event) => {
    handleFileUpload(event);
    // Clear the input to allow the same file to be uploaded again
    fileInput.value = '';
});
