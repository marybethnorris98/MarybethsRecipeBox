/* -------------------------------------------
   DEFAULT RECIPES
------------------------------------------- */
const defaultRecipes = [
  {
    title: "Blueberry Pancakes",
    category: "breakfast",
    image: "images/pancakes.jpg",
    description: "Fluffy homemade pancakes loaded with fresh blueberries.",
    ingredients: [
      "1 cup flour",
      "1 cup blueberries",
      "1 egg",
      "1 tbsp sugar",
      "1 cup milk"
    ],
    instructions: [
      "Mix dry ingredients.",
      "Add egg & milk.",
      "Fold in blueberries.",
      "Cook on skillet until golden."
    ]
  },
  {
    title: "Chicken Caesar Salad",
    category: "lunch",
    image: "images/salad.jpg",
    description: "Crisp romaine, grilled chicken, parmesan, and creamy dressing.",
    ingredients: [
      "Romaine lettuce",
      "Grilled chicken",
      "Parmesan",
      "Croutons",
      "Caesar dressing"
    ],
    instructions: [
      "Chop lettuce.",
      "Slice chicken.",
      "Toss with dressing.",
      "Top with cheese & croutons."
    ]
  }
];

let recipes = JSON.parse(localStorage.getItem("recipes")) || defaultRecipes;

/* -------------------------------------------
   DOM ELEMENTS
------------------------------------------- */
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

/* -------------------------------------------
   RENDER RECIPE GRID
------------------------------------------- */
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

  recipeGrid.innerHTML = filtered
    .map(
      recipe => `
    <div class="card" onclick='openRecipeModal(${JSON.stringify(recipe)})'>
      <img src="${recipe.image}" alt="${recipe.title}">
      <div class="card-content">
        <div class="card-title">${recipe.title}</div>
        <div class="card-category">${recipe.category}</div>
        <div class="card-desc">${recipe.description}</div>
      </div>
    </div>`
    )
    .join("");
}

/* -------------------------------------------
   ADD NEW RECIPE MODAL
------------------------------------------- */
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

  newTitle.value = "";
  newImage.value = "";
  newDesc.value = "";

  modal.classList.add("hidden");
  renderRecipes();
};

/* -------------------------------------------
   VIEW RECIPE MODAL
------------------------------------------- */
function openRecipeModal(recipe) {
  const viewer = document.getElementById("recipeModal");
  viewer.style.display = "flex";

  document.getElementById("modalTitle").textContent = recipe.title;
  document.getElementById("modalImage").src = recipe.image;
  document.getElementById("modalCategory").textContent = recipe.category;

  // Ingredients
  const ingList = document.getElementById("modalIngredients");
  ingList.innerHTML = "";
  (recipe.ingredients || []).forEach(i => {
    const li = document.createElement("li");
    li.textContent = i;
    ingList.appendChild(li);
  });

  // Instructions
  const stepList = document.getElementById("modalInstructions");
  stepList.innerHTML = "";
  (recipe.instructions || []).forEach(step => {
    const li = document.createElement("li");
    li.textContent = step;
    stepList.appendChild(li);
  });
}

function closeRecipeModal() {
  document.getElementById("recipeModal").style.display = "none";
}

/* -------------------------------------------
   SEARCH + FILTER LISTENERS
------------------------------------------- */
searchInput.addEventListener("input", renderRecipes);
categoryFilter.addEventListener("change", renderRecipes);

/* -------------------------------------------
   INITIAL RENDER
------------------------------------------- */
renderRecipes();
