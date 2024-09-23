let currentLine = 0;
let guidelines = [];

// Fetch and parse guidelines.txt
fetch('guidelines.txt')
    .then(response => response.text())
    .then(data => {
        guidelines = data.trim().split('\n').map(line => line.split('\t'));
        // Display total number of lines next to Deck label
        document.getElementById('totalLines').textContent = `Total: ${guidelines.length} lines`;
    })
    .catch(err => console.error('Error loading guidelines:', err));

// Handle the "Next" button click
document.getElementById('nextBtn').addEventListener('click', function() {
    // Loop back to the first line after the last line
    if (currentLine >= guidelines.length) {
        currentLine = 0;
    }

    // Populate Deck, Title, and Question fields
    document.getElementById('deck').textContent = guidelines[currentLine][0];
    document.getElementById('title').textContent = guidelines[currentLine][1];
    document.getElementById('question').textContent = `(${currentLine + 1}) ${guidelines[currentLine][2]}`;
    document.getElementById('answer').textContent = ''; // Clear the answer box
    currentLine++;
});

// Handle the "Answer" button click
document.getElementById('answerBtn').addEventListener('click', function() {
    if (currentLine > 0) {
        // Display the answer for the current line (previous Next click)
        document.getElementById('answer').textContent = guidelines[currentLine - 1][3];
    }
});
