const templates = [
  {
    id: "weekly-groceries",
    name: "Weekly groceries",
    description: "A simple list for your weekly supermarket run.",
    items: ["Milk", "Bread", "Fruit", "Vegetables", "Eggs"],
  },
  {
    id: "travel-bag",
    name: "Travel bag",
    description: "A packing checklist for short trips.",
    items: ["Passport", "Phone charger", "Toothbrush", "Tickets", "Water bottle"],
  },
  {
    id: "study-session",
    name: "Study session",
    description: "Everything needed for a focused study block.",
    items: ["Review notes", "Complete one exercise", "Summarize key points", "Take a break"],
  },
];

const storageKey = "dont-letme-forget.active-lists";

const templateScreen = document.getElementById("template-screen");
const templateDetailScreen = document.getElementById("template-detail-screen");
const taskListScreen = document.getElementById("task-list-screen");
const templateMenu = document.getElementById("template-menu");
const templateDetail = document.getElementById("template-detail");
const taskListDetail = document.getElementById("task-list-detail");
const backToTemplatesButton = document.getElementById("back-to-templates");
const backToTemplateDetailButton = document.getElementById("back-to-template-detail");

let activeLists = readActiveLists();
let selectedTemplateId = null;

function readActiveLists() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function saveActiveLists() {
  window.localStorage.setItem(storageKey, JSON.stringify(activeLists));
}

function showScreen(screenName) {
  templateScreen.classList.toggle("hidden", screenName !== "templates");
  templateDetailScreen.classList.toggle("hidden", screenName !== "template-detail");
  taskListScreen.classList.toggle("hidden", screenName !== "task-list");
}

function renderTemplateMenu() {
  templateMenu.innerHTML = templates
    .map(
      (template) => `
        <button class="template-card" type="button" data-template-id="${template.id}">
          <h2>${template.name}</h2>
          <p>${template.description}</p>
          <p class="muted">${template.items.length} items in this template</p>
        </button>
      `,
    )
    .join("");
}

function createListFromTemplate(template) {
  const listsForTemplate = activeLists.filter((list) => list.templateId === template.id).length + 1;
  const createdAt = Date.now();

  const list = {
    id: `${template.id}-${createdAt}`,
    templateId: template.id,
    title: `${template.name} #${listsForTemplate}`,
    items: template.items.map((item, index) => ({
      id: `${template.id}-${createdAt}-${index}`,
      label: item,
      completed: false,
    })),
  };

  activeLists = [list, ...activeLists];
  saveActiveLists();
  renderTemplateDetail(template.id);
  renderTaskList(list.id);
}

function renderTemplateDetail(templateId) {
  const template = templates.find((entry) => entry.id === templateId);
  if (!template) {
    return;
  }

  selectedTemplateId = templateId;

  const listsForTemplate = activeLists.filter((list) => list.templateId === templateId);

  templateDetail.innerHTML = `
    <div class="panel-header">
      <div>
        <h2>${template.name}</h2>
        <p>${template.description}</p>
      </div>
      <button id="create-list" class="primary-button" type="button">Create new list</button>
    </div>

    <h3>Template items</h3>
    <ul class="template-items">
      ${template.items.map((item) => `<li>${item}</li>`).join("")}
    </ul>

    <h3>Active lists</h3>
    <div class="active-lists">
      ${
        listsForTemplate.length
          ? listsForTemplate
              .map((list) => {
                const completedCount = list.items.filter((item) => item.completed).length;
                return `
                  <button class="active-list-card" type="button" data-list-id="${list.id}">
                    <h3>${list.title}</h3>
                    <p>${completedCount}/${list.items.length} items completed</p>
                  </button>
                `;
              })
              .join("")
          : '<p class="muted">No active lists yet. Create one from this template.</p>'
      }
    </div>
  `;

  document.getElementById("create-list").addEventListener("click", () => createListFromTemplate(template));

  templateDetail.querySelectorAll("[data-list-id]").forEach((button) => {
    button.addEventListener("click", () => renderTaskList(button.dataset.listId));
  });

  showScreen("template-detail");
}

function renderTaskList(listId) {
  const list = activeLists.find((entry) => entry.id === listId);
  if (!list) {
    return;
  }

  const completedCount = list.items.filter((item) => item.completed).length;

  taskListDetail.innerHTML = `
    <div class="task-list-header">
      <div>
        <h2>${list.title}</h2>
        <p class="muted">${completedCount}/${list.items.length} items completed</p>
      </div>
      <button id="duplicate-list" class="secondary-button" type="button">Create another list</button>
    </div>

    <div class="task-items">
      ${list.items
        .map(
          (item) => `
            <label class="task-item${item.completed ? " completed" : ""}">
              <input type="checkbox" data-task-item-id="${item.id}" ${item.completed ? "checked" : ""} />
              <span>${item.label}</span>
            </label>
          `,
        )
        .join("")}
    </div>
  `;

  taskListDetail.querySelectorAll("[data-task-item-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => toggleTaskItem(listId, checkbox.dataset.taskItemId));
  });

  document.getElementById("duplicate-list").addEventListener("click", () => {
    const template = templates.find((entry) => entry.id === list.templateId);
    if (template) {
      createListFromTemplate(template);
    }
  });

  showScreen("task-list");
}

function toggleTaskItem(listId, itemId) {
  activeLists = activeLists.map((list) => {
    if (list.id !== listId) {
      return list;
    }

    return {
      ...list,
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    };
  });

  saveActiveLists();
  renderTaskList(listId);
}

templateMenu.addEventListener("click", (event) => {
  const templateButton = event.target.closest("[data-template-id]");
  if (templateButton) {
    renderTemplateDetail(templateButton.dataset.templateId);
  }
});

backToTemplatesButton.addEventListener("click", () => {
  showScreen("templates");
});

backToTemplateDetailButton.addEventListener("click", () => {
  if (selectedTemplateId) {
    renderTemplateDetail(selectedTemplateId);
  }
});

renderTemplateMenu();
showScreen("templates");
