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

        moduleBodyDetail.appendChild(moduleBodyDesc);

        moduleOptionSubmit.addEventListener('click', async () => {
            try {
                const moduleBodyText = await submitFunction(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName, moduleTitle, moduleBodyDesc);
                console.log("well" + moduleBodyText);
                await writeFirebaseData(moduleTitle.value, moduleBodyDesc.value);
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

    const moduleBodyDesc = document.createElement('textarea');
    moduleBodyDesc.value = moduleBodyText;

    moduleBodyDiv.appendChild(moduleBodyDesc);
    moduleBodyDetail.appendChild(moduleBodyDiv);


    moduleBody.appendChild(moduleBodyDetail);

    moduleptionSubmit.replaceWith(moduleOptionSubmit.cloneNode(true));
    moduleOptionSubmit = moduleBody.querySelector('.Module-Page-Right-Module-Body-Options-Submit');

    ModuleOptionSubmit.addEventListener('click', async () => {
        try {
            moduleBodyText = await submitFunction(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName, moduleTitle, moduleBodyDesc, oldHeadName);
        } catch (error) {
            console.error(error);
        }
    });
}

function submitFunction(moduleSection, moduleHead, moduleBody, moduleBodyDetail, moduleOptionSubmit, moduleHeadName, moduleTitle, moduleBodyDesc, oldHeadName) {
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
        console.log(moduleDesc);
        moduleBodyDetail.appendChild(moduleBodyText);
        moduleTitle.remove();
        moduleBody.style.display = 'none';
        moduleHead.style.display = 'flex';

        await deleteModule(oldHeadName);
        await writeFirebaseData(moduleName, moduleDesc)

        resolve(moduleDesc);
    });
}

async function loadFirebaseData() {
    const moduleData = await readFirebaseData();

    if (moduleData != null) {
        const workspace = document.getElementsByClassName('Module-Page-Right')[0];

        moduleData.forEach((module) => {

            const moduleection = document.createElement('div');
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

            moduleBodyDetail.appendChild(moduleBodyDesc);

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

async function writeFirebaseData(moduleName, moduleDesc) {
    try {
        const dbRef = ref(db, `Modules/${moduleName}`);
        await set(dbRef, {
            Desc: moduleDesc,
            Name: moduleName
        });
        console.log(`Module "${moduleName}" successfully written to the database`);
    } catch (error) {
        console.error("Error writing Module data:", error);
    }
}

async function readFirebaseData() {
    try {
        const dbRef = ref(db, `Module`);
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

async function deleteModule(moduleName) {
    try {
        const moduleRef = ref(db, `Module/${moduleName}`);
        await remove(moduleRef); // Delete the specified module
        console.log(`Module '${moduleName}' deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting module '${moduleName}':`, error);
    }
}


document.addEventListener('DOMContentLoaded', async function () {
    await loadFirebaseData();
    await createModule();
});

