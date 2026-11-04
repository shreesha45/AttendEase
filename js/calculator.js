function isNonNegativeFiniteNumber(value) {
    return Number.isFinite(value) && value >= 0;
}

function isValidClassCount(value) {
    return Number.isInteger(value) && value >= 0;
}

/**
 * Calculates the current attendance percentage.
 */
export function calculateAttendance(attendedClasses, totalClasses) {
    if (!isValidClassCount(attendedClasses)
        || !isValidClassCount(totalClasses)
        || totalClasses === 0
        || attendedClasses > totalClasses) {
        return 0;
    }

    return Number(((attendedClasses / totalClasses) * 100).toFixed(2));
}

/**
 * Calculates the number of classes remaining in the semester.
 */
export function calculateRemainingClasses(classesPerWeek, remainingWeeks) {
    if (!isNonNegativeFiniteNumber(classesPerWeek)
        || !isNonNegativeFiniteNumber(remainingWeeks)) {
        return 0;
    }

    return classesPerWeek * remainingWeeks;
}

/**
 * Calculates the expected total number of classes by semester end.
 */
export function calculateExpectedClasses(totalClasses, remainingClasses) {
    if (!isNonNegativeFiniteNumber(totalClasses)
        || !isNonNegativeFiniteNumber(remainingClasses)) {
        return 0;
    }

    return totalClasses + remainingClasses;
}

/**
 * Calculates the maximum number of remaining classes that can be missed while
 * still meeting the required attendance percentage.
 */
export function calculateSafeLeaves(
    attended,
    total,
    classesPerWeek,
    remainingWeeks,
    requiredAttendance
) {
    if (!isValidClassCount(attended)
        || !isValidClassCount(total)
        || attended > total
        || !isNonNegativeFiniteNumber(classesPerWeek)
        || !isNonNegativeFiniteNumber(remainingWeeks)
        || !Number.isFinite(requiredAttendance)) {
        return { safeLeaves: 0, expectedAttendance: 0 };
    }

    const remainingClasses = calculateRemainingClasses(classesPerWeek, remainingWeeks);
    const expectedTotal = total + remainingClasses;

    if (expectedTotal === 0) {
        return { safeLeaves: 0, expectedAttendance: 0 };
    }

    const requiredRatio = requiredAttendance / 100;
    const maximumLeaves = Math.floor(
        remainingClasses - (requiredRatio * expectedTotal - attended)
    );
    const safeLeaves = Math.max(0, Math.min(remainingClasses, maximumLeaves));
    const expectedAttendance = calculateAttendance(
        attended + remainingClasses - safeLeaves,
        expectedTotal
    );

    return { safeLeaves, expectedAttendance };
}

/**
 * Calculates the minimum consecutive classes required to reach the target
 * attendance percentage.
 */
export function calculateRecoveryClasses(attended, total, requiredAttendance) {
    if (!isValidClassCount(attended)
        || !isValidClassCount(total)
        || attended > total
        || !Number.isFinite(requiredAttendance)
        || total === 0
        || attended / total >= requiredAttendance / 100
        || requiredAttendance >= 100) {
        return 0;
    }

    const requiredRatio = requiredAttendance / 100;
    return Math.ceil(
        (requiredRatio * total - attended) / (1 - requiredRatio)
    );
}

/**
 * Categorizes attendance relative to the required percentage.
 */
export function getAttendanceStatus(attendance, requiredAttendance) {
    if (!Number.isFinite(attendance) || !Number.isFinite(requiredAttendance)) {
        return "Critical";
    }

    if (attendance >= requiredAttendance + 5) {
        return "Safe";
    }

    if (attendance >= requiredAttendance) {
        return "Warning";
    }

    return "Critical";
}