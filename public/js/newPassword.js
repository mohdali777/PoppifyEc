document.getElementById("newpassform").addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent default form submission
    
    const password = document.getElementById("password").value;
    const confirmpassword = document.getElementById("confirmpassword").value;
  
    if (password === "" || confirmpassword === "") {
      Swal.fire({
        icon: "warning",
        title: "Empty Fields",
        text: "Please fill in all the fields.",
      });
      return false;
    } else if (password !== confirmpassword) {
      Swal.fire({
        icon: "error",
        title: "Password Mismatch",
        text: "The passwords do not match. Please try again.",
      });
      return false;
    }
  
    // Success case
    Swal.fire({
      icon: "success",
      title: "Passwords Match",
      text: "Form submitted successfully!",
    }).then(() => {
      e.currentTarget.submit(); // Submit the form after confirmation
    });
  
    return true;
  });
  