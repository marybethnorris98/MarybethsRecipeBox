/* script.js — Admin + Drafts + Image Upload (base64) */
console.log("FULL admin + viewer script loaded (with image upload)");

// -----------------------------
// DEFAULT RECIPES
// -----------------------------
const defaultRecipes = [
  {
    title: "Blueberry Pancakes",
    category: "breakfast",
    image: "", // left blank so preview will fallback if missing
    description: "Fluffy homemade pancakes loaded with fresh blueberries.",
    ingredients: ["1 cup flour","1 cup blueberries","1 egg","1 tbsp sugar","1 cup milk"],
    instructions: ["Mix dry ingredients.","Add egg & milk.","Fold in blueberries.","Cook on skillet until golden."]
  },
  {
    title: "Chicken Caesar Salad",
    category: "lunch",
    image: "",
    description: "Crisp romaine, grilled chicken, parmesan, and creamy dressing.",
    ingredients: ["Romaine lettuce","Grilled chicken","Parmesan","Croutons","Caesar dressing"],
    instructions: ["Chop lettuce.","Slice chicken.","Toss with dressing.","Top with cheese & croutons."]
  },
  {
    title: "Sample Pasta",
    category: "dinner",
    image: "",
    description: "A quick sample pasta for testing the modal.",
    ingredients: ["2 cups pasta","1 tbsp olive oil","Salt","Parmesan cheese"],
    instructions: ["Boil pasta until tender.","Drain and toss with olive oil.","Season with salt.","Top with parmesan and serve."]
  }
];

// -----------------------------
// STORAGE KEYS + LOAD
// -----------------------------
const RECIPES_KEY = "recipes";
const DRAFTS_KEY = "drafts_recipes";

let recipes = JSON.parse(localStorage.getItem(RECIPES_KEY)) || defaultRecipes;
let drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [];

// -----------------------------
// DOM ELEMENTS
// -----------------------------
const recipeGrid = document.getElementById("recipeGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

// Add-recipe modal fields (already in your HTML)
const addRecipeModal = document.getElementById("addRecipeModal");
const newTitle = document.getElementById("newTitle");
const newCategory = document.getElementById("newCategory");
const newImageInputFallback = document.getElementById("newImage"); // kept but not required
const newDesc = document.getElementById("newDesc");

const ingredientsList = document.getElementById("ingredientsList");
const instructionsList = document.getElementById("instructionsList");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const addInstructionBtn = document.getElementById("addInstructionBtn");

const saveRecipeBtn = document.getElementById("saveRecipeBtn");

const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

let isAdmin = false;
let editingDraftId = null;

// -----------------------------
// IMAGE UPLOAD (injected at top of modal)
// -----------------------------
let uploadedImageBase64 = ""; // when set, used as recipe.image

function injectImageUploadUI() {
  // Only inject once
  if (document.getElementById("imageUploadSection")) return;

  const modalContent = addRecipeModal.querySelector(".modal-content");
  if (!modalContent) return;

  // container
  const wrapper = document.createElement("div");
  wrapper.id = "imageUploadSection";
  wrapper.style = "margin-bottom:12px;display:flex;flex-direction:column;gap:8px;";

  // label
  const label = document.createElement("label");
  label.textContent = "Recipe Image";
  label.style = "font-weight:700;color:#a00064;";

  // file input (hidden style can be changed by CSS)
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.id = "imageInput";
  fileInput.style = "display:block;";

  // preview image element
  const preview = document.createElement("img");
  preview.id = "imagePreview";
  preview.style = "display:none;width:100%;max-height:200px;object-fit:cover;border-radius:12px;border:1px solid #ffb6e8;";

  // small helper text
  const hint = document.createElement("div");
  hint.textContent = "Choose an image from your computer. It will be stored locally in your browser.";
  hint.style = "font-size:13px;color:#8b5873;";

  // append
  wrapper.appendChild(label);
  wrapper.appendChild(fileInput);
  wrapper.appendChild(preview);
  wrapper.appendChild(hint);

  // insert at top of modal-content (before existing children)
  modalContent.insertBefore(wrapper, modalContent.firstChild);

  // handlers
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleImageFile(file);
  });

  // clicking label should open file chooser (accessible)
  label.addEventListener("click", () => fileInput.click());
}

function handleImageFile(file) {
  if (!file) return;
  // limit file size to prevent huge localStorage bloat (soft limit 2.5MB)
  const maxBytes = 2.5 * 1024 * 1024; // 2.5 MB
  if (file.size > maxBytes) {
    alert("Image is too large. Please choose an image under ~2.5 MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    uploadedImageBase64 = e.target.result; // data:image/...;base64,...
    const preview = document.getElementById("imagePreview");
    if (preview) {
      preview.src = uploadedImageBase64;
      preview.style.display = "block";
    }
  };
  reader.readAsDataURL(file);
}

function clearImagePreview() {
  uploadedImageBase64 = "";
  const preview = document.getElementById("imagePreview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }
}

// -----------------------------
// RENDER RECIPE CARDS
// -----------------------------
function renderRecipes() {
  const searchTerm = (searchInput.value || "").toLowerCase();
  const selectedCategory = categoryFilter ? categoryFilter.value : "all";

  const filtered = recipes.filter(recipe => {
    const matchesSearch =
      (recipe.title || "").toLowerCase().includes(searchTerm) ||
      (recipe.description || "").toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || recipe.category === selectedCategory;

      // 👇 NEW — hide drafts unless admin
  const isVisible = !recipe.draft || isAdmin;

  return matchesSearch && matchesCategory && isVisible;
   
  });

 recipeGrid.innerHTML = filtered.map(recipe => `
  <div class="card">

    <!-- IMAGE + TEXT (CLICKABLE FOR VIEWING) -->
    <div class="card-main" onclick='openRecipeModal(${JSON.stringify(recipe)})'>
      <img src="${recipe.image || ''}" alt="${recipe.title}"
        onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22120%22><rect width=%22200%22 height=%22120%22 fill=%22%23ffeef8%22/><text x=%2210%22 y=%2268%22 font-size=%2214%22 fill=%22%23d04f8a%22>no+image</text></svg>'">

      <div class="card-content">
        <div class="card-title">${recipe.title}</div>
        <div class="card-category">${recipe.category}</div>
        <div class="card-desc">${recipe.description}</div>
      </div>
    </div>

    <!-- 🔐 ADMIN BUTTONS (Only appear after login) -->
    <div class="admin-buttons ${isAdmin ? "" : "hidden"}">
      <button class="edit-btn" onclick='editRecipe("${recipe.id}")'>Edit</button>
      <button class="delete-btn" onclick='deleteRecipe("${recipe.id}")'>Delete</button>
      <button class="hide-btn" onclick='moveToDrafts("${recipe.id}")'>Move to Drafts</button>
    </div>

  </div>
`).join("");

}

// -----------------------------
// VIEWER
// -----------------------------
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

document.getElementById("closeViewerBtn").addEventListener("click", () => {
  document.getElementById("recipeModal").style.display = "none";
});

// -----------------------------
// SEARCH + FILTER
// -----------------------------
if (searchInput) searchInput.addEventListener("input", renderRecipes);
if (categoryFilter) categoryFilter.addEventListener("change", renderRecipes);

// -----------------------------
// ADMIN LOGIN
// -----------------------------
const ADMIN_PASSWORD_HASH = "pinkrecipes".split("").reverse().join("");

function openLoginModal() {
  loginError.style.display = "none";
  loginModal.classList.remove("hidden");
}

function closeLoginModal() {
  loginModal.classList.add("hidden");
}

loginBtn.addEventListener("click", () => {
  const entered = document.getElementById("adminPassword").value || "";
  if (entered.split("").reverse().join("") === ADMIN_PASSWORD_HASH) {
    isAdmin = true;
    closeLoginModal();
    injectAdminUI();
  } else {
    loginError.style.display = "block";
  }
});

// keyboard secret: CTRL+ALT+A
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "a") {
    openLoginModal();
  }
});

// -----------------------------
// ADMIN UI
// -----------------------------
function injectAdminUI() {
  if (document.getElementById("adminControlsContainer")) return;

  const container = document.createElement("div");
  container.id = "adminControlsContainer";
  container.style = "position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:1200;";

  const addBtn = document.createElement("button");
  addBtn.id = "adminAddBtn";
  addBtn.textContent = "+ Add Recipe";
  addBtn.style = "background:#ff3ebf;color:white;padding:12px 16px;border-radius:14px;border:none;font-size:16px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.15);";
  addBtn.addEventListener("click", () => {
    editingDraftId = null;
    openAddRecipeModal();
    populateAddModalFromDraft(null);
  });

  const draftsBtn = document.createElement("button");
  draftsBtn.id = "adminDraftsBtn";
  draftsBtn.textContent = "Drafts";
  draftsBtn.style = "background:#ffd6ee;color:#a00064;padding:10px 16px;border-radius:12px;border:2px solid #ffb1db;font-size:14px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.12);";
  draftsBtn.addEventListener("click", () => openDraftsModal());

  container.appendChild(addBtn);
  container.appendChild(draftsBtn);
  document.body.appendChild(container);
}

// -----------------------------
// ADD-RECIPE HELPERS (rows, clear, populate)
// -----------------------------
function makeRowInput(placeholder = "", type = "ingredient") {
  const row = document.createElement("div");
  row.className = "admin-row";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.value = "";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.title = "Remove";
  removeBtn.style = "margin-left:8px;background:transparent;border:none;color:#ff3ebf;font-weight:700;font-size:18px;cursor:pointer;";
  removeBtn.textContent = "✖";
  removeBtn.addEventListener("click", () => row.remove());

  row.appendChild(input);
  row.appendChild(removeBtn);
  return row;
}

function clearAddModal() {
  newTitle.value = "";
  newCategory.value = "breakfast";
  // we keep fallback input value for compatibility
  if (newImageInputFallback) newImageInputFallback.value = "";
  newDesc.value = "";

  ingredientsList.innerHTML = "";
  instructionsList.innerHTML = "";

  clearImagePreview();

  editingDraftId = null;
}

function populateAddModalFromDraft(draft) {
  clearAddModal();
  if (!draft) return;

  newTitle.value = draft.title || "";
  newCategory.value = draft.category || "breakfast";
  newDesc.value = draft.description || "";

  // If draft has image (base64 or URL), show it
  uploadedImageBase64 = draft.image || "";
  const preview = document.getElementById("imagePreview");
  if (uploadedImageBase64 && preview) {
    preview.src = uploadedImageBase64;
    preview.style.display = "block";
  }

  (draft.ingredients || []).forEach(ing => {
    const r = makeRowInput("Ingredient", "ingredient");
    r.querySelector("input").value = ing;
    ingredientsList.appendChild(r);
  });

  (draft.instructions || []).forEach(step => {
    const r = makeRowInput("Step", "step");
    r.querySelector("input").value = step;
    instructionsList.appendChild(r);
  });

  // set editing id
  editingDraftId = draft.id || null;
}

// ensure big close X and Save Draft btn are present
function ensureAddModalControls() {
  injectImageUploadUI();

  const modalContent = addRecipeModal.querySelector(".modal-content");
  if (!modalContent) return;

  // big X close button
  if (!modalContent.querySelector(".add-modal-close-x")) {
    const x = document.createElement("button");
    x.className = "add-modal-close-x";
    x.type = "button";
    x.innerText = "✖";
    x.title = "Close and discard";
    x.style = "position:absolute;right:18px;top:14px;background:transparent;border:none;font-size:22px;cursor:pointer;color:#a00;";
    x.addEventListener("click", () => {
      if (confirm("Discard changes and close?")) {
        clearAddModal();
        addRecipeModal.classList.add("hidden");
      }
    });
    modalContent.style.position = modalContent.style.position || "relative";
    modalContent.appendChild(x);
  }

  // Save Draft button
  if (!modalContent.querySelector("#saveDraftBtn")) {
    const saveDraftBtn = document.createElement("button");
    saveDraftBtn.id = "saveDraftBtn";
    saveDraftBtn.type = "button";
    saveDraftBtn.innerText = "Save Draft";
    saveDraftBtn.style = "background:#ffb6dd;color:#6a003a;padding:10px;border-radius:12px;border:none;margin-top:12px;cursor:pointer;width:100%;";
    saveDraftBtn.addEventListener("click", () => saveDraftFromModal());

    const saveBtn = modalContent.querySelector("#saveRecipeBtn");
    if (saveBtn) {
      saveBtn.parentNode.insertBefore(saveDraftBtn, saveBtn);
    } else {
      modalContent.appendChild(saveDraftBtn);
    }
  }
}

// attach add/remove behaviors for rows
addIngredientBtn.addEventListener("click", () => {
  ingredientsList.appendChild(makeRowInput("Ingredient", "ingredient"));
});
addInstructionBtn.addEventListener("click", () => {
  instructionsList.appendChild(makeRowInput("Step", "step"));
});

// -----------------------------
// SAVE RECIPE
// -----------------------------
// SAVE RECIPE (CREATE or EDIT)
// -----------------------------
saveRecipeBtn.addEventListener("click", () => {
  const title = (newTitle.value || "").trim();
  const category = newCategory.value || "breakfast";
  const description = (newDesc.value || "").trim();

  // use uploaded base64 first, fallback URL second
  let image =
    uploadedImageBase64 ||
    (newImageInputFallback ? newImageInputFallback.value.trim() : "");

  if (!title || !image || !description) {
    alert("Please fill in title, image (upload or provide URL) and description.");
    return;
  }

  const ingredients = [...ingredientsList.querySelectorAll("input")]
    .map(i => i.value.trim())
    .filter(Boolean);

  const instructions = [...instructionsList.querySelectorAll("input")]
    .map(i => i.value.trim())
    .filter(Boolean);

  // 🔥 IF EDITING an existing recipe
  if (window.editingId) {
    const recipe = recipes.find(r => r.id === window.editingId);

    if (recipe) {
      recipe.title = title;
      recipe.category = category;
      recipe.image = image;
      recipe.description = description;
      recipe.ingredients = ingredients;
      recipe.instructions = instructions;
    }

    window.editingId = null; // exit edit mode
  }

  // ➕ OTHERWISE CREATE NEW RECIPE
  else {
    const newRecipe = {
      id: Date.now().toString(),
      title,
      category,
      image,
      description,
      ingredients,
      instructions,
      draft: false
    };

    recipes.push(newRecipe);
  }

  // If this was a draft being converted, remove it
  if (editingDraftId) {
    drafts = drafts.filter(d => d.id !== editingDraftId);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    editingDraftId = null;
  }

  // Save all recipes
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));

  alert("Recipe saved!");

  // Clear + close modal
  clearAddModal();
  addRecipeModal.classList.add("hidden");

  // Reload UI
  renderRecipes();

  // Reset uploaded image
  uploadedImageBase64 = null;
});


// -----------------------------
// DRAFTS: create, save, list, delete
// -----------------------------
function buildDraftFromModal() {
  const title = (newTitle.value || "").trim();
  const category = newCategory.value || "breakfast";
  const description = (newDesc.value || "").trim();
  const ingredients = [...ingredientsList.querySelectorAll("input")]
    .map(i => i.value.trim()).filter(Boolean);
  const instructions = [...instructionsList.querySelectorAll("input")]
    .map(i => i.value.trim()).filter(Boolean);

  return {
    id: editingDraftId || ("draft_" + Date.now()),
    title: title || "Untitled Draft",
    category,
    image: uploadedImageBase64 || "", // store base64 if present
    description,
    ingredients,
    instructions
  };
}

function saveDraftFromModal() {
  const draft = buildDraftFromModal();
  const existsIndex = drafts.findIndex(d => d.id === draft.id);
  if (existsIndex >= 0) drafts[existsIndex] = draft;
  else drafts.push(draft);

  drafts.sort((a,b) => (a.title || "").localeCompare(b.title || ""));
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  alert("Draft saved.");
  editingDraftId = draft.id;
}

// -----------------------------
// DRAFTS MODAL (injected)
// -----------------------------
function openDraftsModal() {
  let draftsModal = document.getElementById("draftsModal");
  if (!draftsModal) {
    draftsModal = document.createElement("div");
    draftsModal.id = "draftsModal";
    draftsModal.className = "modal";
    draftsModal.style.zIndex = 1300;
    draftsModal.innerHTML = `
      <div class="modal-content" style="max-width:520px;position:relative;">
        <button id="closeDraftsBtn" style="position:absolute;right:18px;top:12px;border:none;background:none;font-size:22px;cursor:pointer;">✖</button>
        <h2 style="margin-top:0;">My Drafts</h2>
        <div id="draftsList" style="display:flex;flex-direction:column;gap:10px;margin-top:12px;"></div>
      </div>
    `;
    document.body.appendChild(draftsModal);

    document.getElementById("closeDraftsBtn").addEventListener("click", () => {
      draftsModal.classList.add("hidden");
    });

    draftsModal.addEventListener("click", (e) => {
      if (e.target === draftsModal) draftsModal.classList.add("hidden");
    });
  }

  const listContainer = draftsModal.querySelector("#draftsList");
  listContainer.innerHTML = "";

  drafts.sort((a,b) => (a.title || "").localeCompare(b.title || ""));

  if (drafts.length === 0) {
    const p = document.createElement("div");
    p.textContent = "No drafts yet.";
    p.style = "color:#666;padding:12px;";
    listContainer.appendChild(p);
  } else {
    drafts.forEach(d => {
      const row = document.createElement("div");
      row.style = "display:flex;align-items:center;justify-content:space-between;padding:8px;border-radius:10px;border:1px solid #ffe7f5;background:#fff9fc;";
      const title = document.createElement("div");
      title.textContent = d.title || "Untitled Draft";
      title.style = "font-weight:600;color:#a00064;";

      const actions = document.createElement("div");
      actions.style = "display:flex;gap:8px;";

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.style = "background:#ff3ebf;color:white;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;";
      editBtn.addEventListener("click", () => {
        editingDraftId = d.id;
        populateAddModalFromDraft(d);
        openAddRecipeModal();
        draftsModal.classList.add("hidden");
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style = "background:transparent;color:#b20050;border:2px solid #ffd1e8;padding:6px 10px;border-radius:8px;cursor:pointer;";
      deleteBtn.addEventListener("click", () => {
        if (!confirm(`Delete draft "${d.title}"?`)) return;
        drafts = drafts.filter(x => x.id !== d.id);
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
        openDraftsModal();
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      row.appendChild(title);
      row.appendChild(actions);

      listContainer.appendChild(row);
    });
  }

  draftsModal.classList.remove("hidden");
}

// -----------------------------
// OPEN / CLOSE ADD MODAL HELPERS
// -----------------------------
function openAddRecipeModal() {
  ensureAddModalControls(); // inject controls + image UI + Save Draft + X
  addRecipeModal.classList.remove("hidden");

  if (editingDraftId) {
    const d = drafts.find(x => x.id === editingDraftId);
    if (d) populateAddModalFromDraft(d);
  }
}

function ensureAddModalControls() {
  injectImageUploadUI();

  const modalContent = addRecipeModal.querySelector(".modal-content");
  if (!modalContent) return;

  // big X close button
  if (!modalContent.querySelector(".add-modal-close-x")) {
    const x = document.createElement("button");
    x.className = "add-modal-close-x";
    x.type = "button";
    x.innerText = "✖";
    x.title = "Close and discard";
    x.style = "position:absolute;right:18px;top:14px;background:transparent;border:none;font-size:22px;cursor:pointer;color:#a00;";
    x.addEventListener("click", () => {
      if (confirm("Discard changes and close?")) {
        clearAddModal();
        addRecipeModal.classList.add("hidden");
      }
    });
    modalContent.style.position = modalContent.style.position || "relative";
    modalContent.appendChild(x);
  }

  // Save Draft button
  if (!modalContent.querySelector("#saveDraftBtn")) {
    const saveDraftBtn = document.createElement("button");
    saveDraftBtn.id = "saveDraftBtn";
    saveDraftBtn.type = "button";
    saveDraftBtn.innerText = "Save Draft";
    saveDraftBtn.style = "background:#ffb6dd;color:#6a003a;padding:10px;border-radius:12px;border:none;margin-top:12px;cursor:pointer;width:100%;";
    saveDraftBtn.addEventListener("click", () => saveDraftFromModal());

    const saveBtn = modalContent.querySelector("#saveRecipeBtn");
    if (saveBtn) {
      saveBtn.parentNode.insertBefore(saveDraftBtn, saveBtn);
    } else {
      modalContent.appendChild(saveDraftBtn);
    }
  }
}

// close addRecipeModal when clicking background overlay (confirm)
addRecipeModal.addEventListener("click", (e) => {
  if (e.target === addRecipeModal) {
    if (confirm("Discard changes and close?")) {
      clearAddModal();
      addRecipeModal.classList.add("hidden");
    }
  }
});

// -----------------------------
// INITIAL RENDER + UI
// -----------------------------
renderRecipes();
ensureAddModalControls(); // prepare UI in case admin logs in immediately

// If admin already unlocked earlier (unlikely in single session), inject UI
if (isAdmin) injectAdminUI();
function editRecipe(id) {
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;

  // Show modal
  document.getElementById("addRecipeModal").classList.remove("hidden");

  // Fill fields
  document.getElementById("newTitle").value = recipe.title;
  document.getElementById("newCategory").value = recipe.category;
  document.getElementById("newImage").value = recipe.image;
  document.getElementById("newDesc").value = recipe.description;

  // Fill Ingredients
  const ingList = document.getElementById("ingredientsList");
  ingList.innerHTML = "";
  recipe.ingredients.forEach(ing => {
    const item = document.createElement("input");
    item.className = "dynamic-input";
    item.value = ing;
    ingList.appendChild(item);
  });

  // Fill Instructions
  const instrList = document.getElementById("instructionsList");
  instrList.innerHTML = "";
  recipe.instructions.forEach(step => {
    const item = document.createElement("input");
    item.className = "dynamic-input";
    item.value = step;
    instrList.appendChild(item);
  });

  // Save ID so we know we're editing, not creating new
  window.editingId = id;
}
function moveToDrafts(id) {
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;

  recipe.draft = true; // mark as hidden
  localStorage.setItem("recipes", JSON.stringify(recipes));
  loadRecipes();
}
