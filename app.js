document.addEventListener('DOMContentLoaded', () => {
    let currentFileData = [];
    let currentIndex = 0;
    let userId = null; // Store the logged-in user's ID
    let serverAvailable = false; // Keep track of server availability

    // Immediately check if the server is available before proceeding
    checkServerAvailability();

    // Initialize the flashcard app and load the first set of flashcards
    function initializeApp() {
        fetchFile('guidelines.txt');
    }

    // Function to check if the server is running
    function checkServerAvailability() {
        fetch('http://localhost:3000/status', { method: 'GET' })
            .then(response => {
                if (response.ok) {
                    console.log('Server is running.');
                    serverAvailable = true;
                    loginUser(); // If the server is available, prompt for username
                } else {
                    console.warn('Server is not available. Running in offline mode.');
                    runOfflineMode(); // Run the app without the server
                }
            })
            .catch(error => {
                console.error('Server check failed. Running in offline mode.', error);
                runOfflineMode(); // Run the app without the server
            });
    }

    // Simulate user login (only if the server is running)
    function loginUser() {
        userId = prompt('Enter your user ID:');
        
        if (userId) {
            fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.userId) {
                    console.log(data.message); // "User {userId} logged in"
                    initializeApp();  // Load flashcards and display the first card
                } else {
                    console.error('Login failed');
                    runOfflineMode();  // Fallback to offline mode
                }
            })
            .catch(error => {
                console.error('Login failed. Running in offline mode.', error);
                runOfflineMode();  // Fallback to offline mode
            });
        } else {
            runOfflineMode(); // Run the app without login if user cancels prompt
        }
    }

    // Run the app in offline mode (no server interactions)
    function runOfflineMode() {
        console.log("Running in offline mode.");
        initializeApp(); // Load flashcards even without server interactions
    }

    // Fetch the file content (flashcards)
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

    // Parse the file data into flashcards
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
                urlShort: fields[4] || '',  // URL short text
                url: fields[5] || ''  // Actual URL
            };
        });
    }

    // Display the current flashcard
    function displayCurrentCard() {
        if (currentFileData.length === 0) {
            console.error("No flashcards loaded.");
            return;
        }

        const currentCard = currentFileData[currentIndex];
        document.getElementById('deck').value = currentCard.deck;
        document.getElementById('title').value = currentCard.title;
        document.getElementById('question').value = `${currentCard.lineNumber}/${currentCard.totalLines}, ${currentCard.question}`;
        document.getElementById('answer').value = '';  // Hide answer initially
        document.getElementById('url').value = '';     // Hide URL initially
        autoExpand(document.getElementById('question'));
    }

    // Display the answer for the current flashcard
    function displayAnswer() {
        const currentCard = currentFileData[currentIndex];
        document.getElementById('answer').value = currentCard.answer;
        const urlField = document.getElementById('url');

        if (currentCard.url && currentCard.urlShort) {
            urlField.value = currentCard.urlShort;  // Display URLshort as text
            urlField.style.color = 'blue';
            urlField.style.cursor = 'pointer';
            urlField.onclick = () => window.open(currentCard.url, '_blank');  // Open full URL when clicked
        } else {
            urlField.value = '';  // Clear the field if there’s no URL or URLshort
            urlField.style.color = 'black';
            urlField.onclick = null;
        }
        autoExpand(document.getElementById('answer'));
    }

    // Record a user action (only if server is available)
    function recordAction(actionType, actionValue = null) {
        if (!userId || !serverAvailable) {
            console.warn('Skipping action recording. Server is not available.');
            return;
        }

        fetch('http://localhost:3000/recordAction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, actionType, actionValue }),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message); // Action recorded successfully
        })
        .catch(error => {
            console.error('Error recording action.', error);
        });
    }

    // Clear the fields on the page
    function clearFields() {
        document.getElementById('deck').value = '';
        document.getElementById('title').value = '';
        document.getElementById('question').value = '';
        document.getElementById('answer').value = '';
        document.getElementById('url').value = '';
    }

    // Automatically expand text areas based on content
    function autoExpand(field) {
        field.style.height = 'auto';
        field.style.height = field.scrollHeight + 'px';
    }

    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', (event) => {
            autoExpand(event.target);
        });
    });

    // Hook up button events
    document.getElementById('next-btn').addEventListener('click', () => {
        if (currentFileData.length > 0) {
            currentIndex = (currentIndex + 1) % currentFileData.length;
            displayCurrentCard();

            if (serverAvailable) {
                recordAction('next_click');
            }
        }
    });

    document.getElementById('last-btn').addEventListener('click', () => {
        if (currentFileData.length > 0) {
            currentIndex = (currentIndex - 1 + currentFileData.length) % currentFileData.length;
            displayCurrentCard();

            if (serverAvailable) {
                recordAction('back_click');
            }
        }
    });

    document.getElementById('answer-btn').addEventListener('click', () => {
        if (currentFileData.length > 0) {
            displayAnswer();

            if (serverAvailable) {
                recordAction('answer_click');
            }
        }
    });

    document.getElementById('file-select').addEventListener('change', (event) => {
        const selectedFile = event.target.value;
        fetchFile(selectedFile);

        if (serverAvailable) {
            recordAction('dropdown_select', selectedFile);
        }
    });
});
