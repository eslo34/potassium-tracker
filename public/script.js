const backendURL = "http://localhost:3000"; // Update if hosted elsewhere

let totalPotassium = 0;
let totalSodium = 0;
let history = []; // Store history of added values for undo

async function submitFood() {
    const foodInput = document.getElementById("foodInput").value;

    if (!foodInput) {
        alert("Please enter a food item!");
        return;
    }

    // Send the food input to the backend
    const response = await fetch(`${backendURL}/analyze-food`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ food: foodInput })
    });

    const data = await response.json();

    // Ensure data contains numbers
    const potassium = parseInt(data.potassium) || 0;
    const sodium = parseInt(data.sodium) || 0;

    // Store the current addition in history for undo
    history.push({ potassium, sodium });

    // Add to total values
    totalPotassium += potassium;
    totalSodium += sodium;

    // Update UI with accumulated values
    updateUI();

    // Show the full ChatGPT explanation in a pop-up
    showResponsePopup(data.fullResponse);

    // Clear input field
    document.getElementById("foodInput").value = "";
}

// Function to update the UI (used after any change)
function updateUI() {
    document.getElementById("potassiumCount").innerText = `${totalPotassium} mg`;
    document.getElementById("sodiumCount").innerText = `${totalSodium} mg`;
}

// Function to undo the last addition
function undoLastEntry() {
    if (history.length > 0) {
        const lastEntry = history.pop(); // Remove last entry from history
        totalPotassium -= lastEntry.potassium;
        totalSodium -= lastEntry.sodium;

        // Ensure values don't go below zero
        totalPotassium = Math.max(0, totalPotassium);
        totalSodium = Math.max(0, totalSodium);

        updateUI();
    } else {
        alert("No history to undo!");
    }
}

// Function to reset everything to zero
function clearAll() {
    totalPotassium = 0;
    totalSodium = 0;
    history = []; // Clear history
    updateUI();
}

// Function to display the full ChatGPT explanation in a pop-up
function showResponsePopup(responseText) {
    const popup = document.createElement("div");
    popup.classList.add("popup");
    
    popup.innerHTML = `
        <div class="popup-content">
            <h3>ChatGPT Explanation</h3>
            <p>${responseText}</p>
            <button onclick="closePopup()">Close</button>
        </div>
    `;
    
    document.body.appendChild(popup);
}

// Function to close the pop-up
function closePopup() {
    document.querySelector(".popup").remove();
}
