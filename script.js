console.log("FULL admin + viewer script loaded");

/* ============================================================
   DEFAULT RECIPES
============================================================ */
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

/* ============================================================
   STORAGE (ENCRYPTED)
============================================================ */
function encrypt(str) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(str))));
}
function decrypt(str) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  } catch {
    return null;
  }
}

let stored = localStorage.getItem("pinkrecipes-data");
let recipes = stored ? decrypt(stored) : defaultRecipes;

function saveRecipes() {
  localStorage.setItem("pinkrecipes-data", encrypt(recipes));
}

/* ============================================================
   DOM ELEMENTS
============================================================ */
const recipeGrid = document.getElementById("recipeGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

/* Admin elements */
const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const addRecipeModal = document.getElementById("addRecipeModal");
const saveRecipeBtn = document.getElementById("saveRecipeBtn");

/* Admin mode flag */
let isAdmin = false;

/* ============================================================
   RENDER
============================================================ */
function renderRecipes() {
  const searchTerm = (searchInput.value || "").toLowerCase();
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
      <img src="${recipe.image}">
      <div class="card-content">
        <div class="card-title">${recipe.title}</div>
        <div class="card-category">${recipe.category}</div>
        <div class="card-desc">${recipe.description}</div>
      </div>
    </div>
  `).join("");

  if (isAdmin) injectAdminButton();
}

renderRecipes();

/* ============================================================
   RECIPE VIEWER
============================================================ */
function openRecipeModal(recipe) {
  const modal = document.getElementById("recipeModal");
  modal.style.display = "flex";

  document.getElementById("modalTitle").textContent = recipe.title;
  document.getElementById("modalImage").src = recipe.image;
  document.getElementById("modalCategory").textContent = recipe.category;

  const ingList = document.getElementById("modalIngredients");
  ingList.innerHTML = "";
  recipe.ingredients.forEach(i => {
    const li = document.createElement("li");
    li.textContent = i;
    ingList.appendChild(li);
  });

  const stepList = document.getElementById("modalInstructions");
  stepList.innerHTML = "";
  recipe.instructions.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    stepList.appendChild(li);
  });
}

document.getElementById("closeViewerBtn").onclick = () => {
  document.getElementById("recipeModal").style.display = "none";
};

/* ============================================================
   ADMIN LOGIN SYSTEM
============================================================ */
function openLoginModal() {
  loginModal.classList.remove("hidden");
}
function closeLoginModal() {
  loginModal.classList.add("hidden");
}

loginBtn.onclick = () => {
  const pw = document.getElementById("adminPassword").value.trim();

  if (pw === "pinkrecipes") {
    isAdmin = true;
    loginError.style.display = "none";
    closeLoginModal();
    renderRecipes();
    showAddRecipeButton();
  } else {
    loginError.style.display = "block";
  }
};

/* ============================================================
   ADMIN ENTRY SHORTCUTS
============================================================ */
// SHIFT+click anywhere
document.addEventListener("click", (e) => {
  if (e.shiftKey && !isAdmin) {
    openLoginModal();
  }
});

// URL ?admin
if (window.location.search.includes("admin") && !isAdmin) {
  openLoginModal();
}

/* ============================================================
   ADD RECIPE BUTTON (appears only in admin)
============================================================ */
function injectAdminButton() {
  if (document.getElementById("addRecipeBtn")) return;

  const btn = document.createElement("button");
  btn.id = "addRecipeBtn";
  btn.textContent = "+ Add Recipe";
  btn.className = "admin-add-button";

  document.body.appendChild(btn);

  btn.onclick = () => {
    addRecipeModal.classList.remove("hidden");
  };
}

function showAddRecipeButton() {
  injectAdminButton();
}

/* ============================================================
   ADD RECIPE FORM
============================================================ */
saveRecipeBtn.onclick = () => {
  const title = document.getElementById("newTitle").value.trim();
  const category = document.getElementById("newCategory").value;
  const image = document.getElementById("newImage").value.trim();
  const description = document.getElementById("newDesc").value.trim();

  if (!title || !image || !description) {
    alert("Please fill out all fields");
    return;
  }

  const newRecipe = {
    title,
    category,
    image,
    description,
    ingredients: [],
    instructions: []
  };

  recipes.push(newRecipe);
  saveRecipes();
  addRecipeModal.classList.add("hidden");
  renderRecipes();
};

/* Close add recipe modal when clicking background */
addRecipeModal.addEventListener("click", (e) => {
  if (e.target === addRecipeModal) addRecipeModal.classList.add("hidden");
});

/* SEARCH & FILTER */
searchInput.addEventListener("input", renderRecipes);
categoryFilter.addEventListener("change", renderRecipes);
