
// batch entry okay
// module entry and alert of exceeding 100 is okay and module store in local store until full submision
//submiting mkodules and view modules at middle and submitall modules make the fullmodules save in firebase
//delete works.modules delete from locally
// not repeating the module option 
//viewmodule gets toggle
//but editing works but when entering phase and criteria and submit in the view module only the first option is showing also got corrected everything in modules fine
// active field in module is given
//startdateand end were added
import { db, ref, set, get } from './firebaseConfig.js';
import { fetchPhase, fetchCriteria } from './CriteriaAndPhaseOption.js';  // Import the fetch function

export let currentBatchName = '';
export let currentBatchYear = '';
let phaseWeightage = {};
let modules = [];

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

// Function to handle batch form submission
document.getElementById('Config-Page-Right-bottom-submit').addEventListener('click', async function (event) {
    event.preventDefault();
    const year = document.getElementById('batch-year').value;
    currentBatchYear = year;

    if (year) {
        await addBatch(year);
    } else {
        alert("Please enter a year.");
    }
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
    const optionContainer = document.createElement('div');
    optionContainer.classList.add('Config-Page-Right-bottom-addmodule-moduleform');
    optionContainer.innerHTML = `
        <form class="module-form">
            <h5>New Module</h5><br>
            <label>Module Name:</label>
            <input type="text" class="module-name" required />
            <label>Total Weightage:</label>
            <input type="number" class="module-weightage" required /><br><br>
            <label>Criteria:</label>
            <select class="module-criteria" required>
                <option value="">Select a criteria</option>
            </select>
            <label>Phase:</label>
            <select class="module-phase" required>
                <option value="">Select a phase</option>
            </select>
            <button type="button" class="delete-modules">
                <i class="fa-solid fa-trash" style="width:20px;"></i>
            </button>
            <button type="submit" class="module-submit">Submit</button>
        </form>
    `;

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
            const moduleDiv = document.createElement('div');
            moduleDiv.classList.add('Config-Page-Right-bottom-viewmodule-moduleform');
            moduleDiv.innerHTML = `
                <form class="module-form" data-index="${index}">
                    <h5>Module Name: <span>${module.moduleName}</span></h5>
                    <label>Module Name:</label>
                    <input type="text" class="module-name" value="${module.moduleName}" required readonly />
                    <label>Total Weightage:</label>
                    <input type="number" class="module-weightage" value="${module.totalWeightage}" required readonly /><br><br>
                    <label>Criteria:</label>
                    <select class="module-criteria" required disabled>
                        <option value="${module.criteria}">${module.criteria}</option>
                        <!-- Add more options here as necessary -->
                    </select>
                    <label>Phase:</label>
                    <select class="module-phase" required disabled>
                        <option value="${module.phase}">${module.phase}</option>
                        <!-- Add more options here as necessary -->
                    </select>
                    <button type="button" class="module-Edit" data-index="${index}">Edit</button>
                    <button type="button" class="delete-submitedModule" data-index="${index}">Delete</button>
                    <hr />
                </form>
            `;
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

