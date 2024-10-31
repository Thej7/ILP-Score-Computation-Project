import { collection, doc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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

    let phaseBodyText = null;

    phaseHeadButton.addEventListener('click', function () {
        if (phaseBody.style.display === 'none') {
            phaseBody.style.display = 'block';
            if (phaseHeadName.innerText === "add a new Phase") {
                phaseHead.style.display = "none";
                try {
                    phaseBodyText = showPhaseForm(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName);
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

    workspace.appendChild(phaseSection);

    phaseOptionDelete.addEventListener('click', function () {
        phaseSection.remove();
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
                await createPhase();
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

    const phaseBodyDesc = document.createElement('textarea');
    phaseBodyDesc.value = phaseBodyText.innerText;

    phaseBodyDetail.appendChild(phaseBodyDesc);

    phaseBody.appendChild(phaseBodyDetail);

    phaseOptionSubmit.replaceWith(phaseOptionSubmit.cloneNode(true));
    phaseOptionSubmit = phaseBody.querySelector('.Phase-Page-Right-Phase-Body-Options-Submit');

    phaseOptionSubmit.addEventListener('click', async () => {
        try {
            phaseBodyText = await submitFunction(phaseSection, phaseHead, phaseBody, phaseBodyDetail, phaseOptionSubmit, phaseHeadName, phaseTitle, phaseBodyDesc);
        } catch (error) {
            console.error(error);
        }
    });


}

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

