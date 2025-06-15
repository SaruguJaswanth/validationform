// Selecting form inputs
const form = document.getElementById("validationForm");
const name = document.getElementById("name");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

// Function to display alerts
function showAlert(message) {
    alert(message); // Display popup message
}

// Function to validate form
function validateForm(event) {
    event.preventDefault(); // Prevent form submission

    // Validate Full Name (At least 5 characters)
    if (name.value.length < 5) {
        showAlert("Name must be at least 5 characters long!");
        return;
    }

    // Validate Email (Must contain '@' symbol)
    if (!email.value.includes("@")) {
        showAlert("Enter a valid email!");
        return;
    }

    // Validate Phone Number (10 digits & should not be '1234567890')
    if (phone.value.length !== 10 || phone.value === "1234567890") {
        showAlert("Enter a valid 10-digit phone number!");
        return;
    }

    // Validate Password (Should not be 'password' or username, and min 8 characters)
    if (password.value.length < 8 || password.value.toLowerCase() === "password" || password.value === name.value) {
        showAlert("Password is not strong! It must be at least 8 characters long and should not be 'password' or your name.");
        return;
    }

    // Validate Confirm Password (Must match password)
    if (password.value !== confirmPassword.value) {
        showAlert("Passwords do not match!");
        return;
    }

    // If all validations pass, show success message
    showAlert("Registered Successfully!");
    form.reset(); // Reset the form
}

// Adding event listener for form submission
form.addEventListener("submit", validateForm);