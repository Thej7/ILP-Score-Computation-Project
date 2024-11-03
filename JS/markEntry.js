import { db, ref, get, set} from './firebaseConfig.mjs'; // Import necessary Firebase functions

let studentsList;
let evalCriterias;
const selectedPhase = localStorage.getItem("selectedPhase"); // Get selected phase from localStorage
const selectedModule = localStorage.getItem("selectedModule"); // Get selected module from localStorage
const lastBatchData = JSON.parse(localStorage.getItem("lastBatchData")); // Get last active batch data
const lastBatchYear = localStorage.getItem("lastBatchYear");
const lastBatchKey = localStorage.getItem("lastBatchKey");

async function populateDropdownWithPhaseModules() {
    console.log(lastBatchKey);
    console.log(lastBatchYear);
    console.log(lastBatchData);
    let criteria = null;
    // Check if lastBatchData and modules are defined
    if (lastBatchData && lastBatchData.modules) {
        const modules = lastBatchData.modules;

        // Check if the selected module exists in lastBatchData
        if (modules[selectedModule]) {
            criteria = modules[selectedModule].criteria; // Access the criteria of the selected module
            console.log(`Criteria for ${selectedModule}: ${criteria}`);
        }
    }





    // // Function to fetch evaluation criteria and log name and points
    async function fetchEvaluationCriteria() {
        const criteriaRef = ref(db, `Evaluation Criteria/${criteria}`); // Adjust the path as needed
        const evaluationCriteria = []; // Array to store fetched criteria
    
        try {
            const snapshot = await get(criteriaRef);
            if (snapshot.exists()) {
                const criteriaData = snapshot.val();
    
                // Iterate over the criteria entries
                Object.keys(criteriaData).forEach((criterionKey) => {
                    const criterion = criteriaData[criterionKey]; // This will be 1, 2, etc.
    
                    // Log the details
                    console.log(`Criterion ID: ${criterion.id}`); // Log the ID
                    console.log(`Criterion Name: ${criterion.name}`); // Log the name
                    console.log(`Criterion Points: ${criterion.points}`); // Log the points
    
                    // Store the criterion in the evaluationCriteria array
                    evaluationCriteria.push({
                        id: criterion.id,
                        name: criterion.name,
                        points: criterion.points
                    });
                });
            } else {
                console.log("No evaluation criteria data available.");
            }
        } catch (error) {
            console.error("Error fetching evaluation criteria:", error);
        }
    
        return evaluationCriteria; // Return the collected criteria
    }
    



    async function fetchStudentList() {
        const studentListRef = ref(db, `studentList/${lastBatchYear}/${lastBatchKey}`);
        console.log(`Fetching data from: ${studentListRef.toString()}`); // Log the path
        const studentNames = []; // Array to store student names
    
        try {
            const snapshot = await get(studentListRef);
            if (snapshot.exists()) {
                const students = snapshot.val();
                
                // Collect each student's name in the studentNames array
                Object.keys(students).forEach((studentId) => {
                    const student = students[studentId];
                    console.log(student.name); // Log each student's name
                    studentNames.push(student.name); // Add the name to the array
                });
            } else {
                console.log("No data available for the specified path.");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    
        return studentNames; // Return the list of student names
    }

    studentsList = await fetchStudentList()
    // Call the function to fetch and log the criteria
    evalCriterias = await fetchEvaluationCriteria();
    console.log(studentsList);
    console.log(evalCriterias);
    if (!selectedPhase || !lastBatchData) {
        console.error("No phase or batch data available");
        return;
    }

    // Only get modules from the last active batch data
    const modulesInPhase = [];
    if (lastBatchData.modules) {
        // Iterate over modules in the last active batch to find those in the selected phase
        Object.keys(lastBatchData.modules).forEach(moduleKey => {
            const module = lastBatchData.modules[moduleKey];
            if (module.phase === selectedPhase) {
                modulesInPhase.push(module.moduleName); // Add module name to the array
            }
        });
    }

    // Populate the dropdown with the modules
    const dropdown = document.getElementById("module-dropdown");
    dropdown.innerHTML = ''; // Clear existing options

    // Add the selected module first, if it exists in the modules
    if (selectedModule && modulesInPhase.includes(selectedModule)) {
        const selectedOption = document.createElement("option");
        selectedOption.value = selectedModule;
        selectedOption.textContent = selectedModule;
        dropdown.appendChild(selectedOption); // Append selected module as an option
    }

    // Add the rest of the modules (excluding the selected module)
    modulesInPhase.forEach(moduleName => {
        if (moduleName !== selectedModule) { // Ensure the selected module is not added again
            const option = document.createElement("option");
            option.value = moduleName;
            option.textContent = moduleName;
            dropdown.appendChild(option); // Append each module as an option
        }
    });
}














// Declare variables in the broader scope
let currentCardIndex = 0;
let cards = [];
let isEditing = false; // Flag to indicate edit mode
let sampleCards = [];

// Function to initialize cards after the dropdown is populated
function initializeCards() {
    // Assuming populateDropdownWithPhaseModules populates studentsList
    sampleCards = studentsList.map(name => {
        // Create a base card with just the student's name
        let cardData = { name: name };

        // Add each criterion from criteriaArray to the card
        evalCriterias.forEach(criterion => {
            cardData[criterion.name] = ""; // Set each criterion name as a key with empty string as the initial value
        });

        return cardData;
    });

    // Save the `sampleCards` to localStorage if needed
    localStorage.setItem('cards', JSON.stringify(sampleCards));

    console.log("Sample cards initialized:", sampleCards); // Check if the cards are properly initialized
}

// Function to display an empty card
function displayEmptyCard() {
    const cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = ''; // Clear previous content

    const emptyCard = document.createElement('div');
    emptyCard.className = 'card';
    emptyCard.innerHTML = 'No data available.';
    cardContainer.appendChild(emptyCard);
}

// Modify showCard to ensure it only displays valid cards
function showCard(index) {
    const cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = ''; // Clear previous cards

    const validCards = cards.filter(card => Object.keys(card).length > 0); // Filter valid cards

    if (validCards.length === 0) {
        displayEmptyCard();
        return;
    }

    if (index >= 0 && index < validCards.length) {
        // Create current card
        const currentCard = createCardElement(validCards[index]);
        currentCard.classList.add('current-card');
        cardContainer.appendChild(currentCard);

        // Create next card (hidden initially)
         // Create next card if it exists
        if (index + 1 < validCards.length) {
        const nextCard = createCardElement(validCards[index + 1]);
        nextCard.classList.add('next-card');
        cardContainer.appendChild(nextCard);
        }

        // Create previous card (hidden initially)
        // Create previous card if it exists
        if (index - 1 >= 0) {
        const previousCard = createCardElement(validCards[index - 1]);
        console.log("previous"+previousCard);
        previousCard.classList.add('next-next-card');
        cardContainer.appendChild(previousCard);
        }
    } else {
        alert("No more cards available!");
    }
}

// Function to create card element
function createCardElement(cardData)
 {
    const card = document.createElement('div');
    card.className = 'card';
    console.log("card"+cardData);
    // Display validation errors from Excel import
    for (const [key, value] of Object.entries(cardData))
     {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';

        const label = document.createElement('label');
        label.textContent = key.charAt(0).toUpperCase() + key.slice(1) + ":";
        inputContainer.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.className = 'input-field';
        input.readOnly = !isEditing; // Make input editable only in edit mode

        // Find the points for the corresponding criterion
        const criterion = evalCriterias.find(criterion => criterion.name === key);

        // Validate input field as user types
        if (criterion) {
            input.addEventListener('input', () => {
                const inputValue = parseFloat(input.value);

                if (inputValue > criterion.points) {
                    input.setCustomValidity(`Value must be less than or equal to ${criterion.points}`);
                    input.reportValidity(); // Show validation message
                } else {
                    input.setCustomValidity(''); // Clear error message
                }
            });
        }

        inputContainer.appendChild(input);
        card.appendChild(inputContainer);
    }

    // Show Edit and Save buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.appendChild(createButton('Edit', toggleEditMode));
    buttonContainer.appendChild(createButton('Save', saveChanges));
    card.appendChild(buttonContainer);

    return card;
}


// Function to create a button with text and click handler
function createButton(text, onClick)
 {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = text.toLowerCase(); // e.g., "edit" or "save"
    button.addEventListener('click', onClick);
    return button;
}

// Function to toggle edit mode
function toggleEditMode() {
    isEditing = !isEditing;
    showCard(currentCardIndex); // Refresh to show editable fields
}


// Helper function to sanitize keys by replacing invalid characters
function sanitizeKey(key) {
    return key.replace(/[.#$/\[\]]/g, '_');
}

async function saveChanges() {
    const inputs = document.querySelectorAll('.input-field');
    const keys = Object.keys(cards[currentCardIndex]);
    let hasError = false;

    const updatedCriteria = {};
    let total = 0;

    inputs.forEach((input, index) => {
        const key = keys[index];
        if (key && key !== 'name') {
            const value = parseFloat(input.value) || 0;

            // Find and validate the criterion points
            const criterion = evalCriterias.find(c => c.name === key);
            if (criterion && value > criterion.points) {
                input.setCustomValidity(`Value must be less than or equal to ${criterion.points}`);
                input.reportValidity();
                hasError = true;
            } else {
                input.setCustomValidity('');
                
                // Use sanitized key to prevent errors
                const sanitizedKey = sanitizeKey(key);
                updatedCriteria[sanitizedKey] = value;
                total += value;
            }
        }
    });

    if (hasError) {
        console.log("Validation failed. Data will not be saved.");
        return;
    }

    const studentName = cards[currentCardIndex].name;
    const studentId = `id${currentCardIndex + 1}`;

    // Define sanitized data to save
    const studentRef = ref(db, `marks/${lastBatchYear}/${lastBatchKey}/${selectedModule}/students/${studentId}`);
    const studentData = {
        studentName: studentName,
        criteria: updatedCriteria,
        total: total
    };

    try {
        await set(studentRef, studentData);
        console.log("Data saved successfully:", studentData);
    } catch (error) {
        console.error("Error saving data:", error);
    }

    isEditing = false;
    localStorage.setItem('cards', JSON.stringify(cards));
    await fetchCardsFromDatabase();
    updateDisplay();
}



async function fetchCardsFromDatabase() {
    const year = localStorage.getItem('lastBatchYear'); // Retrieve the current year
    const batchName = localStorage.getItem('lastBatchKey'); // Retrieve the batch name
    const moduleName = localStorage.getItem('selectedModule'); // Retrieve the module name

    const studentRef = ref(db, `marks/${year}/${batchName}/${moduleName}/students`);

    try {
        const snapshot = await get(studentRef);
        if (snapshot.exists()) {
            const studentsData = snapshot.val();

            // Iterate over the existing cards and update criteria where applicable
            cards.forEach((card, index) => {
                const studentId = `id${index + 1}`; // Assuming IDs are sequential like id1, id2, etc.
                const student = studentsData[studentId];

                if (student) {
                    // If the student exists in the database, update the card's criteria
                    cards[index] = {
                        name: student.studentName,
                        ...student.criteria // Spread criteria into the card
                    };
                }
            });

            // Update localStorage with the fetched cards
            localStorage.setItem('cards', JSON.stringify(cards));
            console.log("Cards fetched and updated:", cards);
        } else {
            console.log("No student data available for the specified path.");
            // If no data exists, ensure all cards are initialized (empty criteria)
            initializeCards();
            updateDisplay();
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}



// Button event listeners for navigation
document.getElementById('nextButton').addEventListener('click', () => {
    if (currentCardIndex < cards.length - 1) {
        currentCardIndex++;
        showCard(currentCardIndex);
    } else {
        alert("You've reached the last card!");
    }
});

document.getElementById('previousButton').addEventListener('click', () => {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showCard(currentCardIndex);
    } else {
        alert("You're at the first card!");
    }
});


//Function to handle file upload
// Function to handle file upload
document.getElementById('excelFile').addEventListener('change', handleFile);

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        createCards(jsonData);
    };
    reader.readAsArrayBuffer(file);
}

async function createCards(data) {
    cards = [];
    const headers = data[0].map(header => header.trim().toLowerCase()); // Normalize headers
    const validHeaders = evalCriterias.map(criterion => criterion.name.toLowerCase()); // Get valid headers from criteria
    const validationErrors = new Set(); // Use a Set to store unique validation error messages

    // Step 1: Check if the first header is "name"
    if (headers[0] !== 'name') {
        alert('The first header must be "Name". Please check your Excel sheet.');
        return; // Exit if the first header is not "name"
    }

    // Step 2: Check for unmatched headers
    const unmatchedHeaders = headers.filter(header => header !== 'name' && !validHeaders.includes(header));

    // If there are unmatched headers (excluding "name"), add to validation errors
    if (unmatchedHeaders.length > 0) {
        unmatchedHeaders.forEach(header => {
            validationErrors.add(`The header "${header}" does not match any expected criteria.`);
            
        });
    }

    // Step 3: Process each row and create cards
    data.slice(1).forEach(row => {
        const card = {};
        let isValid = true; // Flag to track if the card is valid

        headers.forEach((header, index) => {
            const cellValue = row[index] !== undefined ? row[index].toString().trim() : ''; // Ensure cellValue is a string
            card[header] = cellValue;
            console.log("CELL VALUE"+cellValue);

            // Perform validation based on criteria (skip the "name" field)
            if (header !== 'name') {
                const criterion = evalCriterias.find(crit => crit.name.toLowerCase() === header);
                if (criterion) {
                    const cellNumberValue = parseFloat(cellValue);
                       console.log(cellNumberValue);

                    // Check if cell is a number and exceeds allowed points
                    if (!isNaN(cellNumberValue) && cellNumberValue > criterion.points) {
                        validationErrors.add(`Error in ${header}: Value ${cellNumberValue} exceeds maximum of ${criterion.points}`); // Use Set to avoid duplicates
                        isValid = false; // Mark card as invalid
                    } else if (isNaN(cellNumberValue) && cellValue !== '') {
                        // Optional: Add error if non-numeric value provided for a numeric criterion
                        validationErrors.add(`Error in ${header}: Value "${cellValue}" is not a valid number.`);
                        isValid = false; // Mark card as invalid
                    }
                } else if (cellValue !== '') {
                    // If no matching criterion was found for this header and it's not empty
                    validationErrors.add(`Warning: No matching criterion for header "${header}".`); // Use Set to avoid duplicates
                    isValid = false; // Optional: Mark card as invalid
                }
            }
        });

        // Only push valid cards
        if (isValid) {
            cards.push(card);
        }
    });

    // If there are validation errors, show them in a popup
    if (validationErrors.size > 0) {
        alert(Array.from(validationErrors).join('\n')); // Convert Set to array for alert
        return; // Exit function after showing errors
    }

    currentCardIndex = 0; // Reset index to the first card
    updateDisplay(); // Display cards on the UI

     // Save each valid card to Firebase
     for (const card of cards) {
        await saveCardToFirebase(card);
    }
    
}
// Function to save each card to Firebase
async function saveCardToFirebase(card) {
    const studentName = card.name;
    const studentId = `id${currentCardIndex + 1}`;

    const studentRef = ref(db, `marks/${lastBatchYear}/${lastBatchKey}/${selectedModule}/students/${studentId}`);

    const studentData = {
        studentName: studentName,
        criteria: Object.fromEntries(
            Object.entries(card).filter(([key]) => key !== 'name') // Filter out 'name' from criteria
        )
    };

    try {
        await set(studentRef, studentData);
        console.log("Data saved to Firebase:", studentData);
    } catch (error) {
        console.error("Error saving data to Firebase:", error);
    }
}


function updateDisplay() {
    // Call showCard with the current card index
    showCard(currentCardIndex);

}









// Create the search container
const searchContainer = document.createElement('div');
searchContainer.className = 'search-container';

// Create the input textbox
const textbox = document.createElement('input');
textbox.type = 'text';
textbox.id = 'search-box';
textbox.placeholder = 'Search name';

// Append the textbox to the search container
searchContainer.appendChild(textbox);

// Append the search container to the main container
document.getElementById('search-container').appendChild(searchContainer);

// Function to search cards based on partial name matches
function searchCards() {
    const searchValue = document.getElementById('search-box').value.trim().toLowerCase(); // Normalize search input
    console.log('Searching for:', searchValue); // Log the search value

    // Find the first matching card based on partial name
    const matchingCardIndex = cards.findIndex(card => {
        const cardName = card['name'] ? card['name'].toLowerCase() : ''; // Adjust 'name' as necessary
        return cardName.includes(searchValue); // Check if card name contains the search value
    });

    if (matchingCardIndex !== -1) {
        currentCardIndex = matchingCardIndex; // Update the current card index
        updateDisplay(); // Update the display to show the matching card
    } else {
        alert("No matching card found!"); // Alert if no match is found
        
    }
}

// Listen for the Enter key press in the search textbox to trigger the search
textbox.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        searchCards();
    }
});

// document.addEventListener("DOMContentLoaded", async () => {
//     await populateDropdownWithPhaseModules();
//     initializeCards(); // Initialize cards after dropdown is populated
// });

document.addEventListener("DOMContentLoaded", async () => {
    // Wait for the dropdown to populate first
    await populateDropdownWithPhaseModules();

    // Then initialize the sample cards
    initializeCards();
    // Use the initialized cards and display them
    cards = sampleCards; // Assign the initialized sample cards to `cards`
    await fetchCardsFromDatabase(); // Fetch data after populating dropdown
    updateDisplay(); // Run updateDisplay last to ensure everything is set up
   
});