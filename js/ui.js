import {
    calculateAttendance,
    calculateSafeLeaves,
    getAttendanceStatus
} from "./calculator.js";
import {
    addSubject,
    deleteSubject,
    loadSubjects,
    updateSubject
} from "./storage.js";

const SUBJECTS_PAGE = "subjects.html";

function getElement(id) {
    return document.getElementById(id);
}

function createSubjectId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readSubjectForm(form, id) {
    const values = {
        id,
        name: getElement(form.elements.subjectName.id).value.trim(),
        totalClasses: form.elements.totalClasses.valueAsNumber,
        attendedClasses: form.elements.attendedClasses.valueAsNumber,
        classesPerWeek: form.elements.classesPerWeek.valueAsNumber,
        remainingWeeks: form.elements.weeksRemaining.valueAsNumber,
        requiredAttendance: form.elements.requiredAttendance.valueAsNumber
    };

    if (!values.name) {
        throw new Error("Subject name is required.");
    }

    const numericValues = [
        values.totalClasses,
        values.attendedClasses,
        values.classesPerWeek,
        values.remainingWeeks,
        values.requiredAttendance
    ];

    if (numericValues.some(value => !Number.isFinite(value) || value < 0)) {
        throw new Error("Please enter valid non-negative numbers.");
    }

    if (values.attendedClasses > values.totalClasses) {
        throw new Error("Attended classes cannot exceed total classes.");
    }

    if (values.requiredAttendance <= 0 || values.requiredAttendance >= 100) {
        throw new Error("Required attendance must be between 1 and 99.");
    }

    return values;
}

function showFormError(error) {
    window.alert(error.message);
}

function createDetail(label, value) {
    const paragraph = document.createElement("p");
    paragraph.textContent = `${label}: `;

    const valueElement = document.createElement("span");
    valueElement.textContent = value;
    paragraph.appendChild(valueElement);

    return paragraph;
}

function createSubjectCard(subject) {
    const attendance = calculateAttendance(
        subject.attendedClasses,
        subject.totalClasses
    );
    const safeLeaveResult = calculateSafeLeaves(
        subject.attendedClasses,
        subject.totalClasses,
        subject.classesPerWeek,
        subject.remainingWeeks,
        subject.requiredAttendance
    );
    const status = getAttendanceStatus(attendance, subject.requiredAttendance);

    const card = document.createElement("article");
    card.className = "subject-card";
    card.dataset.subjectId = subject.id;

    const header = document.createElement("div");
    header.className = "subject-card-header";

    const name = document.createElement("h2");
    name.className = "subject-name";
    name.textContent = subject.name;

    const statusElement = document.createElement("span");
    statusElement.className = "attendance-status";
    statusElement.textContent = status;
    header.append(name, statusElement);

    const info = document.createElement("div");
    info.className = "attendance-info";

    const percentage = document.createElement("h3");
    percentage.className = "attendance-percentage";
    percentage.textContent = `${attendance}%`;
    info.appendChild(percentage);
    info.append(
        createDetail("Classes Attended", subject.attendedClasses),
        createDetail("Total Classes", subject.totalClasses),
        createDetail("Required Attendance", `${subject.requiredAttendance}%`),
        createDetail("Classes Per Week", subject.classesPerWeek),
        createDetail("Remaining Weeks", subject.remainingWeeks),
        createDetail("Safe Leave Count", safeLeaveResult.safeLeaves)
    );

    const actions = document.createElement("div");
    actions.className = "subject-management-actions";

    const editButton = document.createElement("a");
    editButton.className = "btn btn-edit edit-btn";
    editButton.href = `edit-subject.html?id=${encodeURIComponent(subject.id)}`;
    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-danger delete-btn";
    deleteButton.dataset.subjectId = subject.id;
    deleteButton.textContent = "Delete";

    actions.append(editButton, deleteButton);
    card.append(header, info, actions);

    return card;
}

export function renderSubjects() {
    const container = getElement("subjectsContainer");
    if (!container) {
        return;
    }

    container.replaceChildren();
    const subjects = loadSubjects();

    if (subjects.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";

        const message = document.createElement("p");
        message.textContent = "No subjects added yet.";

        const addButton = document.createElement("a");
        addButton.className = "btn btn-primary";
        addButton.href = "add-subject.html";
        addButton.textContent = "Add your first subject";

        emptyState.append(message, addButton);
        container.appendChild(emptyState);
        return;
    }

    subjects.forEach(subject => container.appendChild(createSubjectCard(subject)));
}

function createDashboardSubject(subject) {
    const attendance = calculateAttendance(
        subject.attendedClasses,
        subject.totalClasses
    );
    const safeLeaveResult = calculateSafeLeaves(
        subject.attendedClasses,
        subject.totalClasses,
        subject.classesPerWeek,
        subject.remainingWeeks,
        subject.requiredAttendance
    );
    const status = getAttendanceStatus(attendance, subject.requiredAttendance);

    const summary = document.createElement("article");
    summary.className = "subject-card";

    const header = document.createElement("div");
    header.className = "subject-card-header";

    const name = document.createElement("h3");
    name.className = "subject-name";
    name.textContent = subject.name;

    const statusElement = document.createElement("span");
    statusElement.className = "attendance-status";
    statusElement.textContent = status;
    header.append(name, statusElement);

    const details = document.createElement("div");
    details.className = "attendance-info";

    const percentage = document.createElement("h3");
    percentage.className = "attendance-percentage";
    percentage.textContent = `${attendance}%`;
    details.append(
        percentage,
        createDetail(
            "Classes Attended",
            `${subject.attendedClasses} / ${subject.totalClasses}`
        ),
        createDetail("Required Attendance", `${subject.requiredAttendance}%`),
        createDetail("Safe Leaves Remaining", safeLeaveResult.safeLeaves)
    );

    const actions = document.createElement("div");
    actions.className = "subject-management-actions";

    const editButton = document.createElement("a");
    editButton.className = "btn btn-edit";
    editButton.href = `edit-subject.html?id=${encodeURIComponent(subject.id)}`;
    editButton.textContent = "Edit";

    actions.appendChild(editButton);
    summary.append(header, details, actions);

    return summary;
}

function renderDashboardStats(subjects) {
    const counts = subjects.reduce((subjectCounts, subject) => {
        const attendance = calculateAttendance(
            subject.attendedClasses,
            subject.totalClasses
        );
        const status = getAttendanceStatus(attendance, subject.requiredAttendance);

        subjectCounts[status] += 1;
        return subjectCounts;
    }, { Safe: 0, Warning: 0, Critical: 0 });

    getElement("totalSubjects").textContent = subjects.length;
    getElement("safeSubjects").textContent = counts.Safe;
    getElement("warningSubjects").textContent = counts.Warning;
    getElement("atRiskSubjects").textContent = counts.Critical;
}

function renderDashboardSubjects() {
    const container = getElement("dashboardSubjects");
    if (!container) {
        return;
    }

    container.replaceChildren();
    const subjects = loadSubjects();
    renderDashboardStats(subjects);

    if (subjects.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No subjects added yet.";

        const addButton = document.createElement("a");
        addButton.className = "btn btn-primary";
        addButton.href = "add-subject.html";
        addButton.textContent = "Add your first subject";

        container.append(message, addButton);
        return;
    }

    subjects.forEach(subject => {
        container.appendChild(createDashboardSubject(subject));
    });
}

function setupSubjectsPage() {
    const container = getElement("subjectsContainer");
    if (!container) {
        return;
    }

    renderSubjects();
    container.addEventListener("click", event => {
        const deleteButton = event.target.closest(".delete-btn");
        if (!deleteButton) {
            return;
        }

        if (window.confirm("Delete this subject?")) {
            deleteSubject(deleteButton.dataset.subjectId);
            renderSubjects();
        }
    });
}

function setupAddForm() {
    const form = getElement("subjectForm");
    if (!form) {
        return;
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        try {
            addSubject(readSubjectForm(form, createSubjectId()));
            form.reset();
            renderSubjects();
            window.location.href = SUBJECTS_PAGE;
        } catch (error) {
            showFormError(error);
        }
    });
}

function populateEditForm(subject) {
    getElement("editSubjectId").value = subject.id;
    getElement("editSubjectName").value = subject.name;
    getElement("editTotalClasses").value = subject.totalClasses;
    getElement("editAttendedClasses").value = subject.attendedClasses;
    getElement("editClassesPerWeek").value = subject.classesPerWeek;
    getElement("editWeeksRemaining").value = subject.remainingWeeks;
    getElement("editRequiredAttendance").value = subject.requiredAttendance;
}

function setupEditForm() {
    const form = getElement("editSubjectForm");
    if (!form) {
        return;
    }

    const subjectId = new URLSearchParams(window.location.search).get("id");
    const subject = loadSubjects().find(item => item.id === subjectId);
    if (!subject) {
        window.alert("Subject not found.");
        window.location.href = SUBJECTS_PAGE;
        return;
    }

    populateEditForm(subject);

    form.addEventListener("submit", event => {
        event.preventDefault();

        try {
            updateSubject(readSubjectForm(form, subject.id));
            renderSubjects();
            window.location.href = SUBJECTS_PAGE;
        } catch (error) {
            showFormError(error);
        }
    });

    getElement("deleteSubjectBtn").addEventListener("click", () => {
        if (window.confirm("Delete this subject?")) {
            deleteSubject(subject.id);
            window.location.href = SUBJECTS_PAGE;
        }
    });
}

setupSubjectsPage();
setupAddForm();
setupEditForm();
renderDashboardSubjects();
