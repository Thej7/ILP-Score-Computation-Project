// batch entry okay
// module entry and alert of exceeding 100 is okay and module store in local store until full submision
//submiting mkodules and view modules at middle and submitall modules make the fullmodules save in firebase
//delete works.modules delete from locally
// not repeating the module option 
//viewmodule gets toggle
//but editing works but when entering phase and criteria and submit in the view module only the first option is showing also got corrected everything in modules fine
// active field in module is given
//startdateand end were added
import { db, ref, get, set, remove, auth} from './firebaseConfig.mjs';
import { onAuthStateChanged, getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { fetchPhase, fetchCriteria } from './getDropdown.js';  // Import the fetch function

export let currentBatchName = '';
export let currentBatchYear = '';
let phaseWeightage = {};
let modules = [];

console.log(localStorage.getItem("savedData"))

// Function to add a batch
async function addBatch(year) {
    try {
        const name = document.getElementById('batch-name').value;
        currentBatchName = name;
        if (!name) {
            alert("Please enter a batch name.");
            return;
        }

        // Reference to the batches for the specified year
        const batchesRef = ref(db, `Batches/${year}`);
        const snapshot = await get(batchesRef);

        // Check if the batch already exists
        if (snapshot.exists() && snapshot.val()[name]) {
            console.log("same batch and year");
            alert(`Batch "${name}" already exists for the year ${year}.`);
            return;
        }

        // Proceed with creating the new batch if it doesn't exist
        const startDate = document.getElementById('batch-startyear').value;
        const endDate = document.getElementById('batch-endyear').value;
        if (!startDate) {
            alert("Please enter a batch start date.");
            return;
        }
        // Check for end date
        if (!endDate) {
            alert("Please enter a batch end date.");
            return;
        }
        const batchData = {
            name: name,
            startDate: startDate,
            endDate: endDate,
            active: 'no',
            modules: []
        };

        // Save the new batch to Firebase
        const batchRef = ref(db, `Batches/${year}/${name}`);
        await set(batchRef, batchData);

        console.log("Batch added successfully!");
        alert("Batch added successfully!");

        // Clear the form fields
        document.getElementById('batch-form').reset();
    } catch (e) {
        console.error("Error adding batch: ", e);
        alert("There was an error adding the batch.");
    }
}

const batchNameInput = document.getElementById('batch-name');

// Add an event listener to update the variable on every input
batchNameInput.addEventListener('input', (event) => {
    currentBatchName = event.target.value;
    console.log(currentBatchName); // Optional: for debugging to see the current value
});

const batchYearInput = document.getElementById('batch-year');

// Add an event listener to update the variable on every input
batchYearInput.addEventListener('input', (event) => {
    currentBatchYear = event.target.value;
    console.log(currentBatchYear); // Optional: for debugging to see the current value
});


// Function to add a module to the local array
function addModule(moduleName, totalWeightage, criteria, phase) {
    totalWeightage = parseFloat(totalWeightage);

    const currentPhaseWeightage = phaseWeightage[phase] || 0;
    console.log("check here");
    console.log(phase);
    console.log(currentPhaseWeightage);
    console.log(totalWeightage);

    if (currentPhaseWeightage + totalWeightage > 100) {
        alert(`Total weightage for phase "${phase}" cannot exceed 100.`);
        return;
    }

    if (modules.some(module => module.moduleName === moduleName)) {
        alert(`Module "${moduleName}" already exists.`);
        return;
    }

    modules.push({ moduleName, totalWeightage, criteria, phase });
    phaseWeightage[phase] = currentPhaseWeightage + totalWeightage;
    console.log(phaseWeightage[phase]);

    console.log("Module added locally!");
    alert("Module added successfully!");
}

async function saveToDatabase(data) {
    // Destructure year, batch, and students from data
    const { year, batch, students } = data;

    // Check if students array is valid
    if (!students || !Array.isArray(students) || students.length === 0) {
        console.error("No valid students found to save.");
        return; // Exit if there's no valid student data
    }

    // Loop through each student to save their data
    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const studentId = `id${i + 1}`; // Create a unique student ID

        // Create a reference in the database for the current student
        const studentRef = ref(db, `studentList/${year}/${batch}/${studentId}`);

        try {
            // Attempt to save the student data to the database
            await set(studentRef, student);

            // Log the successful save
            console.log(`Saved ${student.Name} to ${studentRef.path}`);
        } catch (error) {
            // Log an error if saving fails
            console.error(`Error saving student ${student.Name}:`, error);
        }
    }
}

// Function to handle batch form submission
document.getElementById('Config-Page-Right-bottom-submit').addEventListener('click', async function (event) {
    event.preventDefault();
    const year = document.getElementById('batch-year').value;
    currentBatchYear = year;

    if (year) {
        const savedDataJson = localStorage.getItem("savedData");
        const savedData = savedDataJson ? JSON.parse(savedDataJson) : null; // Parse the JSON string

        if (savedData && savedData.students) { // Ensure students is defined
            try {
                await Promise.all([
                    addBatch(year),
                    saveToDatabase(savedData) // Pass the parsed data
                ]);
            } catch (error) {
                console.error("Error saving data:", error);
            }
        } else {
            alert("No valid student data found in localStorage.");
        }
    } else {
        alert("Please enter a year.");
    }

    // Clear localStorage after attempting to save data, regardless of outcome
    localStorage.removeItem("savedData");
    // Or use localStorage.clear(); to clear all localStorage items if needed
});


// Function to handle module form submission
document.addEventListener('submit', async function (event) {
    if (event.target.matches('.module-form')) {
        event.preventDefault();

        const moduleName = event.target.querySelector('.module-name').value.trim();
        const totalWeightage = event.target.querySelector('.module-weightage').value.trim();
        const criteria = event.target.querySelector('.module-criteria').value;
        const phase = event.target.querySelector('.module-phase').value;

        if (moduleName && totalWeightage && criteria && phase) {
            addModule(moduleName, totalWeightage, criteria, phase);
            event.target.reset();
        } else {
            alert("Please fill out all module fields.");
        }
    }
});

// Function to add a module entry form
function addModuleOption() {
    // Create main container div
    const optionContainer = document.createElement('div');
    optionContainer.classList.add('Config-Page-Right-bottom-addmodule-moduleform');

    // Create form element
    const form = document.createElement('form');
    form.classList.add('module-form');

    // Create and append title
    const title = document.createElement('h5');
    title.textContent = 'New Module';
    form.appendChild(title);

    // Create and append Module Name label and input
    form.appendChild(document.createElement('br'));

    const moduleNameLabel = document.createElement('label');
    moduleNameLabel.textContent = 'Module Name:';
    form.appendChild(moduleNameLabel);

    const moduleNameInput = document.createElement('input');
    moduleNameInput.type = 'text';
    moduleNameInput.classList.add('module-name');
    moduleNameInput.required = true;
    form.appendChild(moduleNameInput);

    // Create and append Total Weightage label and input
    const weightageLabel = document.createElement('label');
    weightageLabel.textContent = 'Total Weightage:';
    form.appendChild(weightageLabel);

    const weightageInput = document.createElement('input');
    weightageInput.type = 'number';
    weightageInput.classList.add('module-weightage');
    weightageInput.required = true;
    form.appendChild(weightageInput);

    // Line break for spacing
    form.appendChild(document.createElement('br'));
    form.appendChild(document.createElement('br'));

    // Create and append Criteria label and select
    const criteriaLabel = document.createElement('label');
    criteriaLabel.textContent = 'Criteria:';
    form.appendChild(criteriaLabel);

    const criteriaSelect = document.createElement('select');
    criteriaSelect.classList.add('module-criteria');
    criteriaSelect.required = true;

    // Create and append default option for Criteria
    const defaultCriteriaOption = document.createElement('option');
    defaultCriteriaOption.value = '';
    defaultCriteriaOption.textContent = 'Select a criteria';
    criteriaSelect.appendChild(defaultCriteriaOption);
    form.appendChild(criteriaSelect);

    // Create and append Phase label and select
    const phaseLabel = document.createElement('label');
    phaseLabel.textContent = 'Phase:';
    form.appendChild(phaseLabel);

    const phaseSelect = document.createElement('select');
    phaseSelect.classList.add('module-phase');
    phaseSelect.required = true;

    // Create and append default option for Phase
    const defaultPhaseOption = document.createElement('option');
    defaultPhaseOption.value = '';
    defaultPhaseOption.textContent = 'Select a phase';
    phaseSelect.appendChild(defaultPhaseOption);
    form.appendChild(phaseSelect);

    // Create and append delete button with icon
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add('delete-modules');

    const trashIcon = document.createElement('i');
    trashIcon.classList.add('fa-solid', 'fa-trash');
    trashIcon.style.width = '20px';
    deleteButton.appendChild(trashIcon);
    form.appendChild(deleteButton);

    // Create and append submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('module-submit');
    submitButton.textContent = 'Submit';
    form.appendChild(submitButton);

    // Append form to the main container
    optionContainer.appendChild(form);


    const dropdown = optionContainer.querySelector('.module-criteria');
    fetchCriteria(dropdown);
    const phasedropdown = optionContainer.querySelector('.module-phase');
    fetchPhase(phasedropdown);


    optionContainer.querySelector('.delete-modules').addEventListener('click', function () {
        optionContainer.remove(); // Remove the form
        document.getElementById('Config-Page-Right-bottom-addmodule-button').disabled = false; // Enable the button again
    });

    document.querySelector('#Config-Page-Right-bottom').insertBefore(optionContainer, document.querySelector('#Config-Page-Right-bottom-module'));
    optionContainer.querySelector('.module-form').reset();


}


// Function to submit all modules to Firebase
async function submitAllModules() {
    try {
        if (modules.length === 0) {
            alert("No modules to submit.");
            return;
        }
        for (const module of modules) {
            const moduleRef = ref(db, `Batches/${currentBatchYear}/${currentBatchName}/modules/${module.moduleName}`);
            await set(moduleRef, module);
        }
        alert("All modules submitted successfully!");
        modules = [];
        phaseWeightage = {};
    } catch (e) {
        console.error("Error submitting modules: ", e);
        alert("There was an error submitting the modules.");
    }
}

// Function to view all modules
let modulesVisible = false;
function viewAllModules() {
    console.log(modules);
    const modulesContainer = document.getElementById('modules-display');

    if (!modulesVisible) {
        modulesContainer.innerHTML = '';

        if (modules.length === 0) {
            modulesContainer.innerHTML = '<p>No modules available.</p>';
            return;
        }

        const modulesList = document.createElement('div');
        modulesList.classList.add('modules-list');

        modules.forEach((module, index) => {
            // Create the main div for the module
            const moduleDiv = document.createElement('div');
            moduleDiv.classList.add('Config-Page-Right-bottom-viewmodule-moduleform');

            // Create the form element
            const form = document.createElement('form');
            form.classList.add('module-form');
            form.setAttribute('data-index', index); // Set the data-index attribute

            // Create and append Module Name heading
            const moduleNameHeading = document.createElement('h5');
            moduleNameHeading.innerHTML = `Module Name: <span>${module.moduleName}</span>`;
            form.appendChild(moduleNameHeading);

            // Create and append Module Name label and input
            const moduleNameLabel = document.createElement('label');
            moduleNameLabel.textContent = 'Module Name:';
            form.appendChild(moduleNameLabel);

            const moduleNameInput = document.createElement('input');
            moduleNameInput.type = 'text';
            moduleNameInput.classList.add('module-name');
            moduleNameInput.value = module.moduleName; // Set the value
            moduleNameInput.required = true;
            moduleNameInput.readOnly = true; // Set input to read-only
            form.appendChild(moduleNameInput);

            // Create and append Total Weightage label and input
            const weightageLabel = document.createElement('label');
            weightageLabel.textContent = 'Total Weightage:';
            form.appendChild(weightageLabel);

            const weightageInput = document.createElement('input');
            weightageInput.type = 'number';
            weightageInput.classList.add('module-weightage');
            weightageInput.value = module.totalWeightage; // Set the value
            weightageInput.required = true;
            weightageInput.readOnly = true; // Set input to read-only
            form.appendChild(weightageInput);

            // Line breaks for spacing
            form.appendChild(document.createElement('br'));
            form.appendChild(document.createElement('br'));

            // Create and append Criteria label and select
            const criteriaLabel = document.createElement('label');
            criteriaLabel.textContent = 'Criteria:';
            form.appendChild(criteriaLabel);

            const criteriaSelect = document.createElement('select');
            criteriaSelect.classList.add('module-criteria');
            criteriaSelect.required = true;
            criteriaSelect.disabled = true; // Set select to disabled

            // Create and append the option for Criteria
            const criteriaOption = document.createElement('option');
            criteriaOption.value = module.criteria;
            criteriaOption.textContent = module.criteria; // Set the text to criteria
            criteriaSelect.appendChild(criteriaOption);
            form.appendChild(criteriaSelect);

            // Create and append Phase label and select
            const phaseLabel = document.createElement('label');
            phaseLabel.textContent = 'Phase:';
            form.appendChild(phaseLabel);

            const phaseSelect = document.createElement('select');
            phaseSelect.classList.add('module-phase');
            phaseSelect.required = true;
            phaseSelect.disabled = true; // Set select to disabled

            // Create and append the option for Phase
            const phaseOption = document.createElement('option');
            phaseOption.value = module.phase;
            phaseOption.textContent = module.phase; // Set the text to phase
            phaseSelect.appendChild(phaseOption);
            form.appendChild(phaseSelect);

            // Create and append Edit button
            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.classList.add('module-Edit');
            editButton.setAttribute('data-index', index); // Set data-index attribute
            editButton.textContent = 'Edit';
            form.appendChild(editButton);

            // Create and append Delete button
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.classList.add('delete-submitedModule');
            deleteButton.setAttribute('data-index', index); // Set data-index attribute
            deleteButton.textContent = 'Delete';
            form.appendChild(deleteButton);

            // Append a horizontal rule for separation
            const hr = document.createElement('hr');
            form.appendChild(hr);

            // Append form to the module div
            moduleDiv.appendChild(form);

            modulesList.appendChild(moduleDiv);

            // // Fetch and populate criteria options


            const criteriaDropdown = moduleDiv.querySelector('.module-criteria');
            fetchCriteria(criteriaDropdown).then(() => {
                criteriaDropdown.value = module.criteria; // Set the saved value as selected
            });

            // Fetch and populate phase options
            const phaseDropdown = moduleDiv.querySelector('.module-phase');
            fetchPhase(phaseDropdown).then(() => {
                phaseDropdown.value = module.phase; // Set the saved value as selected
            });
            // Function to calculate total weightage per phase
            function calculatePhaseWeightage() {

                const weightageByPhase = {};
                modules.forEach(module => {
                    const currentWeightage = weightageByPhase[module.phase] || 0;
                    weightageByPhase[module.phase] = currentWeightage + module.totalWeightage;
                    console.log(weightageByPhase[module.phase]);
                });
                console.log("phase")
                console.log(modules[index].phase);
                console.log(weightageByPhase[module.phase]);
                phaseWeightage[modules[index].phase] = weightageByPhase[module.phase];
                console.log("value: " + phaseWeightage[modules[index].phase]);
                return weightageByPhase;
            }


            // Event listener for the Edit button
            moduleDiv.querySelector('.module-Edit').addEventListener('click', function () {
                const form = moduleDiv.querySelector('.module-form');
                const isEditing = form.dataset.editing === 'true';

                if (isEditing) {
                    // Save changes
                    const updatedModule = {
                        moduleName: form.querySelector('.module-name').value,
                        totalWeightage: parseFloat(form.querySelector('.module-weightage').value),
                        criteria: form.querySelector('.module-criteria').value,
                        phase: form.querySelector('.module-phase').value,
                    };
                    console.log(updatedModule);
                    console.log("yo");
                    const originalModule = modules[index];
                    // Validation: Check if total weightage exceeds 100
                    modules[index] = updatedModule; // Update temporarily
                    const weightageByPhase = calculatePhaseWeightage();

                    // Check if the total weightage exceeds 100 for the updated module's phase
                    if (weightageByPhase[updatedModule.phase] > 100) {
                        console.log(weightageByPhase[updatedModule.phase]);
                        alert(`Total weightage for phase "${updatedModule.phase}" cannot exceed 100.`);
                        modules[index] = originalModule; // Restore the original module
                        return; // Exit if validation fails
                    }

                    // If validation passes, update the modules array
                    modules[index] = updatedModule;


                    // Reset form to read-only state
                    toggleEditState(form, false);
                    this.textContent = "Edit"; // Change button text back to "Edit"
                    form.dataset.editing = 'false'; // Reset editing state
                } else {
                    // Change form to editable state
                    toggleEditState(form, true);
                    this.textContent = "Save"; // Change button text to "Save"
                    form.dataset.editing = 'true'; // Set editing state
                }
            });



            moduleDiv.querySelector('.delete-submitedModule').addEventListener('click', function () {
                const indexToDelete = parseInt(this.dataset.index);

                // Confirm deletion
                if (confirm("Are you sure you want to delete this module?")) {
                    // Remove the module from the array
                    modules.splice(indexToDelete, 1);

                    // Re-render the modules display
                    viewAllModules(); // Refresh the list after deletion
                }
            });

        });

        modulesContainer.appendChild(modulesList);
        modulesVisible = true;
    } else {
        // Hide the modules
        modulesContainer.innerHTML = ''; // Clear the display
        modulesVisible = false; // Update visibility state
    }
}

// Function to toggle edit state of the form
function toggleEditState(form, isEditable) {
    form.querySelector('.module-name').readOnly = !isEditable;
    form.querySelector('.module-weightage').readOnly = !isEditable;
    const criteriaSelect = form.querySelector('.module-criteria');
    const phaseSelect = form.querySelector('.module-phase');
    criteriaSelect.disabled = !isEditable;
    phaseSelect.disabled = !isEditable;
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user.email);
    } else {
        window.location.href = "loginMain.html";
    }
}); 

document.getElementById("logout_button").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            // localStorage.setItem("logoutMessage", "Logged out successfully.");
            window.location.href = "./loginMain.html";
        })
        .catch((error) => {
            console.error("Sign out error:", error);
        });
});






// Attach add module button functionality
document.getElementById('Config-Page-Right-bottom-addmodule-button').addEventListener('click', function () {
    // Show the module form
    addModuleOption();

    // Disable the button after the first click
    this.disabled = true;
});
// Attach final submission button functionality
document.getElementById('final-submit-button').addEventListener('click', async function (event) {
    event.preventDefault();
    await submitAllModules();
});

// Attach view modules button functionality
document.getElementById('viewmodules-button').addEventListener('click', function (event) {
    event.preventDefault();
    viewAllModules();
});