console.log("secure admin script loaded");

/* ----- DEFAULT RECIPES ----- */
const defaultRecipes = [
  {
    title: "Blueberry Pancakes",
    category: "breakfast",
    image: "images/pancakes.jpg",
    description: "Fluffy homemade pancakes loaded with fresh blueberries.",
    ingredients: ["1 cup flour","1 cup blueberries","1 egg","1 tbsp sugar","1 cup milk"],
    instructions: ["Mix dry ingredients.","Add egg & milk.","Fold in blueberries.","Cook on skillet until golden."]
  },
  {
    title: "Chicken Caesar Salad",
    category: "lunch",
    image: "images/salad.jpg",
    description: "Crisp romaine, grilled chicken, parmesan, and creamy dressing.",
    ingredients: ["Romaine lettuce","Grilled chicken","Parmesan","Croutons","Caesar dressing"],
    instructions: ["Chop lettuce.","Slice chicken.","Toss with dressing.","Top with cheese & croutons."]
  },
  {
    title: "Sample Pasta",
    category: "dinner",
    image: "https://via.placeholder.com/800x500?text=Recipe+Image",
    description: "A quick sample pasta for testing the modal.",
    ingredients: ["2 cups pasta","1 tbsp olive oil","Salt","Parmesan cheese"],
    instructions: ["Boil pasta until tender.","Drain and toss with olive oil.","Season with salt.","Top with parmesan and serve."]
  }
];

/* ----- STORED RECIPES ----- */
let customRecipes = JSON.parse(localStorage.getItem("customRecipes")) || [];

/* Combined recipes for viewing */
function getAllRecipes() {
  return [...defaultRecipes, ...customRecipes];
}

/* DOM */
const recipeGrid = document.getElementById("recipeGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

/* RENDER */
function renderRecipes() {
  const recipes = getAllRecipes();
  const searchTerm = (searchInput.value || "").toLowerCase();
  const selectedCategory = categoryFilter ? categoryFilter.value : "all";

  const filtered = recipes.filter(recipe => {
    const matchesSearch =
      (recipe.title || "").toLowerCase().includes(searchTerm) ||
      (recipe.description || "").toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || recipe.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  recipeGrid.innerHTML = filtered.map(recipe => `
    <div class="card" onclick='openRecipeModal(${JSON.stringify(recipe)})'>
      <img src="${recipe.image}" alt="${recipe.title}">
      <div class="card-content">
        <div class="card-title">${recipe.title}</div>
        <div class="card-category">${recipe.category}</div>
        <div class="card-desc">${recipe.description}</div>
      </div>
    </div>
  `).join("");
}

/* VIEWER */
function openRecipeModal(recipe) {
  const viewer = document.getElementById("recipeModal");
  viewer.style.display = "flex";
  viewer.setAttribute("aria-hidden","false");

  document.getElementById("modalTitle").textContent = recipe.title || "";
  document.getElementById("modalImage").src = recipe.image || "";
  document.getElementById("modalCategory").textContent = recipe.category || "";

  const ingList = document.getElementById("modalIngredients");
  ingList.innerHTML = "";
  (recipe.ingredients || []).forEach(i => {
    const li = document.createElement("li");
    li.textContent = i;
    ingList.appendChild(li);
  });

  const stepList = document.getElementById("modalInstructions");
  stepList.innerHTML = "";
  (recipe.instructions || []).forEach(step => {
    const li = document.createElement("li");
    li.textContent = step;
    stepList.appendChild(li);
  });
}

function closeRecipeModal() {
  const viewer = document.getElementById("recipeModal");
  viewer.style.display = "none";
  viewer.setAttribute("aria-hidden","true");
}

document.getElementById("closeViewerBtn").addEventListener("click", closeRecipeModal);
document.getElementById("recipeModal").addEventListener("click", (e) => {
  if (e.target.id === "recipeModal") closeRecipeModal();
});

/* ----- 🔐 ADMIN LOGIN SYSTEM ----- */

const passwordHash = "d7d824a2b0a4c32f175f0c7a826f7994a2bd06cdd1eacafc69a63c2cd58b3c77"; // SHA-256 of "pinkrecipes"

async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const adminPassword = document.getElementById("adminPassword");

let adminUnlocked = false;

/* Hold SHIFT + click the header to open login */
document.querySelector(".barbie-header").addEventListener("click", (e) => {
  if (e.shiftKey) loginModal.classList.remove("hidden");
});

loginBtn.onclick = async () => {
  const entered = adminPassword.value;
  const hashed = await sha256(entered);

  if (hashed === passwordHash) {
    adminUnlocked = true;
    loginModal.classList.add("hidden");
    addAdminButton();
  } else {
    loginError.style.display = "block";
  }
};

/* ----- ADD RECIPE MODAL ----- */
const addRecipeModal = document.getElementById("addRecipeModal");
const saveRecipeBtn = document.getElementById("saveRecipeBtn");

function addAdminButton() {
  const btn = document.createElement("button");
  btn.textContent = "Add Recipe";
  btn.style = "position:fixed;bottom:20px;right:20px;padding:14px 18px;background:#ff3ebf;color:white;border:none;border-radius:16px;font-size:18px;box-shadow:0 6px 18px rgba(0,0,0,0.18);cursor:pointer;z-index:900;";
  btn.onclick = () => addRecipeModal.classList.remove("hidden");
  document.body.appendChild(btn);
}

saveRecipeBtn.onclick = () => {
  const title = document.getElementById("newTitle").value.trim();
  const category = document.getElementById("newCategory").value;
  const image = document.getElementById("newImage").value.trim();
  const desc = document.getElementById("newDesc").value.trim();

  if (!title || !image || !desc) {
    alert("Please fill in all fields.");
    return;
  }

  customRecipes.push({
    title, category, image, description: desc,
    ingredients: ["No ingredients added"],
    instructions: ["No instructions added"]
  });

  localStorage.setItem("customRecipes", JSON.stringify(customRecipes));

  addRecipeModal.classList.add("hidden");
  renderRecipes();
};

/* SEARCH / FILTER */
if (searchInput) searchInput.addEventListener("input", renderRecipes);
if (categoryFilter) categoryFilter.addEventListener("change", renderRecipes);

/* INITIAL RENDER */
renderRecipes();
