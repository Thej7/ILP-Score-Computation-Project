import { collection, doc, getDocs, setDoc} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from './firebaseConfig.mjs';

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
    
    phaseHeadButton.addEventListener('click', function () {
        if (phaseBody.style.display === 'none') {
            phaseBody.style.display = 'block';
            if (phaseHeadName.innerText === "add a new Phase") {
                phaseHead.style.display = "none";
                showPhaseForm(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName);
            }
        } 
        else {
            phaseBody.style.display = 'none';
        }
    });

    workspace.appendChild(phaseSection);

    phaseOptionDelete.addEventListener('click', function () {
        phaseSection.remove();
    });

    phaseOptionEdit.addEventListener('click', function () {
        editPhaseForm(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName);
    });
}

function showPhaseForm(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName){
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
            await submitFunction(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName, phaseTitle, phaseBodyDesc);
            await createPhase();
        } catch (error) {
            console.error(error);
        }
    }); 
}

// function editCriteriaForm(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName) {
//     phaseBodyDetail.innerHTML = '';


// }

function submitFunction(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName, phaseTitle, phaseBodyDesc) {
    return new Promise((resolve, reject) => {

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
        phaseBodyDetail.appendChild(phaseBodyText);
        phaseTitle.remove();
        phaseBody.style.display = 'none';
        phaseHead.style.display = 'flex';

        resolve(phaseBodyText);
    });
}

createPhase();

