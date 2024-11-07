import { db, ref, get, set, remove, auth} from './firebaseConfig.mjs';
import { onAuthStateChanged, getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

function createModule() {
    const workspace = document.getElementsByClassName('Module-Page-Right')[0];

    const moduleSection = document.createElement('div');
    moduleSection.classList.add('Module-Page-Right-Module');

    const moduleHead = document.createElement('div');
    moduleHead.classList.add('Module-Page-Right-Module-Head');

    const moduleHeadName = document.createElement('div');
    moduleHeadName.classList.add('Module-Page-Right-Module-Head-Name');
    moduleHeadName.innerText = "Add a new Module";

    const moduleHeadButton = document.createElement('button');
    moduleHeadButton.classList.add('Module-Page-Right-Module-Head-Button');
    moduleHeadButton.innerText = "+";

    moduleHead.appendChild(moduleHeadName);
    moduleHead.appendChild(moduleHeadButton);

    moduleSection.appendChild(moduleHead);

    const moduleBody = document.createElement('div');
    moduleBody.classList.add('Module-Page-Right-Module-Body');

    const moduleBodyDetail = document.createElement('div');
    moduleBodyDetail.classList.add('Module-Page-Right-Module-Body-Detail');

    const moduleBodyOption = document.createElement('div');
    moduleBodyOption.classList.add('Module-Page-Right-Module-Body-Option');

    const moduleOptionEdit = document.createElement('button');
    moduleOptionEdit.classList.add('Module-Page-Right-Module-Body-Option-Edit');
    moduleOptionEdit.innerText = "Edit";

    const moduleOptionDelete = document.createElement('button');
    moduleOptionDelete.classList.add('Module-Page-Right-Module-Body-Option-Delete');
    moduleOptionDelete.innerText = "Delete";

    const moduleOptionSubmit = document.createElement('button');
    moduleOptionSubmit.classList.add('Module-Page-Right-Module-Body-Option-Submit');
    moduleOptionSubmit.innerText = "Submit";

    moduleBodyOption.appendChild(moduleOptionEdit);
    moduleBodyOption.appendChild(moduleOptionDelete);
    moduleBodyOption.appendChild(moduleOptionSubmit);

    moduleBody.appendChild(moduleBodyDetail);
    moduleBody.appendChild(moduleBodyOption);

    moduleBody.style.display = 'none';
    moduleSection.appendChild(moduleBody);

    let moduleBodyText = null;

    moduleHeadButton.addEventListener('click', async function () {
        if (moduleBody.style.display === 'none') {
            moduleBody.style.display = 'block'
            if (moduleHeadName.innerText === "Add a new Module") {
                moduleHead.style.display = "none";
                try {
                    moduleBodyText = await showModuleForm(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName);

                } catch (error) {
                    console.error('Error', error)
                }
            } else {
                console.log(moduleBodyText)
            }
        }
        else {
            moduleBody.style.display = 'none';
        }
    });
    console.log(moduleBodyText);

    workspace.appendChild(moduleSection);

    moduleOptionDelete.addEventListener('click', async function () {
        moduleSection.remove();
        await deleteModule(moduleHeadName.innerText)
        if (moduleHeadName.innerText === 'Add a new Module') {
            createModule();
        }
    });

    moduleOptionEdit.addEventListener('click', function () {
        editModuleForm(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName, moduleBodyText)
    });
}

function showModuleForm(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName) {
    return new Promise((resolve) => {

        moduleBodyDetail.innerHTML = '';
        const moduleTitle = document.createElement('input');
        moduleTitle.type = 'text';
        moduleTitle.placeholder = 'Enter the Module name';
        moduleBodyDetail.appendChild(moduleTitle);

        const moduleBodyTop = document.createElement('div');
        const moduleBodyBottom = document.createElement('div');

        const moduleBodyDesc = document.createElement('textarea');
        moduleBodyDesc.placeholder = 'Enter a module description';
        moduleBodyTop.appendChild(moduleBodyDesc); // Append the textarea to the DOM
        moduleBodyDetail.appendChild(moduleBodyTop);

        let selectedCriteria;
        let selectedPhase;

        // Asynchronous function to handle the dropdown creation within the larger code block
        (async () => {
            try {
                const assessments = await getEvaluationNames();
                console.log(assessments); // Log the retrieved assessments

                // Create a dropdown element for assessments
                const moduleDropdown = document.createElement('select');

                // Check if assessments is an array before iterating
                if (Array.isArray(assessments)) {
                    assessments.forEach(assessment => {
                        const moduleDropOption = document.createElement('option'); // Create an <option> element
                        moduleDropOption.value = "Evaluation Criteria: " + assessment; // Set the value of the option
                        moduleDropOption.textContent = assessment; // Set the display text for the option
                        moduleDropdown.appendChild(moduleDropOption); // Append the option to the dropdown
                    });
                } else {
                    console.error("Expected an array but got:", assessments);
                }

                // Append the dropdown to the DOM
                moduleBodyBottom.appendChild(moduleDropdown);

                // Add an event listener to capture the selected option
                moduleDropdown.addEventListener('change', (event) => {
                    selectedCriteria = event.target.value; // Get the selected value
                    console.log("Selected option:", selectedCriteria); // Log the selected value
                });
            } catch (error) {
                console.error("Error retrieving assessment names:", error);
            }
        })();

        (async function () {
            try {
                // Fetch the phase names
                const phases = await getPhase();
                console.log(phases); // Log the retrieved phases

                // Create a dropdown element for phases
                const phaseDropdown = document.createElement('select');

                // Check if phases is an array before iterating
                if (Array.isArray(phases)) {
                    phases.forEach(phase => {
                        const phaseOption = document.createElement('option'); // Create an <option> element
                        phaseOption.value = "Phase: " + phase; // Set the value of the option
                        phaseOption.textContent = phase; // Set the display text for the option
                        phaseDropdown.appendChild(phaseOption); // Append the option to the dropdown
                    });
                } else {
                    console.error("Expected an array but got:", phases);
                }

                // Append the dropdown to the DOM
                moduleBodyBottom.appendChild(phaseDropdown);

                // Add an event listener to capture the selected option
                phaseDropdown.addEventListener('change', (event) => {
                    selectedPhase = event.target.value; // Get the selected value
                    console.log("Selected phase:", selectedPhase); // Log the selected value
                });
            } catch (error) {
                console.error("Error retrieving phase names:", error);
            }
        })();

        moduleBodyDetail.appendChild(moduleBodyBottom);
        moduleBody.appendChild(moduleBodyDetail);


        moduleOptionSubmit.addEventListener('click', async () => {
            try {
                const moduleBodyText = await submitFunction(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName, moduleTitle, moduleBodyDesc, selectedCriteria, selectedPhase);
                console.log("well" + moduleBodyText);
                deleteModule(moduleHeadName.innerText)
                await writeFirebaseData(moduleTitle.value, moduleBodyDesc.value, selectedCriteria, selectedPhase);
                createModule();
                resolve(moduleBodyText);
            } catch (error) {
                console.error(error);
                resolve(null);
            }
        });
    });
}

function editModuleForm(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName, moduleBodyText) {
    moduleBodyDetail.innerHTML = '';

    let moduleTitle;

    const oldHeadName = moduleHeadName.textContent;

    const existingTitleInput = moduleBody.querySelector('input[type="text"]');
    if (existingTitleInput) {
        existingTitleInput.value = moduleHeadName.textContent;
        moduleTitle = existingTitleInput;
    } else {
        moduleTitle = document.createElement('input');
        moduleTitle.type = 'text';
        moduleTitle.value = moduleHeadName.textContent;
        moduleBodyDetail.appendChild(moduleTitle);
    }

    const moduleBodyDiv = document.createElement('div');

    const moduleBodyTop = document.createElement('div');
    const moduleBodyBottom = document.createElement('div');

    const moduleBodyDesc = document.createElement('textarea');
    moduleBodyDesc.value = moduleBodyText;

    let selectedCriteria;
        let selectedPhase;

        // Asynchronous function to handle the dropdown creation within the larger code block
        (async () => {
            try {
                const assessments = await getEvaluationNames();
                console.log(assessments); // Log the retrieved assessments

                // Create a dropdown element for assessments
                const moduleDropdown = document.createElement('select');

                // Check if assessments is an array before iterating
                if (Array.isArray(assessments)) {
                    assessments.forEach(assessment => {
                        const moduleDropOption = document.createElement('option'); // Create an <option> element
                        moduleDropOption.value = assessment; // Set the value of the option
                        moduleDropOption.textContent = assessment; // Set the display text for the option
                        moduleDropdown.appendChild(moduleDropOption); // Append the option to the dropdown
                    });
                } else {
                    console.error("Expected an array but got:", assessments);
                }

                // Append the dropdown to the DOM
                moduleBodyBottom.appendChild(moduleDropdown);

                // Add an event listener to capture the selected option
                moduleDropdown.addEventListener('change', (event) => {
                    selectedCriteria = event.target.value; // Get the selected value
                    console.log("Selected option:", selectedCriteria); // Log the selected value
                });
            } catch (error) {
                console.error("Error retrieving assessment names:", error);
            }
        })();

        (async function () {
            try {
                // Fetch the phase names
                const phases = await getPhase();
                console.log(phases); // Log the retrieved phases

                // Create a dropdown element for phases
                const phaseDropdown = document.createElement('select');

                // Check if phases is an array before iterating
                if (Array.isArray(phases)) {
                    phases.forEach(phase => {
                        const phaseOption = document.createElement('option'); // Create an <option> element
                        phaseOption.value = phase; // Set the value of the option
                        phaseOption.textContent = phase; // Set the display text for the option
                        phaseDropdown.appendChild(phaseOption); // Append the option to the dropdown
                    });
                } else {
                    console.error("Expected an array but got:", phases);
                }

                // Append the dropdown to the DOM
                moduleBodyBottom.appendChild(phaseDropdown);

                // Add an event listener to capture the selected option
                phaseDropdown.addEventListener('change', (event) => {
                    selectedPhase = event.target.value; // Get the selected value
                    console.log("Selected phase:", selectedPhase); // Log the selected value
                });
            } catch (error) {
                console.error("Error retrieving phase names:", error);
            }
        })();

    moduleBodyTop.appendChild(moduleBodyDesc);
    moduleBodyDetail.appendChild(moduleBodyTop);

    moduleBodyDetail.appendChild(moduleBodyBottom);

    moduleBody.appendChild(moduleBodyDetail);

    moduleOptionSubmit.replaceWith(moduleOptionSubmit.cloneNode(true));
    moduleOptionSubmit = moduleBody.querySelector('.Module-Page-Right-Module-Body-Options-Submit');

    moduleOptionSubmit.addEventListener('click', async () => {
        try {
            moduleBodyText = await submitFunction(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName, moduleTitle, moduleBodyDesc, oldHeadName);
        } catch (error) {
            console.error(error);
        }
    });
}

function submitFunction(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName, moduleTitle, moduleBodyDesc, oldHeadName, selectedCriteria, selectedPhase) {
    return new Promise(async (resolve, reject) => {

        const moduleName = moduleTitle.value;

        if (moduleName === '') {
            reject('Group Name is required');
            return;
        }

        const moduleDesc = moduleBodyDesc.value;

        moduleHeadName.innerText = moduleName;

        moduleBodyDetail.innerHTML = '';

        const moduleBodyText = document.createElement('div');
        moduleBodyText.innerText = moduleDesc;
        const moduleBodyCriteria = document.createElement('div');
        moduleBodyCriteria.innerText = selectedCriteria;
        const moduleBodyPhase = document.createElement('div');
        moduleBodyPhase.innerText = selectedPhase;
        console.log(moduleDesc);
        moduleBodyDetail.appendChild(moduleBodyText);
        moduleTitle.remove();
        moduleBody.style.display = 'none';
        moduleHead.style.display = 'flex';

        await deleteModule(oldHeadName);
        await writeFirebaseData(moduleName, moduleDesc, selectedCriteria, selectedPhase)

        resolve(moduleDesc);
    });
}

async function loadFirebaseData() {
    const moduleData = await readFirebaseData();

    if (moduleData != null) {
        const workspace = document.getElementsByClassName('Module-Page-Right')[0];

        moduleData.forEach((module) => {

            const moduleSection = document.createElement('div');
            moduleSection.classList.add('Module-Page-Right-Module');

            const moduleHead = document.createElement('div');
            moduleHead.classList.add('Module-Page-Right-Module-Head');

            const moduleHeadName = document.createElement('div');
            moduleHeadName.classList.add('Module-Page-Right-Module-Head-Name');
            moduleHeadName.innerText = module.Name;

            const moduleHeadButton = document.createElement('button');
            moduleHeadButton.classList.add('Module-Page-Right-Module-Head-Button');
            moduleHeadButton.innerText = "+";

            moduleHead.appendChild(moduleHeadName);
            moduleHead.appendChild(moduleHeadButton);

            moduleSection.appendChild(moduleHead);

            const moduleBody = document.createElement('div');
            moduleBody.classList.add('Module-Page-Right-Module-Body');

            const moduleBodyDetail = document.createElement('div');
            moduleBodyDetail.classList.add('Module-Page-Right-Module-Body-Detail');

            const moduleBodyDesc = document.createElement('div');
            moduleBodyDesc.innerText = module.Desc;
            const moduleBodyCriteria = document.createElement('div');
            moduleBodyCriteria.innerText = "Evaluation Criteria: " + module.Criteria;
            const moduleBodyPhase = document.createElement('div');
            moduleBodyPhase.innerText = "Phase: " + module.Phase;

            moduleBodyDetail.appendChild(moduleBodyDesc);
            moduleBodyDetail.appendChild(moduleBodyCriteria);
            moduleBodyDetail.appendChild(moduleBodyPhase);

            const moduleBodyOption = document.createElement('div');
            moduleBodyOption.classList.add('Module-Page-Right-Module-Body-Option');

            const moduleOptionEdit = document.createElement('button');
            moduleOptionEdit.classList.add('Module-Page-Right-Module-Body-Options-Edit');
            moduleOptionEdit.innerText = "Edit";

            const moduleOptionDelete = document.createElement('button');
            moduleOptionDelete.classList.add('Module-Page-Right-Module-Body-Options-Delete');
            moduleOptionDelete.innerText = "Delete";

            const moduleOptionSubmit = document.createElement('button');
            moduleOptionSubmit.classList.add('Module-Page-Right-Module-Body-Options-Submit');
            moduleOptionSubmit.innerText = "Submit";

            moduleBodyOption.appendChild(moduleOptionEdit);
            moduleBodyOption.appendChild(moduleOptionDelete);
            moduleBodyOption.appendChild(moduleOptionSubmit);

            moduleBody.appendChild(moduleBodyDetail);
            moduleBody.appendChild(moduleBodyOption);

            moduleBody.style.display = 'none';
            moduleSection.appendChild(moduleBody);

            let moduleBodyText = module.Desc;

            moduleHeadButton.addEventListener('click', function () {
                if (moduleBody.style.display === 'none') {
                    moduleBody.style.display = 'block';
                }
                else {
                    moduleBody.style.display = 'none';
                }
            });

            workspace.appendChild(moduleSection);

            moduleOptionDelete.addEventListener('click', async function () {
                moduleSection.remove();
                await deleteModule(moduleHeadName.innerText)
            });

            moduleOptionEdit.addEventListener('click', function () {
                editModuleForm(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName, moduleBodyText);
            });
        })
    }
}

async function writeFirebaseData(moduleName, moduleDesc, selectedCriteria, selectedPhase) {
    try {
        const dbRef = ref(db, `Modules/${moduleName}`);
        await set(dbRef, {
            Desc: moduleDesc,
            Name: moduleName,
            Phase: selectedPhase,
            Criteria: selectedCriteria
        });
        console.log(`Module "${moduleName}" successfully written to the database`);
    } catch (error) {
        console.error("Error writing Module data:", error);
    }
}

async function deleteFirebaseData(moduleName) {
    try {
        const dbRef = ref(db, `Modules/${moduleName}`);
        await remove(dbRef);
        console.log(`Module "${moduleName}" successfully deleted from the database`);
    } catch (error) {
        console.error("Error deleting Module data:", error);
    }
}

async function readFirebaseData() {
    try {
        const dbRef = ref(db, `Modules`);
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
            const allModuleData = snapshot.val();
            console.log("All Module data retrieved:", allModuleData);

            // Convert the object to an array of modules
            const moduleArray = Object.keys(allModuleData).map(moduleName => ({
                name: moduleName,
                ...allModuleData[moduleName]
            }));

            console.log("All module as an array:", moduleArray);
            return moduleArray;
        } else {
            console.log("No module data available");
            return [];
        }
    } catch (error) {
        console.error("Error reading all module data:", error);
        return [];
    }
}

async function getEvaluationNames() {
    try {
        const dbRef = ref(db, 'Evaluation Criteria');
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
            const criteriaData = snapshot.val(); // Get the data under "Evaluation Criteria"
            const assessmentNames = Object.keys(criteriaData); // Get the keys (names)

            console.log(assessmentNames); // Log the names or use them as needed
            return assessmentNames; // Return the array of names
        } else {
            console.log("No data available");
            return []; // Return an empty array if no data exists
        }
    } catch (error) {
        console.error("Error getting data:", error);
        return []; // Return an empty array in case of error
    }
}

async function getPhase() {
    try {
        const dbRef = ref(db, 'Phases');
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
            const phaseData = snapshot.val(); // Get the data under "Phases"
            const phaseNames = Object.keys(phaseData); // Get the keys (names)

            console.log(phaseNames); // Log the names or use them as needed
            return phaseNames; // Return the array of names
        } else {
            console.log("No data available");
            return []; // Return an empty array if no data exists
        }
    } catch (error) {
        console.error("Error getting phase data:", error);
        return []; // Return an empty array in case of error
    }
}


async function deleteModule(moduleName) {
    try {
        const moduleRef = ref(db, `Modules/${moduleName}`);
        await remove(moduleRef); // Delete the specified module
        console.log(`Module '${moduleName}' deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting module '${moduleName}':`, error);
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
                window.location.href = "loginMain.html";
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


document.addEventListener('DOMContentLoaded', async function () {
    await loadFirebaseData();
    await createModule();
});