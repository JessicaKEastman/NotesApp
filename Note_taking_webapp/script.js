const words = document.getElementById("words");
const chars = document.getElementById("chars");
const textarea = document.getElementById("text");

textarea.addEventListener("input", function(ev) {
    localStorage.setItem("text", ev.target.value);
    update_counts(ev.target.value);
});

window.addEventListener("load", function(ev) {
    var text = localStorage.getItem("text");
    textarea.value = text;
    update_counts(text);
});

function update_counts(text) {
    chars.innerHTML = text.length;
    // words.innerHTML = text.split(' ').length;
    words.innerHTML = text.split(/\s/).filter(function(n) { return n != ''; }).length;
}


// const textarea = document.getElementById("text");
const preview = document.getElementById("preview");

async function renderPreview() {
    preview.textContent = textarea.value;

    if (window.MathJax?.typesetPromise) {
        await MathJax.typesetPromise([preview]);
    }
}

textarea.addEventListener("input", renderPreview);

renderPreview();




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
