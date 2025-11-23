console.log("FULL admin + viewer script loaded");

// -----------------------------
// FIREBASE CONFIG
// -----------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// -----------------------------
// ADMIN STATE
// -----------------------------
let isAdmin = localStorage.getItem("admin") === "true";

// -----------------------------
// RECIPE & DRAFT ARRAYS
// -----------------------------
let recipes = [];
let drafts = [];

// -----------------------------
// CATEGORIES
// -----------------------------
const CATEGORIES = ["Breakfast", "Meals", "Snacks", "Sides", "Dessert", "Drinks"];

// -----------------------------
// MAIN INITIALIZATION
// -----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
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

  const loginModal = document.getElementById("loginModal");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");

  const viewer = document.getElementById("recipeModal");
  const closeBtn = document.getElementById("closeViewerBtn");

  let editingDraftId = null;
  let editingRecipeIndex = null;

  // -----------------------------
  // Populate category selects
  // -----------------------------
  function populateCategorySelects() {
    [newCategory, categoryFilter].forEach(select => {
      if (!select) return;
      select.innerHTML = "";

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
  // Load recipes and drafts from Firestore
  // -----------------------------
  async function loadRecipes() {
    const snapshot = await db.collection("recipes").get();
    recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderRecipes();
  }

  async function loadDrafts() {
    const snapshot = await db.collection("drafts").get();
    drafts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  await loadRecipes();
  await loadDrafts();

  // -----------------------------
  // Render recipes
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
      if (recipe.hidden && isAdmin) card.classList.add("hidden-recipe-admin");
      if (recipe.hidden && !isAdmin) return;

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

      const infoIcon = document.createElement("div");
      infoIcon.className = "card-info-icon";
      infoIcon.textContent = "i";

      const tooltip = document.createElement("div");
      tooltip.className = "card-info-tooltip";
      tooltip.textContent = recipe.credit || "No credits added.";

      infoIcon.addEventListener("click", e => {
        e.stopPropagation();
        tooltip.classList.toggle("visible");
      });
      document.addEventListener("click", () => tooltip.classList.remove("visible"));

      card.appendChild(infoIcon);
      card.appendChild(tooltip);

      card.addEventListener("click", () => openRecipeModal(recipe));

      recipeGrid.appendChild(card);
    });
  }

  // -----------------------------
  // Open recipe modal
  // -----------------------------
  function openRecipeModal(recipe) {
    if (!viewer) return;
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

    editingRecipeIndex = recipes.findIndex(r => r.id === recipe.id);
    if (editingRecipeIndex < 0) editingRecipeIndex = null;

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

    const modalIngredients = document.getElementById("modalIngredients");
    const modalInstructions = document.getElementById("modalInstructions");
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
      modalEditBtn.style.display = isAdmin && editingRecipeIndex !== null ? "inline-block" : "none";
      modalEditBtn.onclick = () => {
        populateAddModalFromDraft(recipes[editingRecipeIndex]);
        addRecipeModal.classList.remove("hidden");
        viewer.style.display = "none";
      };
    }

    if (modalDeleteBtn) {
      modalDeleteBtn.style.display = isAdmin && editingRecipeIndex !== null ? "inline-block" : "none";
      modalDeleteBtn.onclick = async () => {
        if (!confirm(`Delete "${recipes[editingRecipeIndex].title}"?`)) return;
        const id = recipes[editingRecipeIndex].id;
        await db.collection("recipes").doc(id).delete();
        recipes.splice(editingRecipeIndex, 1);
        viewer.style.display = "none";
        renderRecipes();
      };
    }

    if (hideBtn) {
      if (isAdmin && editingRecipeIndex !== null) {
        hideBtn.style.display = "inline-block";
        hideBtn.textContent = recipes[editingRecipeIndex].hidden ? "Unhide" : "Hide";
        hideBtn.onclick = async e => {
          e.stopPropagation();
          recipes[editingRecipeIndex].hidden = !recipes[editingRecipeIndex].hidden;
          const id = recipes[editingRecipeIndex].id;
          await db.collection("recipes").doc(id).update({ hidden: recipes[editingRecipeIndex].hidden });
          hideBtn.textContent = recipes[editingRecipeIndex].hidden ? "Unhide" : "Hide";
          renderRecipes();
        };
      } else hideBtn.style.display = "none";
    }

    viewer.style.display = "flex";
    viewer.setAttribute("aria-hidden", "false");
  }

  // -----------------------------
  // Close modal
  // -----------------------------
  if (closeBtn && viewer) {
    closeBtn.addEventListener("click", () => {
      viewer.style.display = "none";
      viewer.setAttribute("aria-hidden", "true");
    });
    viewer.addEventListener("click", e => {
      if (e.target === viewer) {
        viewer.style.display = "none";
        viewer.setAttribute("aria-hidden", "true");
      }
    });
  }

  // -----------------------------
  // Search & filter
  // -----------------------------
  if (searchInput) searchInput.addEventListener("input", renderRecipes);
  if (categoryFilter) categoryFilter.addEventListener("change", renderRecipes);

  // -----------------------------
  // Admin login
  // -----------------------------
  const ADMIN_PASSWORD_HASH = "pinkrecipes".split("").reverse().join("");

  loginBtn?.addEventListener("click", () => {
    const entered = document.getElementById("adminPassword")?.value || "";
    if (entered.split("").reverse().join("") === ADMIN_PASSWORD_HASH) {
      isAdmin = true;
      localStorage.setItem("admin", "true");
      loginModal.classList.add("hidden");
      injectAdminUI();
      renderRecipes();
    } else loginError.style.display = "block";
  });

  if (isAdmin) injectAdminUI();

  // -----------------------------
  // Admin UI injection
  // -----------------------------
  function injectAdminUI() {
    if (document.getElementById("adminControlsContainer")) return;

    const container = document.createElement("div");
    container.id = "adminControlsContainer";
    container.style = "position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:1200;";

    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Add Recipe";
    addBtn.style = "background:#ff3ebf;color:white;padding:12px 16px;border-radius:14px;border:none;font-size:16px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.15);";
    addBtn.addEventListener("click", () => {
      editingDraftId = null;
      ensureAddModalControls();
      clearAddModal();
      addRecipeModal?.classList.remove("hidden");
    });

    const draftsBtn = document.createElement("button");
    draftsBtn.textContent = "Drafts";
    draftsBtn.style = "background:#ffd6ee;color:#a00064;padding:10px 16px;border-radius:12px;border:2px solid #ffb1db;font-size:14px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.12);";
    draftsBtn.addEventListener("click", openDraftsModal);

    container.appendChild(addBtn);
    container.appendChild(draftsBtn);
    document.body.appendChild(container);

    addLogoutButton();
  }

  function addLogoutButton() {
    if (!document.getElementById("adminControlsContainer")) return;
    if (document.getElementById("logoutBtn")) return;

    const logoutBtn = document.createElement("button");
    logoutBtn.id = "logoutBtn";
    logoutBtn.textContent = "Logout";
    logoutBtn.style = "background:#fff;color:#a00064;padding:10px;border-radius:12px;border:2px solid #ffb1db;cursor:pointer;";
    logoutBtn.addEventListener("click", () => {
      isAdmin = false;
      localStorage.removeItem("admin");
      location.reload();
    });

    document.getElementById("adminControlsContainer").appendChild(logoutBtn);
  }

  // -----------------------------
  // Draft modal
  // -----------------------------
  async function openDraftsModal() {
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

      document.getElementById("closeDraftsBtn").addEventListener("click", () => draftsModal.classList.add("hidden"));
      draftsModal.addEventListener("click", e => { if (e.target === draftsModal) draftsModal.classList.add("hidden"); });
    }

    const listContainer = draftsModal.querySelector("#draftsList");
    listContainer.innerHTML = "";

    await loadDrafts();

    if (!drafts.length) {
      const p = document.createElement("div");
      p.textContent = "No drafts yet.";
      p.style = "color:#666;padding:12px;";
      listContainer.appendChild(p);
    } else {
      drafts.forEach(d => {
        const row = document.createElement("div");
        row.style = "display:flex;align-items:center;justify-content:space-between;padding:8px;border-radius:10px;border:1px solid #ffe7f5;background:#fff9fc;";

        const titleDiv = document.createElement("div");
        titleDiv.textContent = d.title || "Untitled Draft";
        titleDiv.style = "font-weight:600;color:#a00064;";

        const actions = document.createElement("div");
        actions.style = "display:flex;gap:8px;";

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.style = "background:#ff3ebf;color:white;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;";
        editBtn.addEventListener("click", () => {
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
          await db.collection("drafts").doc(d.id).delete();
          openDraftsModal();
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        row.appendChild(titleDiv);
        row.appendChild(actions);
        listContainer.appendChild(row);
      });
    }

    draftsModal.classList.remove("hidden");
  }

  // -----------------------------
  // Add/Edit modal helpers
  // -----------------------------
  function makeRowInput(placeholder = "") {
    const row = document.createElement("div");
    row.className = "admin-row";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.value = "";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "✖";
    removeBtn.addEventListener("click", () => row.remove());

    row.appendChild(input);
    row.appendChild(removeBtn);
    return row;
  }

  function clearAddModal() {
    newTitle.value = "";
    newCategory.value = CATEGORIES[0];
    newImage.value = "";
    newDesc.value = "";
    ingredientsList.innerHTML = "";
    instructionsList.innerHTML = "";
    editingDraftId = null;
  }

  function populateAddModalFromDraft(draft) {
    clearAddModal();
    if (!draft) return;
    newTitle.value = draft.title || "";
    newCategory.value = draft.category || CATEGORIES[0];
    newImage.value = draft.image || "";
    newDesc.value = draft.description || "";

    (draft.ingredients || []).forEach(ing => {
      const r = makeRowInput("Ingredient");
      r.querySelector("input").value = ing;
      ingredientsList.appendChild(r);
    });

    (draft.instructions || []).forEach(step => {
      const r = makeRowInput("Step");
      r.querySelector("input").value = step;
      instructionsList.appendChild(r);
    });
  }

  saveRecipeBtn?.addEventListener("click", async () => {
    const recipeData = {
      title: newTitle.value.trim(),
      category: newCategory.value,
      image: newImage.value.trim(),
      description: newDesc.value.trim(),
      ingredients: [...ingredientsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean),
      instructions: [...instructionsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean),
      hidden: false
    };

    if (editingDraftId) {
      // save draft as recipe
      await db.collection("recipes").add(recipeData);
      await db.collection("drafts").doc(editingDraftId).delete();
      editingDraftId = null;
    } else if (editingRecipeIndex !== null) {
      const id = recipes[editingRecipeIndex].id;
      await db.collection("recipes").doc(id).set(recipeData);
      recipes[editingRecipeIndex] = { id, ...recipeData };
      editingRecipeIndex = null;
    } else {
      await db.collection("recipes").add(recipeData);
    }

    addRecipeModal.classList.add("hidden");
    clearAddModal();
    await loadRecipes();
  });

  addIngredientBtn?.addEventListener("click", () => ingredientsList.appendChild(makeRowInput("Ingredient")));
  addInstructionBtn?.addEventListener("click", () => instructionsList.appendChild(makeRowInput("Step")));

});
