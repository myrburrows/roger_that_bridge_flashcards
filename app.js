document.addEventListener('DOMContentLoaded', () => {
    let currentFileData = [];
    let currentIndex = 0;

    // Load guidelines.txt by default on startup
    fetchFile('guidelines.txt');

    // Fetch the file content when the user selects a file
    document.getElementById('file-select').addEventListener('change', (event) => {
        const selectedFile = event.target.value;
        fetchFile(selectedFile);
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        if (currentFileData.length > 0) {
            currentIndex = (currentIndex + 1) % currentFileData.length;
            displayCurrentCard();
        }
    });

    document.getElementById('last-btn').addEventListener('click', () => {
        if (currentFileData.length > 0) {
            currentIndex = (currentIndex - 1 + currentFileData.length) % currentFileData.length;
            displayCurrentCard();
        }
    });

    document.getElementById('answer-btn').addEventListener('click', () => {
        if (currentFileData.length > 0) {
            displayAnswer();
        }
    });

    function fetchFile(fileName) {
        fetch(fileName)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error loading file: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                currentFileData = parseFileData(data);
                currentIndex = 0;
                displayCurrentCard(); // Display the first card
            })
            .catch(error => {
                console.error(error);
                clearFields();
            });
    }

    function parseFileData(data) {
        const lines = data.split('\n').filter(line => line.trim().length > 0);
        return lines.map((line, index) => {
            const fields = line.split('\t'); // Use tab delimiter
            return {
                lineNumber: index + 1,
                totalLines: lines.length,
                deck: fields[0] || '',
                title: fields[1] || '',
                question: fields[2] || '',
                answer: fields[3] || '',
                url: fields[4] || ''
            };
        });
    }

    function displayCurrentCard() {
        const currentCard = currentFileData[currentIndex];
        document.getElementById('deck').value = currentCard.deck;
        document.getElementById('title').value = currentCard.title;
        document.getElementById('question').value = `${currentCard.lineNumber}/${currentCard.totalLines}, ${currentCard.question}`;
        document.getElementById('answer').value = '';  // Hide answer initially
        document.getElementById('url').value = '';     // Hide URL initially
        autoExpand(document.getElementById('question'));
    }

    function displayAnswer() {
        const currentCard = currentFileData[currentIndex];
        document.getElementById('answer').value = currentCard.answer;
        const urlField = document.getElementById('url');
        urlField.value = currentCard.url;

        if (currentCard.url) {
            urlField.style.color = 'blue';
            urlField.onclick = () => window.open(currentCard.url, '_blank');
        } else {
            urlField.style.color = 'black';
            urlField.onclick = null;
        }
        autoExpand(document.getElementById('answer'));
    }

    function clearFields() {
        document.getElementById('deck').value = '';
        document.getElementById('title').value = '';
        document.getElementById('question').value = '';
        document.getElementById('answer').value = '';
        document.getElementById('url').value = '';
    }

    function autoExpand(field) {
        field.style.height = 'auto';
        field.style.height = field.scrollHeight + 'px';
    }

    // Automatically adjust textarea height when content is loaded
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', (event) => {
            autoExpand(event.target);
        });
    });
});
