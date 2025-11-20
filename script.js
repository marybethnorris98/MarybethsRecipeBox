// CLEANED script.js — Admin + Viewer + Drafts + Image Upload (base64)
// -------------------------------------------------------------------
console.log("CLEAN SCRIPT LOADED");

/* -------------------------------------------------
   GLOBAL STATE
------------------------------------------------- */
let recipes = [];
let drafts = [];
let isAdmin = false;
let editingRecipeIndex = null;
let uploadedImageBase64 = "";

// LocalStorage Keys
const RECIPES_KEY = "recipes_v1";
const DRAFTS_KEY = "drafts_v1";
const ADMIN_KEY = "isAdmin_v1";

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
    instructions: ["Mix ingredients", "Heat pan", "Pour batter", "Flip", "Serve warm"]
  }
];

/* -------------------------------------------------
   ELEMENT REFERENCES
------------------------------------------------- */
const recipeGrid = document.getElementById("recipeGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const addRecipeModal = document.getElementById("addRecipeModal");
const draftsModal = document.getElementById("draftsModal");
const adminBanner = document.getElementById("adminBanner");

/* Add/Save Input Fields */
const newTitle = document.getElementById("newTitle");
const newCategory = document.getElementById("newCategory");
const newDesc = document.getElementById("newDesc");
const newIngredients = document.getElementById("newIngredients");
const newSteps = document.getElementById("newSteps");
const imageUploadInput = document.getElementById("imageUploadInput");

/* Buttons */
const saveRecipeBtn = document.getElementById("saveRecipeBtn");
const closeAddModalBtn = document.getElementById("closeAddModalBtn");
const draftsBtn = document.getElementById("draftsBtn");
const closeDraftsBtn = document.getElementById("closeDraftsBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

/* -------------------------------------------------
   INIT
------------------------------------------------- */
function init() {
  recipes = JSON.parse(localStorage.getItem(RECIPES_KEY)) || defaultRecipes;
  drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [];
  isAdmin = JSON.parse(localStorage.getItem(ADMIN_KEY)) || false;

  adminBanner.style.display = isAdmin ? "block" : "none";
  renderRecipes();
}

/* -------------------------------------------------
   SAVE STATE
------------------------------------------------- */
function saveAll() {
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

/* -------------------------------------------------
   RENDER RECIPE CARDS
------------------------------------------------- */
function renderRecipes() {
  const term = (searchInput.value || "").toLowerCase();
  const selected = categoryFilter.value || "all";

  const filtered = recipes.filter(r => {
    if (!isAdmin && r.hidden) return false;
    const matchesTerm = r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term);
    const matchesCat = selected === "all" || r.category === selected;
    return matchesTerm && matchesCat;
  });

  recipeGrid.innerHTML = filtered.map((recipe, index) => `
    <div class="card">
      <img src="${recipe.image}" alt="${recipe.title}">
      <div class="card-content" onclick='openRecipeModal(${JSON.stringify(recipe)})'>
        <div class="card-title">${recipe.title}</div>
        <div class="card-category">${recipe.category}</div>
        <div class="card-desc">${recipe.description}</div>
      </div>

      ${isAdmin ? `
        <div class="admin-card-controls">
          <button onclick="editRecipe(${index}); event.stopPropagation();">Edit</button>
          <button onclick="deleteRecipe(${index}); event.stopPropagation();" class="danger">Delete</button>
          <button onclick="toggleHide(${index}); event.stopPropagation();" class="secondary">
            ${recipe.hidden ? "Unhide" : "Hide"}
          </button>
        </div>
      ` : ""}
    </div>
  `).join("");
}

/* -------------------------------------------------
   OPEN VIEWER MODAL
------------------------------------------------- */
function openRecipeModal(recipe) {
  const viewer = document.getElementById("recipeModal");
  viewer.style.display = "flex";
  viewer.setAttribute("aria-hidden", "false");

  document.getElementById("modalTitle").textContent = recipe.title;
  document.getElementById("modalImage").src = recipe.image;
  document.getElementById("modalCategory").textContent = recipe.category;

  const ingList = document.getElementById("modalIngredients");
  ingList.innerHTML = "";
  (recipe.ingredients || []).forEach(i => {
    const li = document.createElement("li");
    li.textContent = i;
    ingList.appendChild(li);
  });

  const stepList = document.getElementById("modalInstructions");
  stepList.innerHTML = "";
  (recipe.instructions || []).forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    stepList.appendChild(li);
  });

  // ADMIN CONTROLS
  const adminControls = document.getElementById("adminViewControls");
  const editBtn = document.getElementById("adminEditBtn");
  const deleteBtn = document.getElementById("adminDeleteBtn");
  const hideBtn = document.getElementById("adminHideBtn");

  const idx = recipes.findIndex(r => r.title === recipe.title && r.description === recipe.description);

  if (isAdmin && idx >= 0) {
    adminControls.classList.remove("hidden");

    editBtn.onclick = () => {
      editingRecipeIndex = idx;
      populateAddModalFromDraft(recipe);
      viewer.style.display = "none";
      addRecipeModal.classList.remove("hidden");
    };

    deleteBtn.onclick = () => {
      if (!confirm("Delete this recipe?")) return;
      recipes.splice(idx, 1);
      saveAll();
      renderRecipes();
      viewer.style.display = "none";
    };

    hideBtn.textContent = recipe.hidden ? "Unhide" : "Hide";
    hideBtn.onclick = () => {
      recipes[idx].hidden = !recipes[idx].hidden;
      saveAll();
      renderRecipes();
      hideBtn.textContent = recipes[idx].hidden ? "Unhide" : "Hide";
    };
  } else {
    adminControls.classList.add("hidden");
  }
}

/* -------------------------------------------------
   IMAGE UPLOAD (BASE64)
------------------------------------------------- */
imageUploadInput.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    uploadedImageBase64 = reader.result;
  };
  reader.readAsDataURL(file);
});

/* -------------------------------------------------
   SAVE RECIPE (NEW or EDIT)
------------------------------------------------- */
saveRecipeBtn.addEventListener("click", () => {
  const title = newTitle.value.trim();
  const category = newCategory.value;
  const description = newDesc.value.trim();
  const ingredients = newIngredients.value.split("\n").map(x => x.trim()).filter(x => x);
  const steps = newSteps.value.split("\n").map(x => x.trim()).filter(x => x);

  let image = uploadedImageBase64 || "";

  const recipe = { title, category, description, ingredients, instructions: steps, image, hidden: false };

  if (editingRecipeIndex !== null) {
    recipes[editingRecipeIndex] = recipe;
  } else {
    recipes.push(recipe);
  }

  saveAll();
  renderRecipes();
  closeAddModal();
});

function closeAddModal() {
  addRecipeModal.classList.add("hidden");
  uploadedImageBase64 = "";
  editingRecipeIndex = null;
  newTitle.value = "";
  newCategory.value = "breakfast";
  newDesc.value = "";
  newIngredients.value = "";
  newSteps.value = "";
  imageUploadInput.value = "";
}
closeAddModalBtn.onclick = closeAddModal;

/* -------------------------------------------------
   EDIT RECIPE
------------------------------------------------- */
function editRecipe(idx) {
  editingRecipeIndex = idx;
  populateAddModalFromDraft(recipes[idx]);
  addRecipeModal.classList.remove("hidden");
}

function populateAddModalFromDraft(r) {
  newTitle.value = r.title;
  newCategory.value = r.category;
  newDesc.value = r.description;
  newIngredients.value = (r.ingredients || []).join("\n");
  newSteps.value = (r.instructions || []).join("\n");
  uploadedImageBase64 = r.image || "";
}

/* -------------------------------------------------
   DELETE + HIDE
------------------------------------------------- */
function deleteRecipe(index) {
  if (!confirm("Delete this recipe?")) return;
  recipes.splice(index, 1);
  saveAll();
  renderRecipes();
}

function toggleHide(index) {
  recipes[index].hidden = !recipes[index].hidden;
  saveAll();
  renderRecipes();
}

/* -------------------------------------------------
   SEARCH + FILTER LISTENERS
------------------------------------------------- */
searchInput.addEventListener("input", renderRecipes);
categoryFilter.addEventListener("change", renderRecipes);

/* -------------------------------------------------
   DRAFT HANDLING
------------------------------------------------- */
draftsBtn.onclick = () => {
  listDrafts();
  draftsModal.classList.remove("hidden");
};
closeDraftsBtn.onclick = () => draftsModal.classList.add("hidden");

function listDrafts() {
  const list = document.getElementById("draftsList");
  list.innerHTML = drafts
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((d, i) => `
      <div class="draft-item">
        <span>${d.title}</span>
        <button onclick="loadDraft(${i})">Load</button>
        <button class="danger" onclick="deleteDraft(${i})">X</button>
      </div>
    `).join("");
}

function loadDraft(i) {
  populateAddModalFromDraft(drafts[i]);
  addRecipeModal.classList.remove("hidden");
  draftsModal.classList.add("hidden");
}
function deleteDraft(i) {
  drafts.splice(i, 1);
  saveAll();
  listDrafts();
}

/* -------------------------------------------------
   ADMIN LOGIN
------------------------------------------------- */
loginBtn.onclick = () => {
  const p = prompt("Enter admin password");
  if (p === "admin123") {
    isAdmin = true;
    localStorage.setItem(ADMIN_KEY, true);
    adminBanner.style.display = "block";
    renderRecipes();
  } else alert("Wrong password");
};
logoutBtn.onclick = () => {
  isAdmin = false;
  localStorage.setItem(ADMIN_KEY, false);
  adminBanner.style.display = "none";
  renderRecipes();
};

/* -------------------------------------------------
   START
------------------------------------------------- */
init();
