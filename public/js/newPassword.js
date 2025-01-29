document.getElementById("newpassform").addEventListener("submit", function (e) {
  e.preventDefault(); // Prevent default form submission

  const password = document.getElementById("password").value;
  const confirmpassword = document.getElementById("confirmpassword").value;

  // Validation for empty fields
  if (password === "" || confirmpassword === "") {
    Swal.fire({
      icon: "warning",
      title: "Empty Fields",
      text: "Please fill in all the fields.",
    });
    return; // Stop execution if fields are empty
  }

  // Validation for password mismatch
  if (password !== confirmpassword) {
    Swal.fire({
      icon: "error",
      title: "Password Mismatch",
      text: "The passwords do not match. Please try again.",
    });
    return; // Stop execution if passwords do not match
  }

  // If all validations pass
  Swal.fire({
    icon: "success",
    title: "Passwords Match",
    text: "Form submitted successfully!",
  }).then(() => {
    // Submit the form after showing success alert
    e.target.submit(); // Manually submit the form
  });
});
