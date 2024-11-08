import { db, ref, set, get, child } from './firebaseConfig.mjs';

let groupCounter = 1;

function createCriteriaGroup() {
    const workspace = document.getElementsByClassName('Config-Page-Right')[0];

    const criteriaGroup = document.createElement('div');
    criteriaGroup.classList.add('Config-Page-Right-Criteria-Group');
    criteriaGroup.id = 'Config-Page-Right-Criteria-Group-' + groupCounter;

    const criteriaHead = document.createElement('div');
    criteriaHead.classList.add('Config-Page-Right-Criteria-Group-Head');
    criteriaHead.id = 'Config-Page-Right-Criteria-Group-Head-' + groupCounter;

    const criteriaHeadName = document.createElement('div');
    criteriaHeadName.classList.add('Config-Page-Right-Criteria-Group-Head-Name');
    criteriaHeadName.id = 'Config-Page-Right-Criteria-Group-Head-Name-' + groupCounter;
    criteriaHeadName.innerText = "Add a new Evaluation Criteria";

    const criteriaHeadButton = document.createElement('button');
    criteriaHeadButton.classList.add('Config-Page-Right-Criteria-Group-Head-Button');
    criteriaHeadButton.id = 'Config-Page-Right-Criteria-Group-Head-Button-' + groupCounter;
    criteriaHeadButton.innerText = "+";

    criteriaHead.appendChild(criteriaHeadName);
    criteriaHead.appendChild(criteriaHeadButton);

    criteriaGroup.appendChild(criteriaHead);

    const criteriaBody = document.createElement('div');
    criteriaBody.classList.add('Config-Page-Right-Criteria-Group-Body');
    criteriaBody.id = 'Config-Page-Right-Criteria-Group-Body-' + groupCounter;

    const criteriaBodyTable = document.createElement('div');
    criteriaBodyTable.classList.add('Config-Page-Right-Criteria-Group-Body-Table');
    criteriaBodyTable.id = 'Config-Page-Right-Criteria-Group-Body-Table-' + groupCounter;

    let criteriaTable = null;
    let div = null;

    const criteriaBodyOption = document.createElement('div');
    criteriaBodyOption.classList.add('Config-Page-Right-Criteria-Group-Body-Options');
    criteriaBodyOption.id = 'Config-Page-Right-Criteria-Group-Body-Options-' + groupCounter;

    const criteriaOptionEdit = document.createElement('button');
    criteriaOptionEdit.classList.add('Config-Page-Right-Criteria-Group-Body-Options-Edit');
    criteriaOptionEdit.id = 'Config-Page-Right-Criteria-Group-Body-Options-Edit-' + groupCounter;
    criteriaOptionEdit.innerText = "Edit";

    const criteriaOptionDelete = document.createElement('button');
    criteriaOptionDelete.classList.add('Config-Page-Right-Criteria-Group-Body-Options-Delete');
    criteriaOptionDelete.id = 'Config-Page-Right-Criteria-Group-Body-Options-Delete-' + groupCounter;
    criteriaOptionDelete.innerText = "Delete";

    const criteriaOptionSubmit = document.createElement('button');
    criteriaOptionSubmit.classList.add('Config-Page-Right-Criteria-Group-Body-Options-Submit');
    criteriaOptionSubmit.id = 'Config-Page-Right-Criteria-Group-Body-Options-Submit-' + groupCounter;
    criteriaOptionSubmit.innerText = "Submit";

    criteriaBodyOption.appendChild(criteriaOptionEdit);
    criteriaBodyOption.appendChild(criteriaOptionDelete);
    criteriaBodyOption.appendChild(criteriaOptionSubmit);

    criteriaBody.appendChild(criteriaBodyTable);
    criteriaBody.appendChild(criteriaBodyOption);
    criteriaBody.style.display = 'none';
    criteriaGroup.appendChild(criteriaBody);

    criteriaHeadButton.addEventListener('click', async function () {
        if (criteriaBody.style.display === 'none') {
            criteriaBody.style.display = 'flex';
            if (criteriaHeadName.innerText === "Add a new Evaluation Criteria") {
                criteriaHead.style.display = "none";

                // Await the showCriteriaForm function
                try {
                    div = await showCriteriaForm(criteriaGroup, criteriaHead, criteriaBody, criteriaBodyTable, criteriaOptionSubmit, criteriaHeadName);
                    console.log(div); // This will log the returned value from showCriteriaForm
                    // You can also use div here to do something with the returned value
                } catch (error) {
                    console.error('Error during criteria form submission:', error);
                }
            } else {
                console.log(div);
            }
        } else {
            criteriaBody.style.display = 'none';
        }
    });


    workspace.appendChild(criteriaGroup);

    criteriaOptionDelete.addEventListener('click', function () {
        criteriaGroup.remove();
    });

    criteriaOptionEdit.addEventListener('click', function () {
        console.log('the div');
        console.log(div);
        editCriteriaForm(criteriaGroup, criteriaHead, criteriaBody, criteriaBodyTable, criteriaOptionSubmit, criteriaHeadName, criteriaTable, div);
    });
}

function showCriteriaForm(criteriaGroup, criteriaHead, criteriaBody, criteriaBodyTable, criteriaOptionSubmit, criteriaHeadName, criteriaTable) {
    return new Promise((resolve) => { // Wrap in a Promise
        criteriaBodyTable.innerHTML = '';

        const criteriaTitle = document.createElement('input');
        criteriaTitle.classList.add('Config-Page-Right-Criteria-Group-Title');
        criteriaTitle.id = 'Config-Page-Right-Criteria-Group-Title-' + groupCounter;
        criteriaTitle.type = 'text';
        criteriaTitle.placeholder = 'Enter the Group Name';
        criteriaBodyTable.appendChild(criteriaTitle);

        const criteriaTable = document.createElement('table');
        criteriaTable.classList.add('Config-Page-Right-Criteria-Group-Body-Table-Table');
        criteriaTable.id = 'Config-Page-Right-Criteria-Group-Body-Table-Table-' + groupCounter;
        const criteriaTableMainRow = document.createElement('tr');

        const criteriaHeaderCells = ['SL. No', 'Evaluation Criteria', 'Points', 'Actions'];

        criteriaHeaderCells.forEach((headerText, index) => {
            const headerCell = document.createElement('th');
            headerCell.classList.add('Config-Page-Right-Criteria-Group-Body-Table-Table-Head');
            headerCell.id = 'Config-Page-Right-Criteria-Group-Body-Table-Table-Head-' + groupCounter + '-' + (index + 1);
            headerCell.innerText = headerText;
            criteriaTableMainRow.appendChild(headerCell);
        });

        criteriaTable.appendChild(criteriaTableMainRow);
        criteriaBodyTable.appendChild(criteriaTable);

        createCriteriaTableRow(criteriaTable);

        const addTableRow = document.createElement('button');
        addTableRow.classList.add('Config-Page-Right-Criteria-Group-Body-Table-Add');
        addTableRow.id = 'Config-Page-Right-Criteria-Group-Body-Table-Add-' + groupCounter;
        addTableRow.innerHTML = 'Add';
        criteriaBodyTable.appendChild(addTableRow);

        addTableRow.addEventListener('click', function () {
            createCriteriaTableRow(criteriaTable);
        });

        criteriaOptionSubmit.addEventListener('click', async () => {
            try {
                const div = await submitFunction(criteriaTitle, criteriaTable, criteriaHeadName, criteriaBody, criteriaBodyTable, criteriaHead);
                await createCriteriaGroup();
                groupCounter++;
                resolve(div); // Resolve the Promise with the returned value
            } catch (error) {
                console.error(error);
                resolve(null); // Resolve with null in case of error
            }
        });
    });
}

function editCriteriaForm(criteriaGroup, criteriaHead, criteriaBody, criteriaBodyTable, criteriaOptionSubmit, criteriaHeadName, criteriaTable, div) {
    criteriaBodyTable.innerHTML = '';

    const divId = criteriaBodyTable.id;
    const divClass = criteriaBodyTable.className;
    let idParts = divId.split("-");
    let numberPart = idParts[idParts.length - 1];
    let neededNumber = parseInt(numberPart, 10);
    const tableId = 'Config-Page-Right-Criteria-Group-Body-Table-SubTable-' + neededNumber;
    console.log(tableId);

    criteriaTable = div;
    console.log("please");
    console.log(criteriaTable);

    let criteriaTitle;

    const existingTitleInput = criteriaBody.querySelector('input[type="text"]');
    if (existingTitleInput) {
        existingTitleInput.value = criteriaHeadName.textContent;
        criteriaTitle = existingTitleInput;
    } else {
        criteriaTitle = document.createElement('input');
        criteriaTitle.type = 'text';
        criteriaTitle.value = criteriaHeadName.textContent;
        criteriaBody.appendChild(criteriaTitle);
    }

    const newCriteriaTable = document.createElement('table');

    const headerRow = document.createElement('tr');
    const headerCells = ['SL. No', 'Evaluation Criteria', 'Points', 'Actions'];
    headerCells.forEach(headerText => {
        const headerCell = document.createElement('th');
        headerCell.innerText = headerText;
        headerRow.appendChild(headerCell);
    });
    newCriteriaTable.appendChild(headerRow);

    Array.from(criteriaTable.rows).forEach((row, rowIndex) => {
        console.log(row);
        if (rowIndex > 0) {
            createEditableRow(newCriteriaTable, row);
        }
    });

    const addRowButton = document.createElement('button');
    addRowButton.innerText = 'Add Row';
    addRowButton.addEventListener('click', () => {
        createEditableRow(newCriteriaTable);
    });

    criteriaBodyTable.appendChild(newCriteriaTable);
    criteriaBodyTable.appendChild(addRowButton);

    criteriaBody.style.display = 'flex';

    criteriaOptionSubmit.replaceWith(criteriaOptionSubmit.cloneNode(true));
    criteriaOptionSubmit = criteriaBody.querySelector('.Config-Page-Right-Criteria-Group-Body-Options-Submit');

    criteriaOptionSubmit.addEventListener('click', async () => {
        try {
            const div = await submitFunction(criteriaTitle, newCriteriaTable, criteriaHeadName, criteriaBody, criteriaBodyTable, criteriaHead);
        } catch (error) {
            console.error(error);
        }
    });
}

function createEditableRow(table, existingRow = null) {
    const newTableRow = document.createElement('tr');

    for (let i = 1; i <= 3; i++) {
        const newTableCell = document.createElement('td');
        const inputField = document.createElement('input');

        inputField.type = i === 3 ? 'number' : 'text';
        inputField.type = i === 1 ? 'number' : 'text';

        if (existingRow) {
            const existingCells = existingRow.querySelectorAll('td');
            inputField.value = existingCells[i - 1].textContent.trim();
        }

        newTableCell.appendChild(inputField);
        newTableRow.appendChild(newTableCell);
    }

    const removeCell = document.createElement('td');
    const removeButton = document.createElement('button');
    removeButton.innerText = 'Remove';
    removeButton.addEventListener('click', () => {
        newTableRow.remove();
    });
    removeCell.appendChild(removeButton);
    newTableRow.appendChild(removeCell);

    table.appendChild(newTableRow);
}

function createCriteriaTableRow(criteriaTable) {
    const criteriaTableRow = document.createElement('tr');

    for (let i = 1; i <= 4; i++) {
        const criteriaTableCell = document.createElement('td');
        if (i === 1) {
            const criteriaTableCellForm = document.createElement('input');
            criteriaTableCellForm.type = 'number';
            criteriaTableCell.appendChild(criteriaTableCellForm);
        } else if (i === 2) {
            const criteriaTableCellForm = document.createElement('input');
            criteriaTableCellForm.type = 'text';
            criteriaTableCell.appendChild(criteriaTableCellForm);
        } else if (i === 3) {
            const criteriaTableCellForm = document.createElement('input');
            criteriaTableCellForm.type = 'number';
            criteriaTableCell.appendChild(criteriaTableCellForm);
        } else {
            const criteriaTableCellButton = document.createElement('button');
            criteriaTableCellButton.innerHTML = 'Remove';
            criteriaTableCellButton.addEventListener('click', function () {
                criteriaTableRow.remove();

            });
            criteriaTableCell.appendChild(criteriaTableCellButton);
        }
        criteriaTableRow.appendChild(criteriaTableCell);
    }

    criteriaTable.appendChild(criteriaTableRow);
}

function submitFunction(criteriaTitle, criteriaTable, criteriaHeadName, criteriaBody, criteriaBodyTable, criteriaHead) {
    return new Promise((resolve, reject) => {

        const divId = criteriaBodyTable.id;
        const divClass = criteriaBodyTable.className;
        let idParts = divId.split("-");
        let numberPart = idParts[idParts.length - 1];
        let neededNumber = parseInt(numberPart, 10);

        const groupName = criteriaTitle.value;
        const rows = criteriaTable.querySelectorAll('tr');

        if (groupName === '') {
            reject('Group Name is required');
            return;
        }

        let valid = true;
        rows.forEach((row, index) => {
            if (index === 0) return;
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                if (input.value === '') {
                    valid = false;
                }
            });
        });

        if (!valid) {
            reject('All fields must be filled');
            return;
        }
        const oldHeadName = criteriaHeadName.innerText;
        criteriaHeadName.innerText = groupName;

        const submittedDataTable = document.createElement('table');
        submittedDataTable.classList.add('Config-Page-Right-Criteria-Group-Body-Table-SubTable');
        submittedDataTable.id = 'Config-Page-Right-Criteria-Group-Body-Table-SubTable-' + neededNumber;

        const submittedDataHeaderRow = document.createElement('tr');
        const submittedDataHead1 = document.createElement('th');
        submittedDataHead1.innerText = 'SL. No';
        const submittedDataHead2 = document.createElement('th');
        submittedDataHead2.innerText = 'Evaluation Criteria';
        const submittedDataHead3 = document.createElement('th');
        submittedDataHead3.innerText = 'Points';

        submittedDataHeaderRow.appendChild(submittedDataHead1);
        submittedDataHeaderRow.appendChild(submittedDataHead2);
        submittedDataHeaderRow.appendChild(submittedDataHead3);
        submittedDataTable.appendChild(submittedDataHeaderRow);

        rows.forEach((row, index) => {
            if (index === 0) return;
            const inputs = row.querySelectorAll('input');

            const submittedDataRow = document.createElement('tr');
            submittedDataRow.innerHTML = `
                <td>${inputs[0].value}</td>
                <td>${inputs[1].value}</td>
                <td>${inputs[2].value}</td>
            `;

            submittedDataTable.appendChild(submittedDataRow);
            writeFirebaseData(oldHeadName, inputs, groupName, rows);
        });

        criteriaBodyTable.innerHTML = '';
        criteriaBodyTable.appendChild(submittedDataTable);
        criteriaTitle.remove();
        criteriaBody.style.display = 'none';
        criteriaHead.style.display = 'flex';

        const dummy = 'Config-Page-Right-Criteria-Group-Body-Table-SubTable-' + neededNumber;
        const div = document.getElementById(dummy);
        console.log(div);
        resolve(div);
    });
}

async function loadFirebaseData() {
    const loadedData = await readFirebaseData();

    const workspace = document.getElementsByClassName('Config-Page-Right')[0];

    loadedData.forEach((group) => {

        const criteriaGroup = document.createElement('div');
        criteriaGroup.classList.add('Config-Page-Right-Criteria-Group');

        const criteriaHead = document.createElement('div');
        criteriaHead.classList.add('Config-Page-Right-Criteria-Group-Head');

        const criteriaHeadName = document.createElement('div');
        criteriaHeadName.classList.add('Config-Page-Right-Criteria-Group-Head-Name');
        criteriaHeadName.innerText = group.groupName;

        const criteriaHeadButton = document.createElement('button');
        criteriaHeadButton.classList.add('Config-Page-Right-Criteria-Group-Head-Button');
        criteriaHeadButton.innerText = "+";

        criteriaHead.appendChild(criteriaHeadName);
        criteriaHead.appendChild(criteriaHeadButton);

        criteriaGroup.appendChild(criteriaHead);

        const criteriaBody = document.createElement('div');
        criteriaBody.classList.add('Config-Page-Right-Criteria-Group-Body');

        const criteriaBodyTable = document.createElement('div');
        criteriaBodyTable.classList.add('Config-Page-Right-Criteria-Group-Body-Table');

        const criteriaTable = document.createElement('table');

        const headerRow = document.createElement('tr');
        const headerCells = ['SL. No', 'Evaluation Criteria', 'Points', 'Actions'];
        headerCells.forEach(headerText => {
            const headerCell = document.createElement('th');
            headerCell.innerText = headerText;
            headerRow.appendChild(headerCell);
        });
        criteriaTable.appendChild(headerRow);

        const newTableRow = document.createElement('tr');

        group.criteria.forEach((criteria) => {
            const newTableId = document.createElement('td');
            newTableId.innerText = criteria.id;
            const newTableName = document.createElement('td');
            newTableName.innerText = criteria.name;
            const newTablePoint = document.createElement('td');
            newTablePoint.innerText = criteria.points;
            const newTableButton = document.createElement('button');
            newTableButton.innerHTML = 'Remove';
            newTableButton.addEventListener('click', function () {
                newTableRow.remove();
            });
            newTableRow.appendChild(newTableId);
            newTableRow.appendChild(newTableName);
            newTableRow.appendChild(newTablePoint);
            newTableRow.appendChild(newTableButton);
        })
        criteriaTable.appendChild(newTableRow)
        criteriaBodyTable.appendChild(criteriaTable);


        const criteriaBodyOption = document.createElement('div');
        criteriaBodyOption.classList.add('Config-Page-Right-Criteria-Group-Body-Options');

        const criteriaOptionEdit = document.createElement('button');
        criteriaOptionEdit.classList.add('Config-Page-Right-Criteria-Group-Body-Options-Edit');
        criteriaOptionEdit.innerText = "Edit";

        const criteriaOptionDelete = document.createElement('button');
        criteriaOptionDelete.classList.add('Config-Page-Right-Criteria-Group-Body-Options-Delete');
        criteriaOptionDelete.innerText = "Delete";

        const criteriaOptionSubmit = document.createElement('button');
        criteriaOptionSubmit.classList.add('Config-Page-Right-Criteria-Group-Body-Options-Submit');
        criteriaOptionSubmit.innerText = "Submit";

        criteriaBodyOption.appendChild(criteriaOptionEdit);
        criteriaBodyOption.appendChild(criteriaOptionDelete);
        criteriaBodyOption.appendChild(criteriaOptionSubmit);

        criteriaBody.appendChild(criteriaBodyTable);
        criteriaBody.appendChild(criteriaBodyOption);
        criteriaBody.style.display = 'none';
        criteriaGroup.appendChild(criteriaBody);

        criteriaHeadButton.addEventListener('click', async function () {
            if (criteriaBody.style.display === 'none') {
                criteriaBody.style.display = 'flex';
            } else {
                criteriaBody.style.display = 'none';
            }
        });


        workspace.appendChild(criteriaGroup);

        criteriaOptionDelete.addEventListener('click', function () {
            criteriaGroup.remove();
        });

        criteriaOptionEdit.addEventListener('click', function () {
            editCriteriaForm(criteriaGroup, criteriaHead, criteriaBody, criteriaBodyTable, criteriaOptionSubmit, criteriaHeadName, criteriaTable, criteriaTable);
        });
    })
}

async function readFirebaseData() {
    const evalCriteriaRef = ref(db, "Evaluation Criteria");

    try {
        // Fetch all groups under 'Evaluation Criteria'
        const snapshot = await get(evalCriteriaRef);

        if (snapshot.exists()) {
            const allGroups = snapshot.val(); // Get the entire 'Evaluation Criteria' data
            const groupNames = Object.keys(allGroups); // Get all group names
            console.log("All group names:", groupNames);

            // To store data for all groups and their criteria
            const allData = [];

            // Iterate through each group and fetch its criteria
            groupNames.forEach((groupName) => {
                const groupCriteria = allGroups[groupName]; // Access criteria for this group
                console.log(`Criteria for group '${groupName}':`, groupCriteria);

                // You can store this data in your program as needed
                allData.push({
                    groupName: groupName,
                    criteria: groupCriteria
                });
            });

            // Output all the data
            console.log("All data saved in program:", allData);
            return allData;

        } else {
            console.log("No groups found under 'Evaluation Criteria'");
        }
    } catch (error) {
        console.error("Error reading data: ", error);
    }
}



async function writeFirebaseData(oldHeadName, inputs, groupName, rows) {
    const headingText = oldHeadName;
    console.log(headingText);

    try {
        const groupRef = ref(db, `Evaluation Criteria/${groupName}`);

        const criteriaArray = [];

        for (let index = 1; index < rows.length; index++) {
            const row = rows[index];
            const criteriaId = `id${index}`;
            const criteriaName = inputs[1].value;
            const criteriaPoints = inputs[2].value;

            if (criteriaName === undefined || criteriaPoints === undefined) {
                console.error("One or more input values are undefined.");
                continue;
            }

            const criteriaObject = {
                id: criteriaId,
                name: criteriaName,
                points: criteriaPoints,
            };

            criteriaArray.push(criteriaObject);
        }

        await set(groupRef, criteriaArray);
        console.log(`Criteria for group '${groupName}' created successfully`);

    } catch (error) {
        console.error("Error creating document: ", error);
    }
}

async function deleteFirebaseData(criteriaHeadName) {
    const criteriaRef = doc(db, "Evaluation Criteria", criteriaHeadName.innerText);

    try {
        await deleteDoc(criteriaRef);
        console.log(`Document with title "${criteriaHeadName.innerText}" has been deleted.`);
    } catch (error) {
        console.error("Error deleting document: ", error);
    }
}


document.addEventListener('DOMContentLoaded', async function () {
    await loadFirebaseData();
    await createCriteriaGroup();
});


// Now add this to firebase - check if submit is from edit or straight up - delete for the whole thing and just the whole row
// don't forget to load the pre-existing ones