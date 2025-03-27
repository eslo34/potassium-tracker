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
    document.getElementById("undoBtn").addEventListener("click", undoLastEntry);
    document.getElementById("clearBtn").addEventListener("click", clearAll);
    loadFromLocalStorage(); // keep this line here
  });
  

  async function submitFood() {
    const foodInput = document.getElementById("foodInput").value;
    const addBtn = document.getElementById("addBtn");

    if (!foodInput) {
        alert("Please enter a food item!");
        return;
    }

    // Show spinner
    addBtn.disabled = true;
    addBtn.innerHTML = `Add <span id="loadingSpinner"></span>`;

    try {
        const response = await fetch(`${backendURL}/analyze-food`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ food: foodInput })
        });

        const data = await response.json();

        const potassium = parseInt(data.potassium) || 0;
        const sodium = parseInt(data.sodium) || 0;

        history.push({ potassium, sodium });
        totalPotassium += potassium;
        totalSodium += sodium;
        trackedFoods.push({ food: foodInput, potassium, sodium });

        saveToLocalStorage();
        updateUI();
        showResponsePopup(data.fullResponse);
        document.getElementById("foodInput").value = "";

    } catch (error) {
        console.error("Error analyzing food:", error);
        alert("Something went wrong. Try again!");
    } finally {
        // Hide spinner
        addBtn.disabled = false;
        addBtn.innerHTML = "Add";
    }
}


// Function to update the UI (used after any change)
function updateUI() {
    document.getElementById("potassiumDisplay").innerText = `Potassium: ${totalPotassium} mg`;
    document.getElementById("sodiumDisplay").innerText = `Sodium: ${totalSodium} mg`;


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
            <h3>Nutrition Breakdown</h3>
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

// Cookie popup logic
document.addEventListener("DOMContentLoaded", () => {
    const cookiePopup = document.getElementById("cookiePopup");
    const accepted = localStorage.getItem("cookiesAccepted");
  
    if (!accepted) {
      cookiePopup.classList.remove("hidden");
    }
});
  
function acceptCookies() {
    localStorage.setItem("cookiesAccepted", "true");
    document.getElementById("cookiePopup").classList.add("hidden");
}

// Cookie Modal Logic
document.addEventListener("DOMContentLoaded", () => {
    const cookieModal = document.getElementById("cookieSettingsModal");
    const cookieLink = document.getElementById("cookieSettingsLink");
    const acceptBtn = document.getElementById("acceptCookies");
    const closeBtn = document.getElementById("closeCookieModal");
  
    const COOKIE_KEY = "cookieConsent";
  
    if (!localStorage.getItem(COOKIE_KEY)) {
      cookieModal.classList.remove("hidden");
    }
  
    acceptBtn.addEventListener("click", () => {
      localStorage.setItem(COOKIE_KEY, "accepted");
      cookieModal.classList.add("hidden");
    });
  
    closeBtn.addEventListener("click", () => {
      cookieModal.classList.add("hidden");
    });
  
    cookieLink.addEventListener("click", (e) => {
      e.preventDefault();
      cookieModal.classList.remove("hidden");
    });
});



document.addEventListener("DOMContentLoaded", () => {
    // === Water Tracker: JavaScript ===

    // Constants and Selectors
    const waterTrackerContainer = document.getElementById("water-tracker");
    const waterGoalSelect = document.getElementById("waterGoal");
    const waterCirclesContainer = document.getElementById("waterCircles");
    const clearWaterBtn = document.getElementById("clearWaterBtn");


    // Load or initialize
    let waterGoal = parseFloat(localStorage.getItem("waterGoal")) || 2.0;
    let waterProgress = parseInt(localStorage.getItem("waterProgress")) || 0;

    waterGoalSelect.value = waterGoal.toFixed(1);
    renderWaterCircles();

    // Event Listeners
    waterGoalSelect.addEventListener("change", () => {
    waterGoal = parseFloat(waterGoalSelect.value);
    localStorage.setItem("waterGoal", waterGoal);
    waterProgress = 0;
    localStorage.setItem("waterProgress", waterProgress);
    renderWaterCircles();
    });

    clearWaterBtn.addEventListener("click", () => {
    waterProgress = 0;
    localStorage.setItem("waterProgress", waterProgress);
    renderWaterCircles();
    });

    function handleWaterClick(index) {
    if (index === waterProgress) {
        waterProgress++;
    } else if (index === waterProgress - 1) {
        waterProgress--;
    }
    localStorage.setItem("waterProgress", waterProgress);
    renderWaterCircles();
    }

    function renderWaterCircles() {
    waterCirclesContainer.innerHTML = "";
    const totalCircles = waterGoal / 0.5;
    for (let i = 0; i < totalCircles; i++) {
        const circle = document.createElement("div");
        circle.classList.add("water-circle");
        circle.innerText = "0.5L";
        if (i < waterProgress) {
        circle.classList.add("filled");
        }
        circle.addEventListener("click", () => handleWaterClick(i));
        waterCirclesContainer.appendChild(circle);
    }
    }

});