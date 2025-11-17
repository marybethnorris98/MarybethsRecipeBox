console.log("script.js loaded");

/* DEFAULT RECIPES */
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

let recipes = JSON.parse(localStorage.getItem("recipes")) || defaultRecipes;

/* DOM */
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

/* RENDER */
function renderRecipes() {
  const searchTerm = (searchInput.value || "").toLowerCase();
  const selectedCategory = categoryFilter ? categoryFilter.value : "all";

  const filtered = recipes.filter(recipe => {
    const matchesSearch =
      (recipe.title || "").toLowerCase().includes(searchTerm) ||
      (recipe.description || "").toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
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

/* ADD-RECIPE MODAL */
addRecipeBtn.onclick = () => modal.classList.remove("hidden");
closeModalBtn.onclick = () => modal.classList.add("hidden");

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
    description: descVal,
    ingredients: ["No ingredients added"],
    instructions: ["No instructions added"]
  };
  recipes.push(newRecipe);
  localStorage.setItem("recipes", JSON.stringify(recipes));

  newTitle.value = ""; newImage.value = ""; newDesc.value = "";
  modal.classList.add("hidden");
  renderRecipes();
};

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
  (recipe.instructions || recipe.steps || []).forEach(step => {
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

/* Close viewer button + overlay click to close */
document.getElementById("closeViewerBtn").addEventListener("click", closeRecipeModal);
document.getElementById("recipeModal").addEventListener("click", (e) => {
  if (e.target.id === "recipeModal") closeRecipeModal();
});

/* SEARCH + FILTER */
if (searchInput) searchInput.addEventListener("input", renderRecipes);
if (categoryFilter) categoryFilter.addEventListener("change", renderRecipes);

/* INITIAL RENDER */
renderRecipes();
