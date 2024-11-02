import { currentBatchYear, currentBatchName } from './ModuleEntry.js';

console.log("batch name", currentBatchName);

async function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Parse the sheet data into JSON format
        const studentData = XLSX.utils.sheet_to_json(sheet);
        console.log("Parsed Student Data:", studentData);

        // Use currentBatchYear and batchName for filename
        if (!currentBatchYear || !currentBatchName) {
            console.error("Batch year or batch name is not set. Please add a batch first.");
            alert("Batch year or batch name is not set. Please add a batch first.");
            return;
        }

        saveStudentsLocally(studentData, currentBatchYear, currentBatchName);
    };

    reader.readAsBinaryString(file);
}

function saveStudentsLocally(studentData, year, batch) {
    // Convert student data to JSON string
    const jsonData = JSON.stringify(studentData, null, 2); // Pretty print with 2-space indentation
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a link to download the file
    const a = document.createElement("a");
    a.href = url;
    a.download = `studentList_${year}_${batch}.json`; // Same filename for each upload
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Revoke the object URL to free up memory
    URL.revokeObjectURL(url);

    console.log(`Student data saved locally as studentList_${year}_${batch}.json`);
}

// HTML input listener for file upload
document.getElementById("Config-Page-Right-top-buttonpart-AddFile").addEventListener("change", handleFileUpload);
