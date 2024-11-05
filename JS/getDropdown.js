import { db, ref, get, set, remove, auth} from './firebaseConfig.mjs';
import { onAuthStateChanged, getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Function to fetch document names from the 'Evaluation Criteria' and populate dropdown
async function fetchCriteria(dropdown) {
    try {
        const criteriaRef = ref(db, 'Evaluation Criteria');
        const snapshot = await get(criteriaRef);

        dropdown.innerHTML = ''; // Clear existing options

        if (snapshot.exists()) {
            const criteriaData = snapshot.val();
            console.log("Criteria Data:", criteriaData);  // Log the retrieved data

            Object.keys(criteriaData).forEach((key) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                dropdown.appendChild(option);
            });
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error("Error fetching modules:", error);
    }
}





// fetchphaseOptions.js


// Function to fetch document names from the 'Evaluation Criteria' and populate dropdown
async function fetchPhase(phasedropdown) {
    try {
        const PhaseRef = ref(db, 'Phases');
        const snapshot = await get(PhaseRef);

        phasedropdown.innerHTML = ''; // Clear existing options

        if (snapshot.exists()) {
            const criteriaData = snapshot.val();
            console.log("phase Data:", criteriaData);  // Log the retrieved data

            Object.keys(criteriaData).forEach((key) => {
                const phaseoption = document.createElement('option');
                phaseoption.value = key;
                phaseoption.textContent = key;
                phasedropdown.appendChild(phaseoption);
            });
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error("Error fetching Phase:", error);
    }
}
export { fetchCriteria };
export { fetchPhase };
