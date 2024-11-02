import { db, ref, set, get, remove} from './firebaseConfig.mjs';

function createPhase() {
    const workspace = document.getElementsByClassName('Phase-Page-Right')[0];

    const phaseSection = document.createElement('div');
    phaseSection.classList.add('Phase-Page-Right-Phase');

    const phaseHead = document.createElement('div');
    phaseHead.classList.add('Phase-Page-Right-Phase-Head');

    const phaseHeadName = document.createElement('div');
    phaseHeadName.classList.add('Phase-Page-Right-Phase-Head-Name');
    phaseHeadName.innerText = "add a new Phase";

    const phaseHeadButton = document.createElement('button');
    phaseHeadButton.classList.add('Phase-Page-Right-Phase-Head-Button');
    phaseHeadButton.innerText = "+";

    phaseHead.appendChild(phaseHeadName);
    phaseHead.appendChild(phaseHeadButton);

    phaseSection.appendChild(phaseHead);

    const phaseBody = document.createElement('div');
    phaseBody.classList.add('Phase-Page-Right-Phase-Body');

    const phaseBodyDetail = document.createElement('div');
    phaseBodyDetail.classList.add('Phase-Page-Right-Phase-Body-Detail');

    const phaseBodyOption = document.createElement('div');
    phaseBodyOption.classList.add('Phase-Page-Right-Phase-Body-Option');

    const phaseOptionEdit = document.createElement('button');
    phaseOptionEdit.classList.add('Phase-Page-Right-Phase-Body-Options-Edit');
    phaseOptionEdit.innerText = "Edit";

    const phaseOptionDelete = document.createElement('button');
    phaseOptionDelete.classList.add('Phase-Page-Right-Phase-Body-Options-Delete');
    phaseOptionDelete.innerText = "Delete";

    const phaseOptionSubmit = document.createElement('button');
    phaseOptionSubmit.classList.add('Phase-Page-Right-Phase-Body-Options-Submit');
    phaseOptionSubmit.innerText = "Submit";

    phaseBodyOption.appendChild(phaseOptionEdit);
    phaseBodyOption.appendChild(phaseOptionDelete);
    phaseBodyOption.appendChild(phaseOptionSubmit);

    phaseBody.appendChild(phaseBodyDetail);
    phaseBody.appendChild(phaseBodyOption);

    phaseBody.style.display = 'none';
    phaseSection.appendChild(phaseBody);

    let phaseBodyText = null;

    phaseHeadButton.addEventListener('click', async function () {
        if (phaseBody.style.display === 'none') {
            phaseBody.style.display = 'block';
            if (phaseHeadName.innerText === "add a new Phase") {
                phaseHead.style.display = "none";
                try {
                    phaseBodyText = await showPhaseForm(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName);
                    console.log(phaseBodyText)
                } catch (error) {
                    console.error('Error', error)
                }
            } else {
                console.log(phaseBodyText);
            }
        }
        else {
            phaseBody.style.display = 'none';
        }
    });
    console.log(phaseBodyText);

    workspace.appendChild(phaseSection);

    phaseOptionDelete.addEventListener('click', async function () {
        phaseSection.remove();
        await deletePhase(phaseHeadName.innerText)
        if (phaseHeadName.innerText === "add a new Phase") {
            createPhase();
        }
    });

    phaseOptionEdit.addEventListener('click', function () {
        editPhaseForm(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName, phaseBodyText);
    });
}

function showPhaseForm(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName) {
    return new Promise((resolve) => {

        phaseBodyDetail.innerHTML = '';
        const phaseTitle = document.createElement('input');
        phaseTitle.type = 'text';
        phaseTitle.placeholder = 'Enter the Phase name';
        phaseBody.appendChild(phaseTitle);

        phaseBodyDetail.innerHTML = '';

        const phaseBodyDesc = document.createElement('textarea');
        phaseBodyDesc.placeholder = 'Enter a phase Description';

        phaseBodyDetail.appendChild(phaseBodyDesc);

        phaseOptionSubmit.addEventListener('click', async () => {
            try {
                const phaseBodyText = await submitFunction(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName, phaseTitle, phaseBodyDesc);
                console.log("well" + phaseBodyText);
                await writeFirebaseData(phaseTitle.value, phaseBodyDesc.value);
                createPhase();
                resolve(phaseBodyText);
            } catch (error) {
                console.error(error);
                resolve(null);
            }
        });
    });
}

function editPhaseForm(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName, phaseBodyText) {
    phaseBodyDetail.innerHTML = '';

    let phaseTitle;

    const oldHeadName = phaseHeadName.textContent;

    const existingTitleInput = phaseBody.querySelector('input[type="text"]');
    if (existingTitleInput) {
        existingTitleInput.value = phaseHeadName.textContent;
        phaseTitle = existingTitleInput;
    } else {
        phaseTitle = document.createElement('input');
        phaseTitle.type = 'text';
        phaseTitle.value = phaseHeadName.textContent;
        phaseBodyDetail.appendChild(phaseTitle);
    }

    console.log(phaseBodyText);

    const phaseBodyDiv = document.createElement('div');    

    const phaseBodyDesc = document.createElement('textarea');
    phaseBodyDesc.value = phaseBodyText;

    phaseBodyDiv.appendChild(phaseBodyDesc);
    phaseBodyDetail.appendChild(phaseBodyDiv);


    phaseBody.appendChild(phaseBodyDetail);

    phaseOptionSubmit.replaceWith(phaseOptionSubmit.cloneNode(true));
    phaseOptionSubmit = phaseBody.querySelector('.Phase-Page-Right-Phase-Body-Options-Submit');

    phaseOptionSubmit.addEventListener('click', async () => {
        try {
            phaseBodyText = await submitFunction(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName, phaseTitle, phaseBodyDesc, oldHeadName);
        } catch (error) {
            console.error(error);
        }
    });


}

function submitFunction(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName, phaseTitle, phaseBodyDesc, oldHeadName) {
    return new Promise(async (resolve, reject) => {

        const phaseName = phaseTitle.value;

        if (phaseName === '') {
            reject('Group Name is required');
            return;
        }

        const phaseDesc = phaseBodyDesc.value;

        phaseHeadName.innerText = phaseName;

        phaseBodyDetail.innerHTML = '';

        const phaseBodyText = document.createElement('div');
        phaseBodyText.innerText = phaseDesc;
        console.log(phaseDesc);
        phaseBodyDetail.appendChild(phaseBodyText);
        phaseTitle.remove();
        phaseBody.style.display = 'none';
        phaseHead.style.display = 'flex';

        await deletePhase(oldHeadName);
        await writeFirebaseData(phaseName, phaseDesc)

        resolve(phaseDesc);
    });
}

async function loadFirebaseData() {
    const phaseData = await readFirebaseData();

    if (phaseData != null) {
        const workspace = document.getElementsByClassName('Phase-Page-Right')[0];

        phaseData.forEach((phase) => {

            const phaseSection = document.createElement('div');
            phaseSection.classList.add('Phase-Page-Right-Phase');

            const phaseHead = document.createElement('div');
            phaseHead.classList.add('Phase-Page-Right-Phase-Head');

            const phaseHeadName = document.createElement('div');
            phaseHeadName.classList.add('Phase-Page-Right-Phase-Head-Name');
            phaseHeadName.innerText = phase.Name;

            const phaseHeadButton = document.createElement('button');
            phaseHeadButton.classList.add('Phase-Page-Right-Phase-Head-Button');
            phaseHeadButton.innerText = "+";

            phaseHead.appendChild(phaseHeadName);
            phaseHead.appendChild(phaseHeadButton);

            phaseSection.appendChild(phaseHead);

            const phaseBody = document.createElement('div');
            phaseBody.classList.add('Phase-Page-Right-Phase-Body');

            const phaseBodyDetail = document.createElement('div');
            phaseBodyDetail.classList.add('Phase-Page-Right-Phase-Body-Detail');

            const phaseBodyDesc = document.createElement('div');
            phaseBodyDesc.innerText = phase.Desc;

            phaseBodyDetail.appendChild(phaseBodyDesc);

            const phaseBodyOption = document.createElement('div');
            phaseBodyOption.classList.add('Phase-Page-Right-Phase-Body-Option');

            const phaseOptionEdit = document.createElement('button');
            phaseOptionEdit.classList.add('Phase-Page-Right-Phase-Body-Options-Edit');
            phaseOptionEdit.innerText = "Edit";

            const phaseOptionDelete = document.createElement('button');
            phaseOptionDelete.classList.add('Phase-Page-Right-Phase-Body-Options-Delete');
            phaseOptionDelete.innerText = "Delete";

            const phaseOptionSubmit = document.createElement('button');
            phaseOptionSubmit.classList.add('Phase-Page-Right-Phase-Body-Options-Submit');
            phaseOptionSubmit.innerText = "Submit";

            phaseBodyOption.appendChild(phaseOptionEdit);
            phaseBodyOption.appendChild(phaseOptionDelete);
            phaseBodyOption.appendChild(phaseOptionSubmit);

            phaseBody.appendChild(phaseBodyDetail);
            phaseBody.appendChild(phaseBodyOption);

            phaseBody.style.display = 'none';
            phaseSection.appendChild(phaseBody);

            let phaseBodyText = phase.Desc;

            phaseHeadButton.addEventListener('click', function () {
                if (phaseBody.style.display === 'none') {
                    phaseBody.style.display = 'block';
                }
                else {
                    phaseBody.style.display = 'none';
                }
            });

            workspace.appendChild(phaseSection);

            phaseOptionDelete.addEventListener('click', async function () {
                phaseSection.remove();
                await deletePhase(phaseHeadName.innerText)
            });

            phaseOptionEdit.addEventListener('click', function () {
                editPhaseForm(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName, phaseBodyText);
            });
        })
    }
}

async function writeFirebaseData(phaseName, phaseDesc) {
    try {
        const dbRef = ref(db, `Phases/${phaseName}`);
        await set(dbRef, {
            Desc: phaseDesc,
            Name: phaseName
        });
        console.log(`Phase "${phaseName}" successfully written to the database`);
    } catch (error) {
        console.error("Error writing phase data:", error);
    }
}

async function readFirebaseData() {
    try {
        const dbRef = ref(db, `Phases`);
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
            const allPhasesData = snapshot.val();
            console.log("All phases data retrieved:", allPhasesData);

            // Convert the object to an array of phases
            const phasesArray = Object.keys(allPhasesData).map(phaseName => ({
                name: phaseName,
                ...allPhasesData[phaseName]
            }));

            console.log("All phases as an array:", phasesArray);
            return phasesArray;
        } else {
            console.log("No phases data available");
            return [];
        }
    } catch (error) {
        console.error("Error reading all phases data:", error);
        return [];
    }
}

async function deletePhase(phaseName) {
    try {
        const phaseRef = ref(db, `Phases/${phaseName}`);
        await remove(phaseRef); // Delete the specified phase
        console.log(`Phase '${phaseName}' deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting phase '${phaseName}':`, error);
    }
}


document.addEventListener('DOMContentLoaded', async function () {
    await loadFirebaseData();
    await createPhase();
});

