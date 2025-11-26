// -----------------------------
// DEBUGGING & SETUP
// -----------------------------
console.log("FULL admin + viewer script loaded");

// Replaces alert/confirm functions to avoid breaking the Canvas environment
const customAlert = (message) => {
    console.log(`[USER ALERT]: ${message}`);
    // NOTE: In a production environment, this should be replaced by a custom modal UI.
};

// -----------------------------
// FIREBASE IMPORTS (Updated to v11.6.1 standard)
// -----------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


// -----------------------------
// FIREBASE CONFIG & INITIALIZATION (Using environment variables)
// -----------------------------
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let app, db, auth;

if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Minimal Anonymous Auth setup
    signInAnonymously(auth).catch(error => {
        console.error("Anonymous sign-in failed:", error);
    });
} else {
    console.error("Firebase config is missing. Data persistence will not work.");
}


// -----------------------------
// ADMIN & COLOR STATE
// -----------------------------
let isAdmin = localStorage.getItem("admin") === "true";

const primaryPink = "#ff3ebf";
const mauvePink = "#b20050"; // Darker pink / Edit button background / Strong emphasis
const lightPink = "#ffd1e8"; // Used for delete button border in drafts modal
const lighterPinkBg = "#fff9fc"; // Used for draft item background

// Base styles for the buttons in the Drafts modal
const baseDraftButtonStyle = {
    fontFamily: "Poppins, sans-serif",
    fontSize: "14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    minWidth: "65px",
    boxSizing: "border-box",
    flexShrink: 0,
    transition: "background 0.15s ease",
};


// -----------------------------
// DEFAULT RECIPES (Unused, kept for reference)
// -----------------------------
const defaultRecipes = [
    {
        title: "Blueberry Pancakes",
        category: "Breakfast",
        image: "images/pancakes.jpg",
        description: "Fluffy homemade pancakes loaded with fresh blueberries.",
        ingredients: ["1 cup flour", "1 cup blueberries", "1 egg", "1 tbsp sugar", "1 cup milk"],
        instructions: ["Mix dry ingredients.", "Add egg & milk.", "Fold in blueberries.", "Cook on skillet until golden."],
        hidden: false
    },
    // ... (other default recipes)
];

// -----------------------------
// CATEGORIES
// -----------------------------
const CATEGORIES = ["Breakfast", "Meals", "Snacks", "Sides", "Dessert", "Drinks"];

// -----------------------------
// STATE VARIABLES
// -----------------------------
let recipes = [];
let drafts = [];
let editingDraftId = null; // ID of the draft being edited/loaded
let editingRecipeId = null; // ID of the recipe being edited/loaded

// -----------------------------
// DOM ELEMENTS (Declared globally or in the event listener scope)
// -----------------------------
let recipeGrid, searchInput, categoryFilter;
let addRecipeModal, newTitle, newCategory, newImage, newDesc, ingredientsList, instructionsList, saveRecipeBtn, addIngredientBtn, addInstructionBtn, saveDraftBtn;
let viewer, closeBtn;
let loginModal, loginBtn, loginError;
let draftsModal, draftsList, closeDraftsBtn;

document.addEventListener("DOMContentLoaded", async () => {
    // --- DOM ELEMENT Assignments ---
    recipeGrid = document.getElementById("recipeGrid");
    searchInput = document.getElementById("searchInput");
    categoryFilter = document.getElementById("categoryFilter");

    addRecipeModal = document.getElementById("addRecipeModal");
    newTitle = document.getElementById("newTitle");
    newCategory = document.getElementById("newCategory");
    newImage = document.getElementById("newImage");
    newDesc = document.getElementById("newDesc");
    ingredientsList = document.getElementById("ingredientsList");
    instructionsList = document.getElementById("instructionsList");
    saveRecipeBtn = document.getElementById("saveRecipeBtn");
    addIngredientBtn = document.getElementById("addIngredientBtn");
    addInstructionBtn = document.getElementById("addInstructionBtn");
    saveDraftBtn = document.getElementById("saveDraftBtn");

    viewer = document.getElementById("recipeModal");
    closeBtn = document.getElementById("closeViewerBtn");

    loginModal = document.getElementById("loginModal");
    loginBtn = document.getElementById("loginBtn");
    loginError = document.getElementById("loginError");

    draftsModal = document.getElementById("draftsModal");
    draftsList = document.getElementById("draftsList");
    closeDraftsBtn = document.getElementById("closeDraftsBtn");

    // --- Apply Styles ---
    if (saveRecipeBtn) {
        Object.assign(saveRecipeBtn.style, {
            background: primaryPink,
            color: "white",
            border: "none",
            padding: "14px 18px",
            fontSize: "18px",
            fontFamily: "Poppins, San-Serif",
            borderRadius: "12px",
            width: "100%",
            cursor: "pointer",
            marginBottom: "15px",
            marginTop: "15px",
            fontWeight: "bold",
        });
    }

    if (searchInput) {
        Object.assign(searchInput.style, {
            fontFamily: "Poppins, sans-serif",
        });
    }

    if (categoryFilter) {
        Object.assign(categoryFilter.style, {
            fontFamily: "Poppins, sans-serif",
            color: primaryPink,
            fontWeight: "bold",
            border: `2px solid ${primaryPink}`,
            borderRadius: "8px",
            padding: "8px 12px",
        });
    }

    // APPLY POPPINS TO ADD RECIPE MODAL INPUTS
    const inputStyle = {
        fontFamily: "Poppins, sans-serif",
        borderRadius: "8px",
        padding: "10px",
        border: "1px solid #ccc",
        width: "calc(100% - 22px)",
        boxSizing: "border-box",
    };

    if (newTitle) Object.assign(newTitle.style, inputStyle);
    if (newCategory) Object.assign(newCategory.style, inputStyle);
    if (newImage) Object.assign(newImage.style, inputStyle);
    if (newDesc) Object.assign(newDesc.style, inputStyle, { height: "100px" });


    // -----------------------------
    // CATEGORY DROPDOWN
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
    // FIRESTORE FETCH RECIPES & DRAFTS
    // -----------------------------
    async function loadRecipes() {
        if (!db) return;
        const recipesCol = collection(db, "recipes");
        const q = query(recipesCol, orderBy("title"));
        try {
            const snapshot = await getDocs(q);
            recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderRecipes();
        } catch (e) {
            console.error("Error loading recipes:", e);
        }
    }

    async function loadDrafts() {
        if (!db) return;
        const draftsCol = collection(db, "drafts");
        // Using "timestamp" is okay for drafts as sorting is secondary
        const q = query(draftsCol, orderBy("timestamp", "desc"));
        try {
            const snapshot = await getDocs(q);
            drafts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error("Error loading drafts:", e);
        }
    }

    // -----------------------------
    // RENDER RECIPES (No changes needed here)
    // -----------------------------
    function renderRecipes() {
        if (!recipeGrid) return;
        const searchTerm = (searchInput?.value || "").toLowerCase();
        const selectedCategory = categoryFilter?.value || "all";

        recipeGrid.innerHTML = "";

        recipes.forEach(recipe => {
            if (!isAdmin && recipe.hidden) return;

            if (selectedCategory !== "all" && recipe.category !== selectedCategory) return;
            if (!recipe.title.toLowerCase().includes(searchTerm) &&
                !recipe.description.toLowerCase().includes(searchTerm)) return;

            const card = document.createElement("div");
            card.className = "card";
            if (recipe.hidden && isAdmin) card.classList.add("hidden-recipe-admin");

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

            // Info icon
            const infoIcon = document.createElement("div");
            infoIcon.className = "card-info-icon";
            infoIcon.textContent = "i";
            const tooltip = document.createElement("div");
            tooltip.className = "card-info-tooltip";
            tooltip.textContent = recipe.credits || "No credits added.";
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
    // OPEN RECIPE MODAL (No critical changes, just customAlert for delete)
    // -----------------------------
    function openRecipeModal(recipe) {
        if (!recipe || !viewer) return;

        const modalImg = document.getElementById("modalImage");
        const modalTitle = document.getElementById("modalTitle");
        const modalCategory = document.getElementById("modalCategory");
        const modalDesc = document.getElementById("modalDescription");
        const modalIngredients = document.getElementById("modalIngredients");
        const modalInstructions = document.getElementById("modalInstructions");
        const modalEditBtn = document.getElementById("modalEditBtn");
        const modalDeleteBtn = document.getElementById("modalDeleteBtn");
        const hideBtn = document.getElementById("modalHideBtn");

        editingRecipeId = recipe.id;

        if (modalImg) {
            modalImg.src = recipe.image || "";
            modalImg.alt = recipe.title || "";
        }
        if (modalTitle) modalTitle.textContent = recipe.title || "";
        if (modalCategory) modalCategory.textContent = recipe.category || "";
        if (modalDesc) modalDesc.textContent = recipe.description || "";

        if (modalIngredients) {
            modalIngredients.innerHTML = "";
            (recipe.ingredients || []).forEach(i => {
                const li = document.createElement("li");
                li.textContent = i;
                modalIngredients.appendChild(li);
            });
        }

        if (modalInstructions) {
            modalInstructions.innerHTML = "";
            (recipe.instructions || []).forEach(s => {
                const li = document.createElement("li");
                li.textContent = s;
                modalInstructions.appendChild(li);
            });
        }

        if (isAdmin) {
            modalEditBtn.style.display = "inline-block";
            modalDeleteBtn.style.display = "inline-block";
            hideBtn.style.display = "inline-block";

            modalEditBtn.onclick = () => {
                editingRecipeId = recipe.id;
                editingDraftId = null;
                populateAddModalFromRecipeOrDraft(recipe);
                ensureAddModalControls();
                addRecipeModal.classList.remove("hidden");
                viewer.style.display = "none";
            };

            modalDeleteBtn.onclick = async () => {
                // NOTE: Using native confirm as a placeholder for a custom UI modal, 
                // but alert/confirm are generally forbidden in the environment.
                if (!confirm(`Delete "${recipe.title}"?`)) return;
                if (db) {
                     await deleteDoc(doc(db, "recipes", recipe.id));
                     await loadRecipes();
                } else {
                    console.error("Database not initialized.");
                }
                viewer.style.display = "none";
            };

            hideBtn.textContent = recipe.hidden ? "Unhide" : "Hide";
            hideBtn.onclick = async e => {
                e.stopPropagation();
                if (db) {
                    await updateDoc(doc(db, "recipes", recipe.id), { hidden: !recipe.hidden });
                    await loadRecipes();
                } else {
                    console.error("Database not initialized.");
                }
                viewer.style.display = "none";
            };
        } else {
            modalEditBtn.style.display = "none";
            modalDeleteBtn.style.display = "none";
            hideBtn.style.display = "none";
        }

        viewer.style.display = "flex";
    }

    // -----------------------------
    // CLOSE MODAL
    // -----------------------------
    if (closeBtn) {
        closeBtn.addEventListener("click", () => { viewer.style.display = "none"; });
        viewer.addEventListener("click", e => { if (e.target === viewer) viewer.style.display = "none"; });
    }
    if (addRecipeModal) {
        addRecipeModal.addEventListener("click", e => {
            if (e.target === addRecipeModal) {
                // NOTE: Using native confirm as a placeholder for a custom UI modal
                if (confirm("Discard unsaved changes and close?")) {
                    clearAddModal();
                    addRecipeModal.classList.add("hidden");
                }
            }
        });
    }

    // -----------------------------
    // SEARCH & FILTER
    // -----------------------------
    searchInput?.addEventListener("input", renderRecipes);
    categoryFilter?.addEventListener("change", renderRecipes);

    // -----------------------------
    // ADMIN LOGIN
    // -----------------------------
    const ADMIN_PASSWORD_HASH = "pinkrecipes".split("").reverse().join("");
    function openLoginModal() { loginModal?.classList.remove("hidden"); loginError.style.display = "none"; }

    loginBtn?.addEventListener("click", () => {
        const entered = document.getElementById("adminPassword")?.value || "";
        // WARNING: This is a trivial password hash, not secure.
        if (entered.split("").reverse().join("") === ADMIN_PASSWORD_HASH) {
            isAdmin = true;
            localStorage.setItem("admin", "true");
            injectAdminUI();
            renderRecipes();
            loginModal.classList.add("hidden");
        } else loginError.style.display = "block";
    });

    document.addEventListener("keydown", e => {
        const key = e.key?.toLowerCase();
        const mac = navigator.userAgent.includes("Mac");
        if ((mac && e.metaKey && e.shiftKey && key === "m") || (!mac && e.ctrlKey && e.shiftKey && key === "m")) openLoginModal();
    });

    if (isAdmin) injectAdminUI();

    // -----------------------------
    // ADMIN UI
    // -----------------------------
    function ensureAddModalControls() {
        if (!addRecipeModal) return;
        const modalContent = addRecipeModal.querySelector(".modal-content");
        if (!modalContent) return;
        const saveBtn = modalContent.querySelector("#saveRecipeBtn");

        // 1. Ensure the Save Draft button exists and has the correct listener
        let saveDraftBtnElement = modalContent.querySelector("#saveDraftBtn");
        if (!saveDraftBtnElement) {
            saveDraftBtnElement = document.createElement("button");
            saveDraftBtnElement.id = "saveDraftBtn";
            saveDraftBtnElement.type = "button";
            saveDraftBtnElement.innerText = "Save Draft";
            if (saveBtn) {
                saveBtn.parentNode.insertBefore(saveDraftBtnElement, saveBtn);
            } else {
                modalContent.appendChild(saveDraftBtnElement);
            }
        }

        // Listener Cleanup and Reattachment for Save Draft
        // This ensures only one listener is active after modal population/editing
        const newDraftBtn = saveDraftBtnElement.cloneNode(true);
        saveDraftBtnElement.parentNode.replaceChild(newDraftBtn, saveDraftBtnElement);
        newDraftBtn.addEventListener("click", saveDraft);
        saveDraftBtnElement = newDraftBtn;

        // Apply matching styles (Primary Pink: #ff3ebf)
        Object.assign(saveDraftBtnElement.style, {
            background: primaryPink,
            color: "white",
            border: "none",
            padding: "14px 18px",
            fontSize: "18px",
            fontFamily: "Poppins, San-Serif",
            borderRadius: "12px",
            width: "100%",
            cursor: "pointer",
            marginBottom: "15px",
            marginTop: "15px",
            fontWeight: "bold",
        });

        // 3. Big X close button
        if (!modalContent.querySelector(".add-modal-close-x")) {
            const x = document.createElement("button");
            x.className = "add-modal-close-x";
            x.type = "button";
            x.innerText = "✖";
            x.title = "Close and discard";
            x.style = "position:absolute;right:18px;top:14px;background:transparent;border:none;font-size:22px;cursor:pointer;color:#a00;";
            x.addEventListener("click", () => {
                // NOTE: Using native confirm as a placeholder for a custom UI modal
                if (confirm("Discard changes and close?")) {
                    clearAddModal();
                    addRecipeModal.classList.add("hidden");
                }
            });
            modalContent.style.position = modalContent.style.position || "relative";
            modalContent.appendChild(x);
        }
    }

    function injectAdminUI() {
        if (document.getElementById("adminControlsContainer")) return;

        const container = document.createElement("div");
        container.id = "adminControlsContainer";
        container.style = "position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:1200;";

        const addBtn = document.createElement("button");
        addBtn.textContent = "+ Add Recipe";
        Object.assign(addBtn.style, { background: primaryPink, color: "white", padding: "12px 16px", borderRadius: "14px", border: "none", fontSize: "16px", cursor: "pointer", fontFamily: "Poppins, sans-serif", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" });

        addBtn.onclick = () => { editingDraftId = null; editingRecipeId = null; ensureAddModalControls(); clearAddModal(); addRecipeModal.classList.remove("hidden"); };

        const draftsBtn = document.createElement("button");
        draftsBtn.textContent = "Drafts";
        Object.assign(draftsBtn.style, { background: primaryPink, color: "white", padding: "12px 16px", borderRadius: "14px", border: "none", fontSize: "16px", cursor: "pointer", fontFamily: "Poppins, sans-serif", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" });
        draftsBtn.onclick = openDraftsModal;

        container.appendChild(addBtn);
        container.appendChild(draftsBtn);
        document.body.appendChild(container);
        addLogoutButton(container);
    }

    function addLogoutButton(containerElement) {
        if (!containerElement) return;
        if (containerElement.querySelector("#logoutBtn")) return;

        const logoutBtn = document.createElement("button");
        logoutBtn.id = "logoutBtn";
        logoutBtn.textContent = "Logout";
        Object.assign(logoutBtn.style, { background: primaryPink, color: "white", padding: "12px 16px", borderRadius: "14px", border: "none", fontSize: "16px", cursor: "pointer", fontFamily: "Poppins, sans-serif", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" });
        logoutBtn.onclick = () => {
            isAdmin = false;
            localStorage.removeItem("admin");
            window.location.href = window.location.href.split('#')[0];
        };

        containerElement.appendChild(logoutBtn);
    }

    // -----------------------------
    // MODAL HELPERS (No critical changes)
    // -----------------------------
    function makeRowInput(placeholder = "") {
        const row = document.createElement("div");
        row.className = "admin-row";
        row.style.display = "flex"; // Ensure flex layout for button alignment
        row.style.alignItems = "center";
        const input = document.createElement("input");
        input.type = "text"; input.placeholder = placeholder; input.value = "";

        Object.assign(input.style, {
            fontFamily: "Poppins, sans-serif",
            borderRadius: "8px",
            padding: "8px 10px",
            border: "1px solid #ccc",
            flexGrow: 1,
            margin: "5px 0",
        });

        const removeBtn = document.createElement("button");
        removeBtn.type = "button"; removeBtn.textContent = "✖";
        Object.assign(removeBtn.style, {
            marginLeft: "8px",
            background: "transparent",
            border: "none",
            color: primaryPink,
            fontWeight: "700",
            fontSize: "18px",
            cursor: "pointer",
            fontFamily: "Poppins, sans-serif",
        });
        removeBtn.onclick = () => row.remove();
        row.appendChild(input); row.appendChild(removeBtn);
        return row;
    }

    function clearAddModal() {
        newTitle.value = ""; newCategory.value = CATEGORIES[0]; newImage.value = ""; newDesc.value = "";
        ingredientsList.innerHTML = ""; instructionsList.innerHTML = "";
    }

    function populateAddModalFromRecipeOrDraft(d) {
        clearAddModal();
        newTitle.value = d.title || ""; newCategory.value = d.category || CATEGORIES[0]; newImage.value = d.image || ""; newDesc.value = d.description || "";
        (d.ingredients || []).forEach(i => { const r = makeRowInput("Ingredient"); r.querySelector("input").value = i; ingredientsList.appendChild(r); });
        (d.instructions || []).forEach(s => { const r = makeRowInput("Step"); r.querySelector("input").value = s; instructionsList.appendChild(r); });
        
        if (d.id && drafts.some(draft => draft.id === d.id)) {
            editingDraftId = d.id;
            editingRecipeId = d.forRecipeId || null;
        } else {
            editingDraftId = null;
            editingRecipeId = d.id;
        }
    }

    addIngredientBtn?.addEventListener("click", () => ingredientsList.appendChild(makeRowInput("Ingredient")));
    addInstructionBtn?.addEventListener("click", () => instructionsList.appendChild(makeRowInput("Step")));


    // -----------------------------
    // SAVE DRAFT (Replaced alert with console.log)
    // -----------------------------
    async function saveDraft() {
        if (!db) return customAlert("Cannot save draft: Database not initialized.");

        const title = newTitle.value.trim() || `Draft: ${new Date().toLocaleTimeString()}`;
        const category = newCategory.value || CATEGORIES[0];
        const image = newImage.value.trim();
        const description = newDesc.value.trim();

        const ingredients = [...ingredientsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
        const instructions = [...instructionsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);

        const data = {
            title,
            category,
            image,
            description,
            ingredients,
            instructions,
            timestamp: serverTimestamp(),
            forRecipeId: editingRecipeId || null,
        };

        let docRef;
        try {
            if (editingDraftId) {
                docRef = doc(db, "drafts", editingDraftId);
                await updateDoc(docRef, data);
                console.log(`Draft "${title}" updated!`);
            } else {
                docRef = doc(collection(db, "drafts"));
                await setDoc(docRef, data);
                editingDraftId = docRef.id;
                console.log(`Draft "${title}" saved!`);
            }
        } catch (e) {
            console.error("Error saving draft:", e);
        }

        await loadDrafts();
    }

    // -----------------------------
    // SAVE RECIPE (Replaced alert with console.log)
    // -----------------------------
    saveRecipeBtn?.addEventListener("click", async () => {
        if (!db) return customAlert("Cannot save recipe: Database not initialized.");

        const title = newTitle.value.trim(), category = newCategory.value || CATEGORIES[0],
            image = newImage.value.trim(), description = newDesc.value.trim();
        if (!title || !image || !description) return customAlert("Fill title, image, description.");

        const ingredients = [...ingredientsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
        const instructions = [...instructionsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);

        const data = { title, category, image, description, ingredients, instructions, hidden: false, credits: "", timestamp: serverTimestamp() };

        let recipeDocId = editingRecipeId;
        try {
            if (editingRecipeId) {
                await setDoc(doc(db, "recipes", editingRecipeId), data);
            } else {
                const newDoc = doc(collection(db, "recipes"));
                await setDoc(newDoc, data);
                recipeDocId = newDoc.id;
            }

            // After successfully saving/updating the recipe, delete the associated draft if one exists
            if (editingDraftId) {
                await deleteDoc(doc(db, "drafts", editingDraftId));
                await loadDrafts(); // Update drafts list
            }
        } catch (e) {
            console.error("Error saving recipe:", e);
        }

        clearAddModal();
        editingRecipeId = null;
        editingDraftId = null;
        addRecipeModal.classList.add("hidden");
        await loadRecipes();
    });

    // -----------------------------
    // DRAFTS MODAL (FIXED SYNTAX AND STYLES)
    // -----------------------------
    async function openDraftsModal() {
        if (!draftsModal) return;

        await loadDrafts();
        draftsList.innerHTML = "";

        // --- DRAFTS MODAL CLOSE BUTTON INJECTION ---
        const modalContent = draftsModal.querySelector(".modal-content");
        if (modalContent && !modalContent.querySelector(".draft-modal-close-x")) {
            const x = document.createElement("button");
            x.className = "draft-modal-close-x";
            x.type = "button";
            x.innerText = "✖";
            x.title = "Close Drafts";

            Object.assign(x.style, {
                position: "absolute",
                right: "18px",
                top: "14px",
                background: "transparent",
                border: "none",
                fontSize: "22px",
                cursor: "pointer",
                color: "#669",
                zIndex: "100",
            });

            x.addEventListener("click", () => {
                draftsModal.classList.add("hidden");
            });

            modalContent.style.position = modalContent.style.position || "relative";
            modalContent.appendChild(x);
        }
        // --- END DRAFTS MODAL CLOSE BUTTON INJECTION ---

        if (drafts.length === 0) {
            draftsList.innerHTML = "<p style='font-family: Poppins, sans-serif; text-align: center;'>No drafts saved.</p>";
        } else {
            const ul = document.createElement("ul");
            ul.className = "drafts-list";

            drafts.forEach(draft => {
                const li = document.createElement("li");
                li.className = "draft-item";

                Object.assign(li.style, {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    borderRadius: "10px",
                    border: `1px solid ${lightPink}`,
                    background: lighterPinkBg,
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "16px",
                    marginBottom: "10px",
                });

                li.innerHTML = `
                    <div class="draft-title-container" style="font-weight: 600; color: ${mauvePink}; flex: 1; margin-right: 15px; overflow: hidden; text-overflow: ellipsis;">
                        <span>${draft.title || 'Untitled Draft'}</span>
                    </div>
                    <div class="draft-actions" style="display: flex; gap: 10px; flex-shrink: 0; align-items: center;">
                        <button class="load-draft-btn" data-id="${draft.id}">Load</button>
                        <button class="delete-draft-btn" data-id="${draft.id}">Delete</button>
                    </div>
                `;
                ul.appendChild(li);

                // FIX: Correcting the syntax error and applying the styles
                const loadBtn = li.querySelector(".load-draft-btn");
                if (loadBtn) Object.assign(loadBtn.style, baseDraftButtonStyle, {
                    background: primaryPink, // Primary Pink background
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                });
                loadBtn.addEventListener("click", () => {
                    const d = drafts.find(d => d.id === draft.id);
                    if (d) {
                        populateAddModalFromRecipeOrDraft(d);
                        ensureAddModalControls();
                        draftsModal.classList.add("hidden");
                        addRecipeModal.classList.remove("hidden");
                    }
                });


                const deleteBtn = li.querySelector(".delete-draft-btn");
                if (deleteBtn) Object.assign(deleteBtn.style, baseDraftButtonStyle, {
                    // This section now uses correct object literal syntax (colons and string values)
                    background: "transparent",
                    color: mauvePink,
                    border: `2px solid ${lightPink}`,
                    padding: "6px 10px",
                });
                deleteBtn.addEventListener("click", async () => {
                    // NOTE: Using native confirm as a placeholder for a custom UI modal
                    if (!confirm(`Are you sure you want to delete the draft: "${draft.title}"?`)) return;
                    if (db) {
                        await deleteDoc(doc(db, "drafts", draft.id));
                        await openDraftsModal(); // Reload the modal content after deletion
                        console.log(`Draft "${draft.title}" deleted.`);
                    } else {
                        console.error("Database not initialized.");
                    }
                });

            });
            draftsList.appendChild(ul);
        }

        draftsModal.classList.remove("hidden");
    }


    // -----------------------------
    // INITIAL LOAD
    // -----------------------------
    await loadRecipes();

}); // end DOMContentLoaded
