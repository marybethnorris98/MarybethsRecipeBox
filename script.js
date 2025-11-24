console.log("FULL admin + viewer script loaded");

// -----------------------------
// ADMIN STATE
// -----------------------------
let isAdmin = localStorage.getItem("admin") === "true";

// -----------------------------
// DEFAULT RECIPES
// (UPDATED: Added 'credits' field)
// -----------------------------
const defaultRecipes = [
  {
    title: "Blueberry Pancakes",
    category: "Breakfast",
    image: "images/pancakes.jpg",
    description: "Fluffy homemade pancakes loaded with fresh blueberries.",
    ingredients: ["1 cup flour","1 cup blueberries","1 egg","1 tbsp sugar","1 cup milk"],
    instructions: ["Mix dry ingredients.","Add egg & milk.","Fold in blueberries.","Cook on skillet until golden."],
    hidden: false,
    credits: "The Breakfast Nook blog" // ADDED FIELD
  },
  {
    title: "Chicken Caesar Salad",
    category: "Meals",
    image: "images/salad.jpg",
    description: "Crisp romaine, grilled chicken, parmesan, and creamy dressing.",
    ingredients: ["Romaine lettuce","Grilled chicken","Parmesan","Croutons","Caesar dressing"],
    instructions: ["Chop lettuce.","Slice chicken.","Toss with dressing.","Top with cheese & croutons."],
    hidden: false,
    credits: "Chef Maria" // ADDED FIELD
  },
  {
    title: "Sample Pasta",
    category: "Snacks",
    image: "https://via.placeholder.com/800x500?text=Recipe+Image",
    description: "A quick sample pasta for testing the modal.",
    ingredients: ["2 cups pasta","1 tbsp olive oil","Salt","Parmesan cheese"],
    instructions: ["Boil pasta until tender.","Drain and toss with olive oil.","Season with salt.","Top with parmesan and serve."],
    hidden: false,
    credits: "The Developer" // ADDED FIELD
  }
];

// -----------------------------
// STORAGE KEYS + CATEGORIES
// -----------------------------
const RECIPES_KEY = "recipes";
const DRAFTS_KEY = "drafts_recipes";
const CATEGORIES = ["Breakfast", "Meals", "Snacks", "Sides", "Dessert", "Drinks"];

let recipes = JSON.parse(localStorage.getItem(RECIPES_KEY)) || defaultRecipes;
let drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [];

// -----------------------------
// MAIN INITIALIZATION
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {

  // Grab DOM elements safely
  const recipeGrid = document.getElementById("recipeGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

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
  // 👇 NEW: Get the new credits input field
  let newCredits = document.getElementById("newCredits"); 

  const loginModal = document.getElementById("loginModal");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");

  const viewer = document.getElementById("recipeModal");
  const closeBtn = document.getElementById("closeViewerBtn");

  let editingDraftId = null;
  let editingRecipeIndex = null;

  [categoryFilter, newCategory].forEach(select => {
    if (!select) return;
    select.style.fontFamily = "Poppins, sans-serif"; // clean font
    select.style.fontSize = "16px";                // bigger font
    select.style.fontWeight = "bold";              // bold text
    select.style.color = "#f039b1";                // pink/purple text
    select.style.padding = "6px 10px";             // nicer spacing
    select.style.borderRadius = "8px";             // rounded corners
    select.style.border = "2px solid #ffb1db";     // matching border color
  });

  if (searchInput) {
    searchInput.style.fontFamily = "Poppins, sans-serif";
    searchInput.style.fontSize = "16px";
    searchInput.style.color = "#f039b1";  // pink/purple text
    searchInput.style.padding = "6px 10px";
    searchInput.style.borderRadius = "8px";
    searchInput.style.border = "2px solid #ffb1db";
  }

  // -----------------------------
  // POPULATE CATEGORY DROPDOWNS
  // -----------------------------
  function populateCategorySelects() {
    [newCategory, categoryFilter].forEach(select => {
      if (!select) return;
      select.innerHTML = "";

      // Only filter dropdown gets "All"
      if (select === categoryFilter) {
        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = "All";
        select.appendChild(allOption);
      }

      CATEGORIES.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
      });
    });
  }

  populateCategorySelects();

  // -----------------------------
  // RENDER RECIPES
  // -----------------------------
  function renderRecipes() {
    if (!recipeGrid) return;

    const searchTerm = (searchInput?.value || "").toLowerCase();
    const selectedCategory = categoryFilter?.value || "all";

    const filtered = recipes.filter(recipe => {
      if (!isAdmin && recipe.hidden) return false;

      const matchesSearch =
        (recipe.title || "").toLowerCase().includes(searchTerm) ||
        (recipe.description || "").toLowerCase().includes(searchTerm);

      const matchesCategory =
        selectedCategory === "all" || recipe.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    recipeGrid.innerHTML = "";

    filtered.forEach(recipe => {
      const card = document.createElement("div");
      card.className = "card";

      if (recipe.hidden) {
  if (isAdmin) {
    card.classList.add("hidden-recipe-admin"); // special class for admin
  } else {
    return; // normal users don't see hidden recipes
  }
} 
      const img = document.createElement("img");
      img.src = recipe.image || "";
      img.alt = recipe.title || "";

      const content = document.createElement("div");
      content.className = "card-content";

      const titleDiv = document.createElement("div");
      titleDiv.className = "card-title";
      titleDiv.textContent = recipe.title || "";

      const catDiv = document.createElement("div");
      catDiv.className = "card-category";
      catDiv.textContent = recipe.category || "";

      const descDiv = document.createElement("div");
      descDiv.className = "card-desc";
      descDiv.textContent = recipe.description || "";

      content.appendChild(titleDiv);
      content.appendChild(catDiv);
      content.appendChild(descDiv);
      card.appendChild(img);
      card.appendChild(content);

      // --- INFO ICON + TOOLTIP ---
      const infoIcon = document.createElement("div");
      infoIcon.className = "card-info-icon";
      infoIcon.textContent = "i";

      const tooltip = document.createElement("div");
      tooltip.className = "card-info-tooltip";
      tooltip.textContent = recipe.credits || "No credits added."; // UPDATED to 'credits'

      infoIcon.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent opening the modal
        tooltip.classList.toggle("visible");
      });

      // Hide tooltip when clicking anywhere else
      document.addEventListener("click", () => tooltip.classList.remove("visible"));

      // Add to card
      card.appendChild(infoIcon);
      card.appendChild(tooltip);

      card.addEventListener("click", () => openRecipeModal(recipe));

      recipeGrid.appendChild(card);
    });
  }

  renderRecipes();

  // -----------------------------
  // OPEN RECIPE MODAL
  // -----------------------------
 function openRecipeModal(recipe) {
  // ... (omitted for brevity - no changes needed here other than the one for the info icon above)
  if (!recipe || !viewer) return;

  const modalEditBtn = document.getElementById("modalEditBtn");
  const modalDeleteBtn = document.getElementById("modalDeleteBtn");
  const hideBtn = document.getElementById("modalHideBtn");

  const modalImg = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalCategory = document.getElementById("modalCategory");
  let modalDesc = document.getElementById("modalDescription");

  if (!modalDesc) {
    modalDesc = document.createElement("div");
    modalDesc.id = "modalDescription";
    modalCategory?.after(modalDesc);
  }

  const modalIngredients = document.getElementById("modalIngredients");
  const modalInstructions = document.getElementById("modalInstructions");

  editingRecipeIndex = recipes.findIndex(r =>
    r.title === recipe.title &&
    r.description === recipe.description &&
    r.image === recipe.image
  );
  if (editingRecipeIndex < 0) editingRecipeIndex = null;

  // ✅ FIXED Image size
  if (modalImg) {
    modalImg.src = recipe.image || "";
    modalImg.alt = recipe.title || "";
    modalImg.style.maxWidth = "100%";
    modalImg.style.maxHeight = window.innerWidth <= 480 ? "200px" : "300px";
    modalImg.style.height = "auto";
    modalImg.style.objectFit = "contain";
    modalImg.style.display = "block";
    modalImg.style.margin = window.innerWidth <= 480 ? "0 auto 15px" : "0 auto 30px";
  }

  if (modalTitle) modalTitle.textContent = recipe.title || "";
  if (modalCategory) modalCategory.textContent = recipe.category || "";
  if (modalDesc) modalDesc.textContent = recipe.description || "";

  if (modalIngredients) {
    modalIngredients.innerHTML = "";
    (recipe.ingredients || []).forEach(ing => {
      const li = document.createElement("li");
      li.textContent = ing;
      modalIngredients.appendChild(li);
    });
  }

  if (modalInstructions) {
    modalInstructions.innerHTML = "";
    (recipe.instructions || []).forEach(step => {
      const li = document.createElement("li");
      li.textContent = step;
      modalInstructions.appendChild(li);
    });
  }

  // Admin buttons
  if (modalEditBtn) {
    if (isAdmin && editingRecipeIndex !== null) {
      modalEditBtn.style.display = "inline-block";
      modalEditBtn.onclick = () => {
        populateAddModalFromDraft(recipes[editingRecipeIndex]);
        addRecipeModal.classList.remove("hidden");
        viewer.style.display = "none";
      };
    } else modalEditBtn.style.display = "none";
  }

  if (modalDeleteBtn) {
    if (isAdmin && editingRecipeIndex !== null) {
      modalDeleteBtn.style.display = "inline-block";
      modalDeleteBtn.onclick = () => {
        if (!confirm(`Delete "${recipes[editingRecipeIndex].title}"?`)) return;
        recipes.splice(editingRecipeIndex, 1);
        localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
        viewer.style.display = "none";
        renderRecipes();
      };
    } else modalDeleteBtn.style.display = "none";
  }

  // ✅ FIXED HIDE/UNHIDE
  if (hideBtn) {
    if (isAdmin && editingRecipeIndex !== null) {
      hideBtn.style.display = "inline-block";
      hideBtn.textContent = recipes[editingRecipeIndex].hidden ? "Unhide" : "Hide";

      hideBtn.onclick = (e) => {
        e.stopPropagation();
        recipes[editingRecipeIndex].hidden = !recipes[editingRecipeIndex].hidden;
        localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
        hideBtn.textContent = recipes[editingRecipeIndex].hidden ? "Unhide" : "Hide";
        renderRecipes();
      };
    } else hideBtn.style.display = "none";
  }

  viewer.style.display = "flex";
  viewer.setAttribute("aria-hidden", "false");
}
  // ... (omitted for brevity)

  // -----------------------------
  // ADD/EDIT RECIPE MODAL HELPERS
  // -----------------------------
  // ... (omitted makeRowInput - no changes)

  function clearAddModal() {
    newTitle.value = "";
    newCategory.value = CATEGORIES[0];
    newImage.value = "";
    newDesc.value = "";
    ingredientsList.innerHTML = "";
    instructionsList.innerHTML = "";
    editingDraftId = null;
    // 👇 NEW: Clear the new credits input
    if (newCredits) newCredits.value = ""; 
  }

  function populateAddModalFromDraft(draft) {
    clearAddModal();
    if (!draft) return;

    newTitle.value = draft.title || "";
    newCategory.value = draft.category || CATEGORIES[0];
    newImage.value = draft.image || "";
    newDesc.value = draft.description || "";
    // 👇 NEW: Populate the new credits input
    if (newCredits) newCredits.value = draft.credits || ""; 

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
  }
  
  // 👇 NEW: Function to dynamically create the credits input if it doesn't exist
  function ensureCreditsInput() {
    if (newCredits) return;

    if (!addRecipeModal) return;
    const modalContent = addRecipeModal.querySelector(".modal-content");
    if (!modalContent) return;

    // Create a styled container/label for the input
    const label = document.createElement("label");
    label.textContent = "Credits / Source:";
    label.style = "display:block;margin-top:15px;margin-bottom:5px;font-weight:bold;color:#ff3ebf;";
        
    // Create the input field
    const input = document.createElement("input");
    input.type = "text";
    input.id = "newCredits";
    input.placeholder = "Original source (e.g., 'Mom's recipe', 'Allrecipes')";
    input.style = "width:100%;padding:10px;border:2px solid #ffb1db;border-radius:8px;box-sizing:border-box;";
    newCredits = input; // Assign to the captured variable

    // Find a good place to put it, perhaps after the Description field
    const descLabel = modalContent.querySelector('label[for="newDesc"]');
    const descInput = document.getElementById("newDesc");
    
    // Assuming 'newDesc' is a textarea, insert after it.
    if (descInput && descInput.parentNode) {
      descInput.parentNode.insertBefore(label, descInput.nextSibling);
      descInput.parentNode.insertBefore(input, label.nextSibling);
    } else if (newDesc) {
      // Fallback if we can only find the textarea
      newDesc.after(label);
      label.after(input);
    } else {
      // If the modal structure is minimal, just append to the content
      modalContent.appendChild(label);
      modalContent.appendChild(input);
    }
  }

  function ensureAddModalControls() {
    // ... (Existing code for creating buttons)
    
    // 👇 NEW: Call the function to ensure the credits input exists
    ensureCreditsInput(); 

    if (!addRecipeModal) return;
    const modalContent = addRecipeModal.querySelector(".modal-content");
    if (!modalContent) return;

    if (!modalContent.querySelector("#saveDraftBtn")) {
  const saveDraftBtn = document.createElement("button");
  saveDraftBtn.id = "saveDraftBtn";
  saveDraftBtn.type = "button";
  saveDraftBtn.innerText = "Save Draft";
  saveDraftBtn.style = "background:#ffb6dd;color:#6a003a;padding:10px;border-radius:12px;border:none;margin-top:12px;cursor:pointer;width:100%;";

  // Attach the function (we’ll add this function next)
  saveDraftBtn.addEventListener("click", saveDraftFromModal);

  const saveBtn = modalContent.querySelector("#saveRecipeBtn");
  if (saveBtn) saveBtn.parentNode.insertBefore(saveDraftBtn, saveBtn);
  else modalContent.appendChild(saveDraftBtn);
}

    // Big X close button
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
      saveDraftBtn.addEventListener("click", saveDraftFromModal);

      const saveBtn = modalContent.querySelector("#saveRecipeBtn");
      if (saveBtn) saveBtn.parentNode.insertBefore(saveDraftBtn, saveBtn);
      else modalContent.appendChild(saveDraftBtn);
    }
  }

  addIngredientBtn?.addEventListener("click", () => ingredientsList.appendChild(makeRowInput("Ingredient")));
  addInstructionBtn?.addEventListener("click", () => instructionsList.appendChild(makeRowInput("Step")));

  // -----------------------------
  // SAVE RECIPE (UPDATED)
  // -----------------------------
saveRecipeBtn?.addEventListener("click", () => {
  const title = (newTitle.value || "").trim();
  const category = newCategory.value || CATEGORIES[0];
  const image = (newImage.value || "").trim();
  const description = (newDesc.value || "").trim();
  // 👇 NEW: Grab the credits value
  const credits = (newCredits?.value || "").trim(); 

  // Validate required fields
  if (!title || !image || !description) {
    return alert("Please fill in title, image, and description.");
  }

  // Gather ingredients and instructions
  const ingredients = [...ingredientsList.querySelectorAll("input")]
    .map(i => i.value.trim())
    .filter(Boolean);

  const instructions = [...instructionsList.querySelectorAll("input")]
    .map(i => i.value.trim())
    .filter(Boolean);

  // Create new recipe object
  const newRecipe = {
    title,
    category,
    image,
    description,
    ingredients,
    instructions,
    hidden: false, // default to visible
    // 👇 NEW: Include the credits field
    credits 
  };

  // -----------------------------
  // Determine whether editing a recipe or adding new
  // -----------------------------
  if (editingRecipeIndex !== null) {
    // Updating an existing recipe
    recipes[editingRecipeIndex] = newRecipe;
    editingRecipeIndex = null;
  } else {
    // Adding a completely new recipe
    recipes.push(newRecipe);
  }

  // -----------------------------
  // Remove draft if one was being edited
  // -----------------------------
  if (editingDraftId) {
    drafts = drafts.filter(d => d.id !== editingDraftId);
    editingDraftId = null;
  }

  // -----------------------------
  // Persist and refresh UI
  // -----------------------------
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));

  alert("Recipe saved!");
  clearAddModal();
  addRecipeModal.classList.add("hidden");
  renderRecipes();
});

  // -----------------------------
  // SAVE DRAFT FROM MODAL (UPDATED)
  // -----------------------------
  function saveDraftFromModal() {
  const title = (newTitle.value || "").trim();
  const category = newCategory.value || CATEGORIES[0];
  const image = (newImage.value || "").trim();
  const description = (newDesc.value || "").trim();
  // 👇 NEW: Grab the credits value
  const credits = (newCredits?.value || "").trim(); 

  if (!title && !image && !description && !credits) {
    return alert("Please fill at least a title, image, description, or credits to save a draft.");
  }

  const ingredients = [...ingredientsList.querySelectorAll("input")]
    .map(i => i.value.trim())
    .filter(Boolean);

  const instructions = [...instructionsList.querySelectorAll("input")]
    .map(i => i.value.trim())
    .filter(Boolean);

  const draft = {
    id: editingDraftId || `draft_${Date.now()}`,
    title,
    category,
    image,
    description,
    ingredients,
    instructions,
    // 👇 NEW: Include the credits field
    credits 
  };

  if (editingDraftId) {
    drafts = drafts.map(d => (d.id === editingDraftId ? draft : d));
  } else {
    drafts.push(draft);
    editingDraftId = draft.id;
  }

  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));

  alert("Draft saved!");
  addRecipeModal.classList.add("hidden");
  clearAddModal();
}

  // ... (omitted remaining functions - no changes)

  ensureAddModalControls();

}); // end DOMContentLoaded
