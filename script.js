console.log("FULL admin + viewer script loaded");

/* -------------------------------------------------
   DEFAULT RECIPES
------------------------------------------------- */
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

let recipes = defaultRecipes;

/* -------------------------------------------------
   DOM ELEMENTS
------------------------------------------------- */
const recipeGrid = document.getElementById("recipeGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

/* -------------------------------------------------
   RENDER RECIPE CARDS
------------------------------------------------- */
function renderRecipes() {
  const searchTerm = (searchInput.value || "").toLowerCase();
  const selectedCategory = categoryFilter ? categoryFilter.value : "all";

  const filtered = recipes.filter(recipe => {
    const matchesSearch =
      recipe.title.toLowerCase().includes(searchTerm) ||
      recipe.description.toLowerCase().includes(searchTerm);

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

/* -------------------------------------------------
   MODAL VIEWER
------------------------------------------------- */
function openRecipeModal(recipe) {
  const viewer = document.getElementById("recipeModal");
  viewer.style.display = "flex";
  viewer.setAttribute("aria-hidden","false");

  document.getElementById("modalTitle").textContent = recipe.title;
  document.getElementById("modalImage").src = recipe.image;
  document.getElementById("modalCategory").textContent = recipe.category;

  const ingList = document.getElementById("modalIngredients");
  ingList.innerHTML = "";
  recipe.ingredients.forEach(i => {
    const li = document.createElement("li");
    li.textContent = i;
    ingList.appendChild(li);
  });

  const stepList = document.getElementById("modalInstructions");
  stepList.innerHTML = "";
  recipe.instructions.forEach(step => {
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

/* -------------------------------------------------
   SEARCH + FILTER
------------------------------------------------- */
if (searchInput) searchInput.addEventListener("input", renderRecipes);
if (categoryFilter) categoryFilter.addEventListener("change", renderRecipes);

/* -------------------------------------------------
   🔐 HIDDEN ADMIN SYSTEM
------------------------------------------------- */

const ADMIN_PASSWORD_HASH = "pinkrecipes".split("").reverse().join(""); // super simple obfuscation

function openLoginModal() {
  document.getElementById("loginModal").classList.remove("hidden");
}

function closeLoginModal() {
  document.getElementById("loginModal").classList.add("hidden");
}

function openAddRecipeModal() {
  document.getElementById("addRecipeModal").classList.remove("hidden");
}

document.getElementById("loginBtn").addEventListener("click", () => {
  const entered = document.getElementById("adminPassword").value;
  const error = document.getElementById("loginError");

  if (entered.split("").reverse().join("") === ADMIN_PASSWORD_HASH) {
    error.style.display = "none";
    closeLoginModal();
    openAddRecipeModal();
  } else {
    error.style.display = "block";
  }
});

/* -------------------------------------------------
   NEW: KEYBOARD SECRET
   Press CTRL + ALT + A to open admin login
------------------------------------------------- */
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "a") {
    openLoginModal();
  }
});

/* -------------------------------------------------
   SAVE NEW RECIPE
------------------------------------------------- */
document.getElementById("saveRecipeBtn").addEventListener("click", () => {
  const newRecipe = {
    title: document.getElementById("newTitle").value,
    category: document.getElementById("newCategory").value,
    image: document.getElementById("newImage").value,
    description: document.getElementById("newDesc").value,
    ingredients: ["(No ingredients yet — we will add full editor later)"],
    instructions: ["(No instructions yet — full editor coming next)"]
  };

  recipes.push(newRecipe);
  renderRecipes();
  alert("Recipe added!");
  document.getElementById("addRecipeModal").classList.add("hidden");
});

/* -------------------------------------------------
   INITIAL RENDER
------------------------------------------------- */
renderRecipes();
