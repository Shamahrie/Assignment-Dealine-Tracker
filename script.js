
const assignmentNameInput = document.getElementById("assignmentName");
const dueDateInput = document.getElementById("dueDate");
const hoursRemainingInput = document.getElementById("hoursRemaining");
const addBtn = document.getElementById("addBtn");

const dashboard = document.getElementById("dashboard");
const upcomingList = document.getElementById("upcomingList");
const assignmentList = document.getElementById("assignmentList");

// Load saved assignments from the browser
let assignments = JSON.parse(localStorage.getItem("assignments")) || [];

// Give older assignments an ID if they don't already have one
assignments.forEach(function (assignment) {
    if (!assignment.id) {
        assignment.id =
            Date.now().toString() + Math.random().toString(16).slice(2);
    }
});

saveAssignments();

// Get today's date without the current time
function getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// Calculate days remaining until the due date
function getDaysRemaining(dueDate) {
    const due = new Date(dueDate + "T00:00:00");
    const today = getToday();

    return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

// Calculate assignment risk
function calculateRiskLevel(daysRemaining, hoursRemaining) {
    if (daysRemaining < 0) {
        return "Overdue";
    } else if (daysRemaining <= 1 && hoursRemaining >= 4) {
        return "High";
    } else if (daysRemaining <= 3 && hoursRemaining >= 2) {
        return "Medium";
    } else {
        return "Low";
    }
}

// Save assignments in the browser
function saveAssignments() {
    localStorage.setItem("assignments", JSON.stringify(assignments));
}

// Format the due date as Month Day, Year
function formatDueDate(dueDate) {
    return new Date(dueDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

// Create a colored risk label
function createRiskLabel(riskLevel) {
    const label = document.createElement("span");
    label.textContent = riskLevel;
    label.classList.add("risk-label");

    if (riskLevel === "Overdue") {
        label.classList.add("risk-overdue");
    } else if (riskLevel === "High") {
        label.classList.add("risk-high");
    } else if (riskLevel === "Medium") {
        label.classList.add("risk-medium");
    } else {
        label.classList.add("risk-low");
    }

    return label;
}

// Delete an assignment
function deleteAssignment(assignmentId) {
    const confirmed = confirm(
        "Are you sure you want to delete this assignment?"
    );

    if (!confirmed) {
        return;
    }

    assignments = assignments.filter(function (assignment) {
        return assignment.id !== assignmentId;
    });

    saveAssignments();
    displayAssignments();
}

// Create one assignment card
function createAssignmentCard(assignment) {
    const card = document.createElement("div");
    card.style.border = "1px solid #cbd5e1";
    card.style.borderRadius = "8px";
    card.style.padding = "15px";
    card.style.marginBottom = "12px";

    const daysRemaining = getDaysRemaining(assignment.dueDate);
    const riskLevel = calculateRiskLevel(
        daysRemaining,
        assignment.hoursRemaining
    );

    const heading = document.createElement("h3");
    heading.textContent = assignment.name;

    const dueText = document.createElement("p");

    if (daysRemaining < 0) {
        dueText.textContent =
            "Overdue by " + Math.abs(daysRemaining) + " day(s)";
    } else if (daysRemaining === 0) {
        dueText.textContent = "Due today";
    } else if (daysRemaining === 1) {
        dueText.textContent = "Due tomorrow";
    } else {
        dueText.textContent = "Due in " + daysRemaining + " days";
    }

    // Display the due date in Month Day, Year format
    const dateText = document.createElement("p");
    dateText.textContent = "Due date: " + formatDueDate(assignment.dueDate);

    const hoursText = document.createElement("p");
    hoursText.textContent =
        "Hours remaining: " + assignment.hoursRemaining;

    const riskText = document.createElement("p");
    riskText.append("Risk level: ");
    riskText.appendChild(createRiskLabel(riskLevel));

    // Create a Delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.style.backgroundColor = "#dc2626";
    deleteButton.style.marginTop = "5px";

    deleteButton.addEventListener("click", function () {
        deleteAssignment(assignment.id);
    });

    // Add elements to the assignment card
    card.appendChild(heading);
    card.appendChild(dueText);
    card.appendChild(dateText);
    card.appendChild(hoursText);
    card.appendChild(riskText);
    card.appendChild(deleteButton);

    return card;
}

// Display the dashboard and assignment lists
function displayAssignments() {
    dashboard.innerHTML = "";
    upcomingList.innerHTML = "";
    assignmentList.innerHTML = "";

    // Find assignments due within the next seven days
    const upcomingAssignments = assignments.filter(function (assignment) {
        const days = getDaysRemaining(assignment.dueDate);
        return days >= 0 && days <= 7;
    });

    // Find overdue assignments
    const overdueAssignments = assignments.filter(function (assignment) {
        return getDaysRemaining(assignment.dueDate) < 0;
    });

    // Find high-risk assignments
    const highRiskAssignments = assignments.filter(function (assignment) {
        const days = getDaysRemaining(assignment.dueDate);

        return calculateRiskLevel(
            days,
            assignment.hoursRemaining
        ) === "High";
    });

    // Dashboard summary boxes
    const counts = [
        {
            label: "Upcoming (7 days)",
            value: upcomingAssignments.length
        },
        {
            label: "Overdue",
            value: overdueAssignments.length
        },
        {
            label: "High Risk",
            value: highRiskAssignments.length
        }
    ];

    counts.forEach(function (item) {
        const box = document.createElement("div");
        box.style.display = "inline-block";
        box.style.backgroundColor = "#eff6ff";
        box.style.padding = "15px";
        box.style.margin = "5px";
        box.style.borderRadius = "8px";

        const label = document.createElement("p");
        label.textContent = item.label;

        const value = document.createElement("h2");
        value.textContent = item.value;

        box.appendChild(label);
        box.appendChild(value);
        dashboard.appendChild(box);
    });

    // Sort upcoming assignments by due date
    upcomingAssignments.sort(function (a, b) {
        return a.dueDate.localeCompare(b.dueDate);
    });

    if (upcomingAssignments.length === 0) {
        upcomingList.textContent =
            "No assignments due in the next 7 days.";
    } else {
        upcomingAssignments.forEach(function (assignment) {
            upcomingList.appendChild(createAssignmentCard(assignment));
        });
    }

    // Sort all assignments by due date
    const sortedAssignments = [...assignments].sort(function (a, b) {
        return a.dueDate.localeCompare(b.dueDate);
    });

    if (sortedAssignments.length === 0) {
        assignmentList.textContent =
            "No assignments yet. Add one above!";
    } else {
        sortedAssignments.forEach(function (assignment) {
            assignmentList.appendChild(createAssignmentCard(assignment));
        });
    }
}

// Add a new assignment
addBtn.addEventListener("click", function () {
    const name = assignmentNameInput.value.trim();
    const dueDate = dueDateInput.value;
    const hoursValue = hoursRemainingInput.value;

    // Check that all fields are filled in
    if (name === "" || dueDate === "" || hoursValue === "") {
        alert("Please fill in all fields.");
        return;
    }

    const hoursRemaining = Number(hoursValue);
    const dueDateObject = new Date(dueDate + "T00:00:00");

    // Validate the hours
    if (!Number.isFinite(hoursRemaining) || hoursRemaining < 0) {
        alert("Hours remaining must be a valid, non-negative number.");
        return;
    }

    // Validate the due date
    if (
        Number.isNaN(dueDateObject.getTime()) ||
        dueDateObject.toISOString().slice(0, 10) !== dueDate
    ) {
        alert("Please select a valid due date.");
        return;
    }

    // Create a new assignment
    const assignment = {
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),
        name: name,
        dueDate: dueDate,
        hoursRemaining: hoursRemaining
    };

    assignments.push(assignment);

    // Save and refresh the assignment lists
    saveAssignments();
    displayAssignments();

    // Clear the form
    assignmentNameInput.value = "";
    dueDateInput.value = "";
    hoursRemainingInput.value = "";
});

// Display saved assignments when the page opens
displayAssignments();

// Update countdowns every minute while the page is open
setInterval(displayAssignments, 60000);
