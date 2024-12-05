document.addEventListener('DOMContentLoaded', () => {
    let currentFileData = [];
    let currentIndex = 0;
    let missedQuestions = [];
    let isReviewMode = false;
    let reviewIndex = 0;

    // Hardcoded list of flashcard file names without extensions
    const files = ['Guidelines','NoTrump Bids','Major Suit Bids','Minor Suit Bids','2plus Openings','Artificial Bids','Defensive Bidding','Declarer Play','Defensive Play'];

    // Initialize the flashcard app and load the first set of flashcards
    initializeApp();

    function initializeApp() {
        populateDropdown();
        fetchFile('guidelines.txt');
    }

    function populateDropdown() {
        const dropdown = document.getElementById('file-select');
        dropdown.innerHTML = '';

        files.forEach(file => {
            const option = document.createElement('option');
            option.value = `${file.toLowerCase()}.txt`;
            option.text = file;
            dropdown.add(option);
        });

        dropdown.addEventListener('change', (event) => {
            fetchFile(event.target.value);
        });
    }

    function fetchFile(fileName) {
        fetch(`data/${fileName}`)
            .then(response => {
                if (!response.ok) throw new Error(`Error loading file: ${response.statusText}`);
                return response.text();
            })
            .then(data => {
                currentFileData = parseFileData(data);
                currentIndex = 0;
                missedQuestions = [];
                isReviewMode = false;
                reviewIndex = 0;
                updateButtonVisibility();
                displayCurrentCard();
            })
            .catch(error => {
                console.error('Error loading file:', error);
                clearFields();
            });
    }

    function parseFileData(data) {
        const lines = data.split('\n').filter(line => line.trim().length > 0);
        return lines.map((line, index) => {
            const fields = line.split('\t');
            return {
                lineNumber: index + 1,
                totalLines: lines.length,
                deck: fields[0] || '',
                title: fields[1] || '',
                question: fields[2] || '',
                answer: fields[3] || '',
                urlShort: fields[4] || '',
                url: fields[5] || '',
            };
        });
    }

    function displayCurrentCard() {
        if (currentFileData.length === 0) return;

        const currentCard = currentFileData[currentIndex];
        document.getElementById('deck').value = currentCard.deck;
        document.getElementById('title').value = currentCard.title;
        document.getElementById('question').value = `${currentCard.lineNumber}/${currentCard.totalLines}, ${currentCard.question}`;
        document.getElementById('answer').value = '';
        document.getElementById('url').value = '';
        autoExpand(document.getElementById('question'));
    }

    function displayAnswer() {
        const currentCard = isReviewMode ? missedQuestions[reviewIndex] : currentFileData[currentIndex];
        document.getElementById('answer').value = currentCard.answer;

        const urlField = document.getElementById('url');
        if (currentCard.url && currentCard.urlShort) {
            urlField.value = currentCard.urlShort;
            urlField.style.cursor = 'pointer';
            urlField.onclick = () => window.open(currentCard.url, '_blank');
        } else {
            urlField.value = '';
            urlField.onclick = null;
        }
        autoExpand(document.getElementById('answer'));
    }

    function nextQuestion() {
        if (isReviewMode) {
            reviewIndex++;
            if (reviewIndex >= missedQuestions.length) {
                endReviewMode();
                return;
            }
            displayReviewCard();
        } else {
            currentIndex++;
            if (currentIndex >= currentFileData.length) {
                startReviewMode();
                return;
            }
            displayCurrentCard();
        }
    }

    function lastQuestion() {
        if (!isReviewMode && currentIndex > 0) {
            currentIndex--;
            displayCurrentCard();
        }
    }

    function recordMissedQuestion() {
        if (!isReviewMode) missedQuestions.push(currentFileData[currentIndex]);
        nextQuestion();
    }

    function startReviewMode() {
        isReviewMode = true;
        reviewIndex = 0;
        updateButtonVisibility();
        displayReviewCard();
    }

    function displayReviewCard() {
        if (reviewIndex >= missedQuestions.length) {
            endReviewMode();
            return;
        }

        const currentCard = missedQuestions[reviewIndex];
        document.getElementById('deck').value = currentCard.deck;
        document.getElementById('title').value = currentCard.title;
        document.getElementById('question').value = `${currentCard.lineNumber}/${currentCard.totalLines}, ${currentCard.question}`;
        document.getElementById('answer').value = '';
        document.getElementById('url').value = '';
        autoExpand(document.getElementById('question'));
    }

    function endReviewMode() {
        isReviewMode = false;
        document.querySelector('.flashcard-buttons').style.display = 'none';
        const flashcardDiv = document.querySelector('.flashcard-fields');
        const summaryMessage = document.createElement('div');
        summaryMessage.textContent = `Exercise Done! You had ${missedQuestions.length} review questions.`;
        summaryMessage.style.fontSize = '1.2em';
        summaryMessage.style.marginTop = '20px';
        flashcardDiv.appendChild(summaryMessage);
    }

    function updateButtonVisibility() {
        const knewItButton = document.getElementById('knew-it-btn');
        const missedItButton = document.getElementById('missed-it-btn');
        const lastButton = document.getElementById('last-btn');
        const nextButton = document.getElementById('next-btn');

        if (isReviewMode) {
            knewItButton.style.display = 'none';
            missedItButton.style.display = 'none';
            lastButton.style.display = 'none';
            nextButton.style.display = 'block';
            nextButton.style.backgroundColor = '#4CAF50'; // Ensure visible green color
            nextButton.style.color = 'white';
        } else {
            knewItButton.style.display = 'block';
            missedItButton.style.display = 'block';
            lastButton.style.display = 'block';
            nextButton.style.display = 'none';
        }
    }

    function autoExpand(field) {
        field.style.height = 'auto';
        field.style.height = `${field.scrollHeight}px`;
    }

    function clearFields() {
        document.getElementById('deck').value = '';
        document.getElementById('title').value = '';
        document.getElementById('question').value = '';
        document.getElementById('answer').value = '';
        document.getElementById('url').value = '';
    }

    document.getElementById('last-btn').addEventListener('click', lastQuestion);
    document.getElementById('knew-it-btn').addEventListener('click', nextQuestion);
    document.getElementById('missed-it-btn').addEventListener('click', recordMissedQuestion);
    document.getElementById('next-btn').addEventListener('click', nextQuestion); // Ensure Next button works in review mode
    document.getElementById('answer').addEventListener('click', displayAnswer);
});
