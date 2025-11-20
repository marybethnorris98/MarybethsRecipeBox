// FULL admin + viewer script loaded (GitHub draft sync merged)
console.log("FULL admin + viewer script loaded");
const placeholderImage = "https://placehold.co/800x500?text=Recipe+Image";
/* -------------------------------------------------
   DEFAULT RECIPES
------------------------------------------------- */
const defaultRecipes = [
  {
    title: "Blueberry Pancakes",
    category: "breakfast",
    image: placeholderImage,
    description: "Fluffy homemade pancakes loaded with fresh blueberries.",
    ingredients: ["1 cup flour","1 cup blueberries","1 egg","1 tbsp sugar","1 cup milk"],
    instructions: ["Mix dry ingredients.","Add egg & milk.","Fold in blueberries.","Cook on skillet until golden."]
  },
  {
    title: "Chicken Caesar Salad",
    category: "lunch",
    image: placeholderImage,
    description: "Crisp romaine, grilled chicken, parmesan, and creamy dressing.",
    ingredients: ["Romaine lettuce","Grilled chicken","Parmesan","Croutons","Caesar dressing"],
    instructions: ["Chop lettuce.","Slice chicken.","Toss with dressing.","Top with cheese & croutons."]
  },
  {
    title: "Sample Pasta",
    category: "dinner",
    image: placeholderImage,
    description: "A quick sample pasta for testing the modal.",
    ingredients: ["2 cups pasta","1 tbsp olive oil","Salt","Parmesan cheese"],
    instructions: ["Boil pasta until tender.","Drain and toss with olive oil.","Season with salt.","Top with parmesan and serve."]
  }
];

/* -------------------------------------------------
   STORAGE KEYS + LOAD (recipes still in localStorage)
------------------------------------------------- */
const RECIPES_KEY = "recipes";
// keep key constant for possible backward-compat, but drafts not read from localStorage anymore
const DRAFTS_KEY = "drafts_recipes";

let recipes = JSON.parse(localStorage.getItem(RECIPES_KEY)) || defaultRecipes;
recipes = recipes.map(r => ({ hidden: false, ...r }));
let drafts = []; // now loaded from GitHub on init

async function loadDraftsFromGitHub() {
  try {
    const response = await fetch("drafts.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Network error loading drafts.json");

    const remoteDrafts = await response.json();

    if (Array.isArray(remoteDrafts)) {
      drafts = remoteDrafts;
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      console.log("Drafts loaded from GitHub:", drafts);
    }
  } catch (err) {
    console.warn("Could not load drafts.json from GitHub:", err);
  }
}
async function saveDraftsToGitHub() {
  try {
    await fetch("drafts.json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(drafts, null, 2)
    });

    console.log("Drafts saved to GitHub (waiting for action to commit).");
  } catch (err) {
    console.error("Error saving drafts to GitHub:", err);
  }
}

/* -------------------------------------------------
   GITHUB DRAFTS: load & trigger save via GitHub Actions
   - loadDraftsFromGitHub()  -> fetches raw drafts.json
   - triggerGitHubDraftSave() -> dispatches your workflow which commits drafts.json
------------------------------------------------- */
async function loadDraftsFromGitHub() {
  const url = "https://raw.githubusercontent.com/marybethnorris98/RecipeBook/main/drafts.json";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // no drafts file yet or network issue
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn("Failed to load drafts from GitHub:", err);
    return [];
  }
}

async function triggerGitHubDraftSave(draftsObj) {
  // this triggers the workflow you created (save-drafts.yml)
   const GITHUB_TOKEN = "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";
  const workflowURL = "https://api.github.com/repos/marybethnorris98/RecipeBook/actions/workflows/save-drafts.yml/dispatches";

  try {
    const resp = await fetch(workflowURL, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
         "Authorization": `Bearer ${GITHUB_TOKEN}`
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          drafts: JSON.stringify(draftsObj, null, 2)
        }
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("GitHub action dispatch failed:", txt);
      alert("❌ Could not save drafts to GitHub (see console).");
      return false;
    }

    // success: action dispatched; the workflow will commit drafts.json shortly
    console.log("GitHub Action dispatched to save drafts.");
    return true;
  } catch (err) {
    console.error("Error dispatching GitHub Action:", err);
    alert("❌ Error saving drafts (see console).");
    return false;
  }
}

/* -------------------------------------------------
   DOM ELEMENTS
------------------------------------------------- */
const recipeGrid = document.getElementById("recipeGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

// Add-recipe modal fields (already in your HTML)
const addRecipeModal = document.getElementById("addRecipeModal");
const newTitle = document.getElementById("newTitle");
const newCategory = document.getElementById("newCategory");
const newImage = document.getElementById("newImage");
const newDesc = document.getElementById("newDesc");

const ingredientsList = document.getElementById("ingredientsList");
const instructionsList = document.getElementById("instructionsList");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const addInstructionBtn = document.getElementById("addInstructionBtn");

const saveRecipeBtn = document.getElementById("saveRecipeBtn");

const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

let isAdmin = false;           // becomes true after successful login
let editingDraftId = null;     // id of draft being edited (null if creating new)
let editingRecipeIndex = null; // optional feature if you later choose to edit saved recipes

/* -------------------------------------------------
   RENDER RECIPE CARDS
------------------------------------------------- */
function renderRecipes() {
  const searchTerm = (searchInput.value || "").toLowerCase();
  const selectedCategory = categoryFilter ? categoryFilter.value : "all";

  const filtered = recipes.filter(recipe => {
     if (!isAdmin && recipe.hidden) return false;
    const matchesSearch =
      (recipe.title || "").toLowerCase().includes(searchTerm) ||
      (recipe.description || "").toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || recipe.category === selectedCategory;

    return matchesSearch && matchesCategory;
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
/* -------------------------------------------------
   VIEWER
------------------------------------------------- */
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

  /* -------------------------------------------------
     ADMIN CONTROLS (Edit, Delete, Hide)
  ------------------------------------------------- */
  const adminControls = document.getElementById("adminViewControls");
  const editBtn = document.getElementById("adminEditBtn");
  const deleteBtn = document.getElementById("adminDeleteBtn");
  const hideBtn = document.getElementById("adminHideBtn");

  // find recipe index
  const index = recipes.findIndex(r =>
    r.title === recipe.title &&
    r.description === recipe.description
  );

  if (isAdmin && index >= 0) {
    adminControls.classList.remove("hidden");

    // EDIT
    editBtn.onclick = () => {
      editingRecipeIndex = index;
      populateAddModalFromDraft(recipe);
      addRecipeModal.classList.remove("hidden");
      document.getElementById("recipeModal").style.display = "none";
    };

    // DELETE
    deleteBtn.onclick = () => {
      if (!confirm("Delete this recipe permanently?")) return;
      recipes.splice(index, 1);
      localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
      document.getElementById("recipeModal").style.display = "none";
      renderRecipes();
    };

    // HIDE / UNHIDE
    hideBtn.textContent = recipe.hidden ? "Unhide" : "Hide";
    hideBtn.onclick = () => {
      recipes[index].hidden = !recipes[index].hidden;
      localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
      hideBtn.textContent = recipes[index].hidden ? "Unhide" : "Hide";
      renderRecipes();
    };

  } else {
    adminControls.classList.add("hidden");
  }
}
    // EDIT --------------------------------------------------
    editBtn.onclick = () => {
      editingRecipeIndex = index;
      populateAddModalFromDraft(recipe);
      addRecipeModal.classList.remove("hidden");
      document.getElementById("recipeModal").style.display = "none";
    };

    // DELETE ------------------------------------------------
    deleteBtn.onclick = () => {
      if (!confirm("Delete this recipe permanently?")) return;
      recipes.splice(index, 1);
      localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
      document.getElementById("recipeModal").style.display = "none";
      renderRecipes();
    };

    // HIDE / UNHIDE -----------------------------------------
    hideBtn.textContent = recipe.hidden ? "Unhide" : "Hide";
    hideBtn.onclick = () => {
      recipes[index].hidden = !recipes[index].hidden;
      localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
      hideBtn.textContent = recipes[index].hidden ? "Unhide" : "Hide";
      renderRecipes();
    };

  } else {
    adminControls.classList.add("hidden");
  }
}
/* -------------------------------------------------
   SEARCH + FILTER
------------------------------------------------- */
if (searchInput) searchInput.addEventListener("input", renderRecipes);
if (categoryFilter) categoryFilter.addEventListener("change", renderRecipes);

/* -------------------------------------------------
   ADMIN LOGIN (keeps existing obfuscation)
------------------------------------------------- */
const ADMIN_PASSWORD_HASH = "pinkrecipes".split("").reverse().join(""); // same as before

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
    injectAdminUI(); // create Add + Drafts buttons
  } else {
    loginError.style.display = "block";
  }
});

document.addEventListener("keydown", (e) => {
  const key = e.key?.toLowerCase();

  const mac = navigator.userAgent.includes("Mac");
  const cmd = e.metaKey;
  const ctrl = e.ctrlKey;
  const shift = e.shiftKey;

  // Mac: Command + Shift + M
  // Windows: Ctrl + Shift + M
  const shouldOpen =
    (mac && cmd && shift && key === "m") ||
    (!mac && ctrl && shift && key === "m");

  if (shouldOpen) {
    console.log("Shortcut matched → openLoginModal()");
    openLoginModal();
  }
}); 

/* -------------------------------------------------
   ADMIN UI: inject Add + Drafts buttons (bottom-right)
   These are only created after isAdmin === true
------------------------------------------------- */
function injectAdminUI() {
  if (document.getElementById("adminControlsContainer")) return; // already injected

  const container = document.createElement("div");
  container.id = "adminControlsContainer";
  container.style = "position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:1200;";

  // Add Recipe button
  const addBtn = document.createElement("button");
  addBtn.id = "adminAddBtn";
  addBtn.textContent = "+ Add Recipe";
  addBtn.style = "background:#ff3ebf;color:white;padding:12px 16px;border-radius:14px;border:none;font-size:16px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.15);";
  addBtn.addEventListener("click", () => {
    editingDraftId = null; // new recipe, not editing a draft
    openAddRecipeModal();
    populateAddModalFromDraft(null); // clear
  });

  // Drafts button (per your choice: under the Add Recipe button)
  const draftsBtn = document.createElement("button");
  draftsBtn.id = "adminDraftsBtn";
  draftsBtn.textContent = "Drafts";
  draftsBtn.style = "background:#ffd6ee;color:#a00064;padding:10px 16px;border-radius:12px;border:2px solid #ffb1db;font-size:14px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.12);";
  draftsBtn.addEventListener("click", () => {
    openDraftsModal();
  });

  container.appendChild(addBtn);
  container.appendChild(draftsBtn);
  document.body.appendChild(container);
}

/* -------------------------------------------------
   ADD-RECIPE MODAL HELPERS
   - add/remove ingredient & step rows
   - clear, populate, and close modal
------------------------------------------------- */
function makeRowInput(placeholder = "", type = "ingredient") {
  const row = document.createElement("div");
  row.className = "admin-row";
  // input and small remove button
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
  newImage.value = "";
  newDesc.value = "";

  ingredientsList.innerHTML = "";
  instructionsList.innerHTML = "";

  // reset editing state
  editingDraftId = null;
}

function populateAddModalFromDraft(draft) {
  // if draft is null -> clear
  clearAddModal();

  if (!draft) return;

  newTitle.value = draft.title || "";
  newCategory.value = draft.category || "breakfast";
  newImage.value = draft.image || "";
  newDesc.value = draft.description || "";

  // ingredients
  (draft.ingredients || []).forEach(ing => {
    const r = makeRowInput("Ingredient", "ingredient");
    r.querySelector("input").value = ing;
    ingredientsList.appendChild(r);
  });

  // instructions
  (draft.instructions || []).forEach(step => {
    const r = makeRowInput("Step", "step");
    r.querySelector("input").value = step;
    instructionsList.appendChild(r);
  });
}

// ensure the Add Recipe modal has a big close (trash) 'X' at top-right and a Save Draft button
function ensureAddModalControls() {
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
      // discard current edits (do not save)
      if (confirm("Discard changes and close?")) {
        clearAddModal();
        addRecipeModal.classList.add("hidden");
      }
    });
    // ensure position relative on modal-content to place absolute button
    modalContent.style.position = modalContent.style.position || "relative";
    modalContent.appendChild(x);
  }

  // Save Draft button (placed above Save Recipe)
  if (!modalContent.querySelector("#saveDraftBtn")) {
    const saveDraftBtn = document.createElement("button");
    saveDraftBtn.id = "saveDraftBtn";
    saveDraftBtn.type = "button";
    saveDraftBtn.innerText = "Save Draft";
    saveDraftBtn.style = "background:#ffb6dd;color:#6a003a;padding:10px;border-radius:12px;border:none;margin-top:12px;cursor:pointer;width:100%;";
    saveDraftBtn.addEventListener("click", () => {
      saveDraftFromModal();

       saveDraftsToGitHub();

    });

    // insert before the Save Recipe button (if present)
    const saveBtn = modalContent.querySelector("#saveRecipeBtn");
    if (saveBtn) {
      saveBtn.parentNode.insertBefore(saveDraftBtn, saveBtn);
    } else {
      modalContent.appendChild(saveDraftBtn);
    }
  }
}

/* attach add/remove behaviors */
addIngredientBtn.addEventListener("click", () => {
  ingredientsList.appendChild(makeRowInput("Ingredient", "ingredient"));
});
addInstructionBtn.addEventListener("click", () => {
  instructionsList.appendChild(makeRowInput("Step", "step"));
});

/* -------------------------------------------------
   SAVE RECIPE (final)
------------------------------------------------- */
saveRecipeBtn.addEventListener("click", async () => {
  const title = (newTitle.value || "").trim();
  const category = newCategory.value || "breakfast";
 let image = (newImage.value || "").trim();
if (!image || image.trim() === "") image = placeholderImage;

// Fix bad URLs like "800x500?text=Recipe+Image"
if (image.startsWith("800x") || image === "800x500?text=Recipe+Image") {
  image = placeholderImage;
}

  const description = (newDesc.value || "").trim();

  if (!title || !image || !description) {
    alert("Please fill in title, image, and description.");
    return;
  }

  const ingredients = [...ingredientsList.querySelectorAll("input")]
    .map(i => i.value.trim()).filter(Boolean);

  const instructions = [...instructionsList.querySelectorAll("input")]
    .map(i => i.value.trim()).filter(Boolean);

  const newRecipe = {
    title,
    category,
    image,
    description,
    ingredients,
    instructions
  };

  recipes.push(newRecipe);
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));

  // if we were editing a draft, remove it (user converted draft to recipe)
  if (editingDraftId) {
    drafts = drafts.filter(d => d.id !== editingDraftId);
    // persist updated drafts to GitHub
    await triggerGitHubDraftSave(drafts);
    editingDraftId = null;
  }

  alert("Recipe saved!");
  clearAddModal();
  addRecipeModal.classList.add("hidden");
  renderRecipes();

  loadDraftsFromGitHub();
 
});

/* -------------------------------------------------
   DRAFTS: Save / Load / List / Delete
------------------------------------------------- */
// helper to build a draft object from modal (allows empty title)
function buildDraftFromModal() {
  const title = (newTitle.value || "").trim();
  const category = newCategory.value || "breakfast";
  const image = (newImage.value || "").trim();
  const description = (newDesc.value || "").trim();
  const ingredients = [...ingredientsList.querySelectorAll("input")]
    .map(i => i.value.trim()).filter(Boolean);
  const instructions = [...instructionsList.querySelectorAll("input")]
    .map(i => i.value.trim()).filter(Boolean);

  return {
    id: editingDraftId || ("draft_" + Date.now()),
    title: title || "Untitled Draft",
    category,
    image,
    description,
    ingredients,
    instructions
  };
}

async function saveDraftFromModal() {
  const draft = buildDraftFromModal();

  // if editing an existing draft, replace it
  const existsIndex = drafts.findIndex(d => d.id === draft.id);
  if (existsIndex >= 0) {
    drafts[existsIndex] = draft;
  } else {
    drafts.push(draft);
  }

  // sort
  drafts.sort((a,b) => (a.title || "").localeCompare(b.title || ""));

  // persist to GitHub (replaces localStorage behavior)
  alert("Saving draft to GitHub...");
  const ok = await triggerGitHubDraftSave(drafts);
  if (ok) alert("Draft saved.");
  editingDraftId = draft.id;
}

/* Drafts Modal creation (dynamically inject to DOM) */
function openDraftsModal() {
  // create modal if not exists
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
/* -------------------------------------------------
   EDIT EXISTING RECIPE (admin only)
------------------------------------------------- */
function editRecipe(index) {
  editingRecipeIndex = index;

  const recipe = recipes[index];
  if (!recipe) return;

  // Load recipe into modal (same function used for drafts)
  populateAddModalFromDraft(recipe);

  // Show modal
  addRecipeModal.classList.remove("hidden");
}
  // populate list
  const listContainer = draftsModal.querySelector("#draftsList");
  listContainer.innerHTML = "";

  // sort alphabetically by title
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
        // load this draft into add modal and open
        editingDraftId = d.id;
        populateAddModalFromDraft(d);
        addRecipeModal.classList.remove("hidden");
        draftsModal.classList.add("hidden");
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style = "background:transparent;color:#b20050;border:2px solid #ffd1e8;padding:6px 10px;border-radius:8px;cursor:pointer;";
      deleteBtn.addEventListener("click", async () => {
        if (!confirm(`Delete draft "${d.title}"?`)) return;
        drafts = drafts.filter(x => x.id !== d.id);
        // save updated drafts to GitHub
        await triggerGitHubDraftSave(drafts);
        openDraftsModal(); // refresh
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

/* -------------------------------------------------
   UTILITY: when opening add modal ensure controls exist
------------------------------------------------- */
function openAddRecipeModal() {
  ensureAddModalControls();
  addRecipeModal.classList.remove("hidden");

  // if we're editing a draft, populate
  if (editingDraftId) {
    const d = drafts.find(x => x.id === editingDraftId);
    if (d) populateAddModalFromDraft(d);
  }
}

/* ensure controls at script load (in case admin logs in immediately) */
ensureAddModalControls();

/* close addRecipeModal when clicking background overlay (optional) */
addRecipeModal.addEventListener("click", (e) => {
  if (e.target === addRecipeModal) {
    if (confirm("Discard changes and close?")) {
      clearAddModal();
      addRecipeModal.classList.add("hidden");
    }
  }
});

/* -------------------------------------------------
   INITIAL RENDER
   -> load drafts from GitHub first, then render
------------------------------------------------- */
(async function init() {
  drafts = await loadDraftsFromGitHub();
   drafts = drafts.map(d => ({
  ...d,
  image: (!d.image || d.image.startsWith("800x")) ? placeholderImage : d.image
}));
  console.log("Loaded drafts from GitHub:", drafts);
  renderRecipes();

  // if admin already authenticated (unlikely)
  if (isAdmin) injectAdminUI();

})();
