const SUBJECTS_STORAGE_KEY = "attendanceSubjects";

function getStorage() {
    if (typeof globalThis.localStorage === "undefined") {
        throw new Error("Local Storage is not available.");
    }

    return globalThis.localStorage;
}

function readSubjects() {
    const storedSubjects = getStorage().getItem(SUBJECTS_STORAGE_KEY);

    if (storedSubjects === null) {
        return [];
    }

    try {
        const subjects = JSON.parse(storedSubjects);
        if (!Array.isArray(subjects)) {
            throw new Error("Stored subjects must be an array.");
        }
        return subjects;
    } catch (error) {
        throw new Error(`Unable to load subjects: ${error.message}`);
    }
}

/**
 * Returns all subjects saved in Local Storage.
 */
export function loadSubjects() {
    return readSubjects();
}

/**
 * Stores the complete subjects array in Local Storage.
 */
export function saveSubjects(subjects) {
    if (!Array.isArray(subjects)) {
        throw new TypeError("Subjects must be an array.");
    }

    getStorage().setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
}

/**
 * Adds a subject to Local Storage.
 */
export function addSubject(subject) {
    if (subject === null || typeof subject !== "object") {
        throw new TypeError("Subject must be an object.");
    }

    const subjects = loadSubjects();
    subjects.push(subject);
    saveSubjects(subjects);
}

/**
 * Updates a subject identified by its unique id.
 */
export function updateSubject(updatedSubject) {
    if (updatedSubject === null
        || typeof updatedSubject !== "object"
        || updatedSubject.id === undefined) {
        throw new TypeError("Updated subject must include an id.");
    }

    const subjects = loadSubjects();
    const subjectIndex = subjects.findIndex(subject => subject.id === updatedSubject.id);

    if (subjectIndex !== -1) {
        subjects[subjectIndex] = updatedSubject;
        saveSubjects(subjects);
    }
}

/**
 * Deletes a subject identified by its id.
 */
export function deleteSubject(subjectId) {
    const subjects = loadSubjects();
    saveSubjects(subjects.filter(subject => subject.id !== subjectId));
}

/**
 * Removes all saved subjects.
 */
export function clearAllSubjects() {
    getStorage().removeItem(SUBJECTS_STORAGE_KEY);
}