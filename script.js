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

// --- ADMIN MODE CHECK ---
function checkAdminMode() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.has("admin")) {
    const entered = prompt("Enter admin password:");
    if (entered === "pinkrecipes") {
      addRecipeBtn.classList.remove("hidden");
      alert("Admin mode unlocked ✨");
    }
  }
}
checkAdminMode();

// --- RENDER RECIPES ---
function renderRecipes() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = recipes.filter(recipe => {
    const matchesSearch =
      recipe.title.toLowerCase().includes(searchTerm) ||
      recipe.description.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || recipe.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  recipeGrid.innerHTML = filtered.map(recipe => `
    <div class="card">
      <img src="${recipe.image}" alt="${recipe.title}">
      <div class="card-content">
        <div class="card-title">${recipe.title}</div>
        <div class="card-category">${recipe.category}</div>
        <div class="card-desc">${recipe.description}</div>
      </div>
    </div>
  `).join("");
}

// --- OPEN / CLOSE ADD RECIPE MODAL ---
addRecipeBtn.onclick = () => modal.classList.remove("hidden");
closeModalBtn.onclick = () => modal.classList.add("hidden");

// --- SAVE NEW RECIPE ---
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

  // Reset form
  newTitle.value = "";
  newImage.value = "";
  newDesc.value = "";

  modal.classList.add("hidden");
  renderRecipes();
};

// --- SEARCH + FILTER EVENTS ---
searchInput.addEventListener("input", renderRecipes);
categoryFilter.addEventListener("change", renderRecipes);

// --- INITIAL RENDER ---
renderRecipes();
</script>
