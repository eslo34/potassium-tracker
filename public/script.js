const backendURL = "https://potassium-tracker.onrender.com"; // Use your actual Render URL

let totalPotassium = 0;
let totalSodium = 0;
let history = []; // Store history of added values for undo
let trackedFoods = []; // Store tracked food items

// Function to load stored values from local storage
function loadFromLocalStorage() {
    const savedPotassium = localStorage.getItem("totalPotassium");
    const savedSodium = localStorage.getItem("totalSodium");
    const savedFoods = localStorage.getItem("trackedFoods");

    if (savedPotassium !== null) totalPotassium = parseInt(savedPotassium);
    if (savedSodium !== null) totalSodium = parseInt(savedSodium);
    if (savedFoods !== null) trackedFoods = JSON.parse(savedFoods);

    updateUI();
}

// Function to save values to local storage
function saveToLocalStorage() {
    localStorage.setItem("totalPotassium", totalPotassium);
    localStorage.setItem("totalSodium", totalSodium);
    localStorage.setItem("trackedFoods", JSON.stringify(trackedFoods));
}

// Load saved values on page load
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addBtn").addEventListener("click", submitFood);
    loadFromLocalStorage(); // keep this line here
  });
  

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

    // Add to tracked foods list
    trackedFoods.push({ food: foodInput, potassium, sodium });

    // Save the new values to local storage
    saveToLocalStorage();

    // Update UI with accumulated values
    updateUI();

    // Show the full ChatGPT explanation in a pop-up
    showResponsePopup(data.fullResponse);

    // Clear input field
    document.getElementById("foodInput").value = "";
}

// Function to update the UI (used after any change)
function updateUI() {
    document.getElementById("potassiumDisplay").innerText = `${totalPotassium} mg`;
    document.getElementById("sodiumDisplay").innerText = `${totalSodium} mg`;

    // Update tracked food list
    const foodList = document.getElementById("intakeList");
    foodList.innerHTML = "";

    trackedFoods.forEach((item, index) => {
        const foodEntry = document.createElement("div");
        foodEntry.classList.add("food-entry");

        foodEntry.innerHTML = `
            <span>${item.food}: P-${item.potassium}, S-${item.sodium}</span>
            <button class="delete-btn" onclick="deleteFood(${index})">Delete</button>
        `;

        foodList.appendChild(foodEntry);
    });
}

// Function to delete a food entry
function deleteFood(index) {
    const item = trackedFoods[index];

    // Subtract values from the total
    totalPotassium -= item.potassium;
    totalSodium -= item.sodium;

    // Remove from tracked foods
    trackedFoods.splice(index, 1);

    // Save the updated values to local storage
    saveToLocalStorage();

    updateUI();
}

// Function to undo the last entry
function undoLastEntry() {
    if (history.length > 0) {
        const lastEntry = history.pop(); // Remove last entry from history
        totalPotassium -= lastEntry.potassium;
        totalSodium -= lastEntry.sodium;

        // Ensure values don't go below zero
        totalPotassium = Math.max(0, totalPotassium);
        totalSodium = Math.max(0, totalSodium);

        // Remove last added food
        trackedFoods.pop();

        // Save updated values
        saveToLocalStorage();

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
    trackedFoods = []; // Clear food list

    // Save reset values to local storage
    saveToLocalStorage();

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
