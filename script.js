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
    ingredients: ["1 cup flour", "1 cup blueberries", "1 egg", "1 tbsp sugar", "1 cup milk"],
    instructions: ["Mix ingredients", "Pour batter", "Cook until golden"]
  },
  {
    title: "Avocado Toast",
    category: "breakfast",
    image: "images/avo.jpg",
    description: "Classic avocado toast with chili flakes.",
    ingredients: ["2 slices bread", "1 avocado", "Salt", "Chili flakes"],
    instructions: ["Toast bread", "Mash avocado", "Spread and season"]
  }
];

/* -------------------------------------------------
   STORAGE
------------------------------------------------- */
function loadRecipes() {
  const stored = localStorage.getItem("recipes");
  return stored ? JSON.parse(stored) : defaultRecipes;
}

function saveRecipes(recipes) {
  localStorage.setItem("recipes", JSON.stringify(recipes));
}

let recipes = loadRecipes();

/* -------------------------------------------------
   ELEMENTS
------------------------------------------------- */
const recipeGrid = document.getElementById("recipeGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const recipeModal = document.getElementById("recipeModal");
const closeViewerBtn = document.getElementById("closeViewerBtn");
const modalTitle = document.getElementById("modalTitle");
const modalImage = document.getElementById("modalImage");
const modalCategory = document.getElementById("modalCategory");
const modalIngredients = document.getElementById("modalIngredients");
const modalInstructions = document.getElementById("modalInstructions");

/* ADMIN MODALS */
const loginModal = document.getElementById("loginModal");
const adminPassword = document.getElementById("adminPassword");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const addRecipeModal = document.getElementById("addRecipeModal");
const newTitle = document.getElementById("newTitle");
const newCategory = document.getElementById("newCategory");
const newImage = document.getElementById("newImage");
const newDesc = document.getElementById("newDesc");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const ingredientsList = document.getElementById("ingredientsList");
const addInstructionBtn = document.getElementById("addInstructionBtn");
const instructionsList = document.getElementById("instructionsList");
const saveRecipeBtn = document.getElementById("saveRecipeBtn");

const editingIndex = document.getElementById("editingIndex");

/* -------------------------------------------------
   RENDERING
------------------------------------------------- */
function renderRecipes() {
  recipeGrid.innerHTML = "";

  const search = searchInput.value.toLowerCase();
  const filter = categoryFilter.value;

  recipes.forEach((recipe, index) => {
    if (
      (filter === "all" || recipe.category === filter) &&
      recipe.title.toLowerCase().includes(search)
    ) {
      const card = document.createElement("div");
      card.className = "recipe-card";

      card.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}">
        <h3>${recipe.title}</h3>
        <p>${recipe.description}</p>
      `;

      card.addEventListener("click", () => openRecipe(index));
      recipeGrid.appendChild(card);
    }
  });
}

renderRecipes();

/* -------------------------------------------------
   VIEW RECIPE
------------------------------------------------- */
function openRecipe(index) {
  const r = recipes[index];
  modalTitle.textContent = r.title;
  modalImage.src = r.image;
  modalCategory.textContent = r.category;

  modalIngredients.innerHTML = "";
  modalInstructions.innerHTML = "";

  r.ingredients.forEach(i => {
    const li = document.createElement("li");
    li.textContent = i;
    modalIngredients.appendChild(li);
  });

  r.instructions.forEach(step => {
    const li = document.createElement("li");
    li.textContent = step;
    modalInstructions.appendChild(li);
  });

  recipeModal.style.display = "flex";
}

/* CLOSE VIEWER */
closeViewerBtn.addEventListener("click", () => {
  recipeModal.style.display = "none";
});

/* -------------------------------------------------
   ADMIN LOGIN
------------------------------------------------- */
function openLoginModal() {
  loginModal.classList.remove("hidden");
  adminPassword.value = "";
  loginError.style.display = "none";
  adminPassword.focus();
}

function closeLoginModal() {
  loginModal.classList.add("hidden");
}

loginBtn.addEventListener("click", () => {
  if (adminPassword.value === "1234") {
    closeLoginModal();
    openAddRecipeModal();
  } else {
    loginError.style.display = "block";
  }
});

/* -------------------------------------------------
   ADD/EDIT RECIPE MODAL
------------------------------------------------- */
function openAddRecipeModal() {
  addRecipeModal.classList.remove("hidden");
  resetAddForm();
}

function closeAddRecipeModal() {
  addRecipeModal.classList.add("hidden");
}

function resetAddForm() {
  editingIndex.value = "";
  newTitle.value = "";
  newCategory.value = "breakfast";
  newImage.value = "";
  newDesc.value = "";
  ingredientsList.innerHTML = "";
  instructionsList.innerHTML = "";
}

/* ADD INGREDIENT */
addIngredientBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.placeholder = "Ingredient";
  input.className = "ingredient-input";
  ingredientsList.appendChild(input);
});

/* ADD INSTRUCTION */
addInstructionBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.placeholder = "Step";
  input.className = "instruction-input";
  instructionsList.appendChild(input);
});

/* SAVE RECIPE */
saveRecipeBtn.addEventListener("click", () => {
  const title = newTitle.value.trim();
  const category = newCategory.value;
  const image = newImage.value.trim();
  const description = newDesc.value.trim();

  const ingredients = [...ingredientsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
  const instructions = [...instructionsList.querySelectorAll("input")].map(s => s.value.trim()).filter(Boolean);

  if (!title || !image || !ingredients.length || !instructions.length) {
    alert("Please fill all fields!");
    return;
  }

  const recipe = { title, category, image, description, ingredients, instructions };

  if (editingIndex.value) {
    recipes[editingIndex.value] = recipe;
  } else {
    recipes.push(recipe);
  }

  saveRecipes(recipes);
  renderRecipes();
  closeAddRecipeModal();
});

/* -------------------------------------------------
   SEARCH + FILTER
------------------------------------------------- */
searchInput.addEventListener("input", renderRecipes);
categoryFilter.addEventListener("change", renderRecipes);

/* -------------------------------------------------
   KEYBOARD SHORTCUT (Ctrl+Shift+A or Cmd+Shift+A)
------------------------------------------------- */
document.addEventListener("keydown", (e) => {
  const isA = e.key.toLowerCase() === "a";
  const combo1 = e.ctrlKey && e.shiftKey && isA;
  const combo2 = e.metaKey && e.shiftKey && isA;

  if (combo1 || combo2) {
    e.preventDefault();
    openLoginModal();
  }
});
