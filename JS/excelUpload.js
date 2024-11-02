//final ecxel but students get enetred to last current year
let jsonData;

import { db, ref, get, set } from './firebaseConfig.js';
import { currentBatchYear, currentBatchName } from './ModuleEntry.js';

async function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async function (e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Parse the sheet data into JSON format
        const studentData = XLSX.utils.sheet_to_json(sheet);
        console.log("Parsed Student Data:", studentData);

        // Use currentBatchYear which is set when adding a batch
        if (!currentBatchYear) {
            console.error("Batch year is not set. Please add a batch first.");
            alert("Batch year is not set. Please add a batch first.")
            return;
        }

        const batchName = currentBatchName; // Use the batch name directly

        if (batchName) {
            console.log(`Current Batch Name: ${batchName}`);
            saveStudentsToDatabase(studentData, currentBatchYear, batchName);
        } else {
            console.error("No batch found for the current year.");
            alert("No batch found for the current year.")
        }
    };

    reader.readAsBinaryString(file);
}




function saveStudentsToDatabase(studentData, year, batch) {
    studentData.forEach((student, index) => {
        const studentRef = ref(db, `studentList/${year}/${batch}/id${index + 1}`);
        console.log(`Saving student data at: studentList/${year}/${batch}/id${index + 1}`);

        set(studentRef, {
            name: student.Name,
            email: student.Email
        })
            .then(() => console.log(`Saved student ${student.Name}`))
            .catch(error => console.error("Error saving student:", error));
    });
}

// HTML input listener for file upload
document.getElementById("Config-Page-Right-top-buttonpart-AddFile").addEventListener("change", handleFileUpload);


