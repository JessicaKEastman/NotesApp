const words = document.getElementById("words");
const chars = document.getElementById("chars");
const textarea = document.getElementById("text");

// textarea.addEventListener("input", function(ev) {
//     localStorage.setItem("text", ev.target.value);
//     update_counts(ev.target.value);
// });

textarea.addEventListener("input", function(ev) {
    update_counts(ev.target.value);
});

window.addEventListener("load", function(ev) {
    if (!currentFile) {
    preview.innerHTML = `
<h1>Welcome to NoteTaker</h1>

<p>
A local-first Markdown notebook for mathematics,
science, and research notes.
</p>

<hr>

<h2>Getting Started</h2>

<ol>
    <li>Click <strong>Open Notes Folder</strong>.</li>
    <li>Select or create a notes directory.</li>
    <li>Open an existing note or create a new one.</li>
</ol>

<h2>Supported Features</h2>

<ul>
    <li>Markdown preview</li>
    <li>MathJax equations</li>
    <li>Automatic saving</li>
    <li>PDF export</li>
    <li>Folder organisation</li>
</ul>
`;
    }
});

function update_counts(text) {
    chars.innerHTML = text.length;
    // words.innerHTML = text.split(' ').length;
    words.innerHTML = text.split(/\s/).filter(function(n) { return n != ''; }).length;
}

function debounce(fn, delay) {
    let timer;

    return (...args) => {
        clearTimeout(timer);

        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

textarea.addEventListener(
    "input",
    debounce(async () => {

        if (!currentFile)
            return;

        await saveNote(
            currentFile,
            textarea.value
        );

        console.log("Saved:", currentFile.name);

    }, 1000)
);


// const textarea = document.getElementById("text");
const preview = document.getElementById("preview");

// async function renderPreview() {
//     preview.textContent = textarea.value;

//     if (window.MathJax?.typesetPromise) {
//         await MathJax.typesetPromise([preview]);
//     }
// }

async function renderPreview() {

    preview.innerHTML = marked.parse(
        textarea.value
    );

    if (window.MathJax?.texReset) {
        MathJax.texReset();
        }

    if (window.MathJax?.typesetPromise) {
        await MathJax.typesetPromise([preview]);
    }
}

textarea.addEventListener("input", renderPreview);

renderPreview();


let notesRoot = null;
let selectedFileElement = null;
let currentFile = null;
let currentFolder = null;
const collapsedFolders = new Set();

document
    .getElementById("openFolder")
    .addEventListener("click", async () => {

        notesRoot = await window.showDirectoryPicker();
        localStorage.setItem("folderName", notesRoot.name);

        buildTree(notesRoot);
    });

document
    .getElementById("newNote")
    .addEventListener("click", async () => {

        if (!notesRoot) {
            alert("Open a notes folder first.");
            return;
        }

        const noteName = prompt("Enter note name:");

        if (!noteName)
            return;

        const targetFolder = currentFolder || notesRoot;

        const fileHandle =
            await targetFolder.getFileHandle(
                noteName + ".md",
                { create: true }
            );

        currentFile = fileHandle;

        textarea.value = "";

        await saveNote(fileHandle, "");

        await openNote(fileHandle);

        textarea.focus();

        localStorage.setItem(
    "selectedFile",
    (currentFolder ? currentFolder.name : "") +
    "/" +
    fileHandle.name
);

        document.getElementById("sidebar").innerHTML = "";

        await buildTree(notesRoot);
    });

    document
    .getElementById("newFolder")
    .addEventListener("click", async () => {

        if (!notesRoot) {
            alert("Open a notes folder first.");
            return;
        }

        const folderName = prompt("Enter folder name:");

        if (!folderName)
            return;

        const targetFolder = currentFolder || notesRoot;

        await targetFolder.getDirectoryHandle(
            folderName,
            { create: true }
        );

        document.getElementById("sidebar").innerHTML = "";

        await buildTree(notesRoot);

    });

    document
    .getElementById("exportPdf")
    .addEventListener("click", () => {

        window.print();

    });


async function buildTree(folderHandle, path = "", depth = 0) {

    for await (const entry of folderHandle.values()) {

        const fullPath = path + "/" + entry.name;

        if (entry.kind === "directory") {
            console.log("Adding folder:", entry.name);

            const div = document.createElement("div");

            const selectedFolder =
        localStorage.getItem("selectedFolder");

        if (fullPath === selectedFolder) {
            div.classList.add("selected-note");
            selectedFileElement = div;
        }


            // div.textContent = "📁 " + entry.name;
            div.textContent =
    (collapsedFolders.has(fullPath) ? "▶ " : "▼ ")
    + entry.name;
            div.style.fontWeight = "bold";
            div.style.paddingLeft = (depth * 20) + "px";

            div.style.cursor = "pointer";

            div.addEventListener("click", async () => {

    if (selectedFileElement) {
        selectedFileElement.classList.remove("selected-note");
    }

    div.classList.add("selected-note");
    selectedFileElement = div;

    currentFolder = entry;
    localStorage.setItem("selectedFolder", fullPath);

    localStorage.removeItem("selectedFile");

    if (collapsedFolders.has(fullPath)) {
        collapsedFolders.delete(fullPath);
    } else {
        collapsedFolders.add(fullPath);
    }

    document.getElementById("sidebar").innerHTML = "";

    await buildTree(notesRoot);

    console.log("Selected folder:", entry.name);
});
            sidebar.appendChild(div);

            if (!collapsedFolders.has(fullPath)) {
    await buildTree(entry, fullPath, depth + 1);
}

        } else {

            console.log("File:", fullPath);
            const sidebar = document.getElementById("sidebar");

            const div = document.createElement("div");
            div.style.paddingLeft = ((depth + 1) * 20) + "px";
            div.textContent = entry.name;
            console.log("fullPath =", fullPath);
            const selectedFile =
            localStorage.getItem("selectedFile", fullPath);
            console.log("selectedFile =", selectedFile);

            if (fullPath === selectedFile) {
                div.classList.add("selected-note");
                selectedFileElement = div;
            }
            
            div.style.cursor = "pointer";
            div.addEventListener("click", async () => {

                if (selectedFileElement) {
                    selectedFileElement.classList.remove("selected-note");
                }

                div.classList.add("selected-note");
                selectedFileElement = div;

                localStorage.setItem("selectedFile", fullPath);
                localStorage.removeItem("selectedFolder");
                console.log("saved:", fullPath);
                currentFolder = folderHandle;

                currentFile = entry;

                console.log(currentFile.name);

                await openNote(entry);
            });
            sidebar.appendChild(div);

        }
    }
}


async function openNote(fileHandle) {

    const file = await fileHandle.getFile();

    const content = await file.text();

    document.getElementById("text").value = content;
    update_counts(content);

    await renderPreview();
}



async function saveNote(fileHandle, content) {

    const writable =
        await fileHandle.createWritable();

    await writable.write(content);

    await writable.close();
}

const sidebar = document.getElementById("sidebar");
const resizer = document.getElementById("resizer");
const resizertext = document.getElementById("resizertext");


const savedWidth = localStorage.getItem("sidebarWidth");

if (savedWidth) {

sidebar.style.width = savedWidth + "px";

}

let isResizing = false;
let isResizingtext = false;


resizer.addEventListener("mousedown", () => {
    isResizing = true;
});
let startX;
let startWidth;

resizertext.addEventListener("mousedown", (e) => {

    isResizingtext = true;

    startX = e.clientX;

    startWidth = textarea.offsetWidth;
});


// document.addEventListener("mousemove", (e) => {
//     if (!isResizing)
//         return;

//     sidebar.style.width = e.clientX + "px";
// });

document.addEventListener("mouseup", () => {
    isResizing = false;
    isResizingtext = false;

});

// document.addEventListener("mousemove", (e) => {
//     if (!isResizing)
//         return;

//     const width = Math.max(150, e.clientX);

//     sidebar.style.width = width + "px";
//     localStorage.setItem("sidebarWidth", width);
//     if (isResizingtext) {

//     const width =
//         startWidth + (e.clientX - startX);

//     textarea.style.width =
//         Math.max(200, width) + "px";
// }
// });

document.addEventListener("mousemove", (e) => {

    if (isResizing) {

        const width = Math.max(150, e.clientX);

        sidebar.style.width = width + "px";

        localStorage.setItem("sidebarWidth", width);
    }

    if (isResizingtext) {

        const width =
            startWidth + (e.clientX - startX);

        const maxWidth =
    document.querySelector(".editor").offsetWidth - 200;

textarea.style.width =
    Math.max(
        200,
        Math.min(width, maxWidth)
    ) + "px";
    }

});


// textarea.addEventListener("input", debounce(
//     () => saveNote(currentFile, textarea.value),
//     1000
// ));


// const handle =
//     await folderHandle.getFileHandle(
//         "New Note.md",
//         { create: true }
//     );


// await notesRoot.getDirectoryHandle(
//     "Physics",
//     { create: true }
// );



// editor.addEventListener("keyup", async (e) => {

//     if (e.key !== "$")
//         return;

//     let text = editor.innerText;

//     let match = text.match(/\$([^$]+)\$/);

//     if (!match)
//         return;

//     const latex = match[1];

//     const span = document.createElement("span");

//     span.className = "math-token";
//     span.dataset.latex = latex;
//     span.innerHTML = `\\(${latex}\\)`;

//     editor.innerHTML =
//         text.replace(match[0], span.outerHTML);

//     await MathJax.typesetPromise([editor]);
// });



// async function renderMath() {

//     let html = editor.innerText.replace(
//         /\$([^$]+)\$/g,
//         (_, latex) =>
//             `<span class="math-inline">\\(${latex}\\)</span>`
//     );

//     editor.innerHTML = html;

//     await MathJax.typesetPromise([editor]);
// }
