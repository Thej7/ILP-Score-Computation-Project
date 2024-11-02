import { db, ref, set, get, remove} from './firebaseConfig.mjs';

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
        if(moduleBody.style.display === 'none') {
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
        await deleteFirebaseData(moduleHeadName.innerText)
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
        moduleBody.appendChild(moduleTitle);

        moduleBodyDetail.innerHTML = '';

        const moduleBodyDesc = document.createElement('textarea');
        moduleBodyDesc.placeholder = 'Enter a module Description';

        moduleBodyDetail.appendChild(moduleBodyDesc)
    })
}