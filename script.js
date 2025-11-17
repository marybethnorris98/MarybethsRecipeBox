<script>
// --- DEFAULT RECIPES ---
const defaultRecipes = [
  {
    title: "Blueberry Pancakes",
    category: "breakfast",
    image: "images/pancakes.jpg",
    description: "Fluffy homemade pancakes loaded with fresh blueberries."
  },
  {
    title: "Chicken Caesar Salad",
    category: "lunch",
    image: "images/salad.jpg",
    description: "Crisp romaine, grilled chicken, parmesan, and creamy dressing."
  },
  {
    title: "Spaghetti Bolognese",
    category: "dinner",
    image: "images/spaghetti.jpg",
    description: "Rich tomato-meat sauce served over al dente pasta."
  },
  {
    title: "Chocolate Cake",
    category: "dessert",
    image: "images/cake.jpg",
    description: "Moist chocolate layers with smooth chocolate frosting."
  }
];

let recipes = JSON.parse(localStorage.getItem("recipes")) || defaultRecipes;

// --- DOM ELEMENTS ---
const recipeGrid = document.getElementById("recipeGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const modal = document.getElementById("modal");
const addRecipeBtn = document.getElementById("addRecipeBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveRecipeBtn = document.getElementById("saveRecipeBtn");

const newTitle = document.getElementById("newTitle");
const newCategory = document.getElementById("newCategory");
const newImage = document.getElementById("newImage");
const newDesc = document.getElementById("newDesc");

// ----------------------
// ADMIN MODE CHECK
// ----------------------
function checkAdminMode() {
  const urlParams = new URLSearchParams(window.location.search);

  // Always hide the add button at first
  addRecipeBtn.classList.add("hidden");

  if (urlParams.has("admin")) {
    const entered = prompt("Enter admin password:");
    if (entered === "pinkrecipes") {
      addRecipeBtn.classList.remove("hidden");
      alert("Admin mode unlocked ✨");
    }
  }
}
checkAdminMode();

// ----------------------
// RENDER RECIPE CARDS
// ----------------------
function renderRecipes() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = recipes.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm) ||
      r.description.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || r.category === selectedCategory;

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

// ----------------------
// OPEN RECIPE MODAL
// ----------------------
function openRecipeModal(recipe) {
  document.getElementById("recipeModal").style.display = "flex";

  document.getElementById("modalTitle").textContent = recipe.title;
  document.getElementById("modalImage").src = recipe.image;
  document.getElementById("modalCategory").textContent = recipe.category;

  // Ingredients & instructions not used yet:
  document.getElementById("modalIngredients").innerHTML = `
    <li>${recipe.description}</li>
  `;

  document.getElementById("modalInstructions").innerHTML = `
    <li>Full instructions coming soon...</li>
  `;
}

function closeRecipeModal() {
  document.getElementById("recipeModal").style.display = "none";
}

// ----------------------
// ADD NEW RECIPE
// ----------------------
saveRecipeBtn.onclick = () => {
  const titleVal = newTitle.value.trim();
  const categoryVal = newCategory.value;
  const imageVal = newImage.value.trim();
  const descVal = newDesc.value.trim();

  if (!titleVal || !imageVal || !descVal) {
    alert("Please fill in all fields.");
    return;
  }

  const newRecipe = {
    title: titleVal,
    category: categoryVal,
    image: imageVal,
    description: descVal
  };

  recipes.push(newRecipe);
  localStorage.setItem("recipes", JSON.stringify(recipes));

  newTitle.value = "";
  newImage.value = "";
  newDesc.value = "";

  modal.classList.add("hidden");
  renderRecipes();
};

// ----------------------
// EVENTS
// ----------------------
searchInput.addEventListener("input", renderRecipes);
categoryFilter.addEventListener("change", renderRecipes);

// ----------------------
// INITIAL LOAD
// ----------------------
renderRecipes();

</script>
