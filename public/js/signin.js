async function formvalidationsignin(e){
    e.preventDefault();
    
    let username = document.getElementById("username_signin").value;
    let password = document.getElementById("password_signin").value;
    
    console.log(username, password);

    if(username === "" || password === "") {
      swal({
    title: "Error",
    text: "Please complete all fields.",
    icon: "error",
    button: "OK"
  });
      return false;
    } else if(password.length < 8) {
      swal({
    title: "Password Error",
    text: "Password must be at least 8 characters.",
    icon: "error",
    button: "OK"
  });
      return false;
    } else {
      const formData = {
        username: username,
        password: password
      };

      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
          swal({
        title: "Success",
        text: "Login successful. Redirecting...",
        icon: "success",
        button: "OK"
      }).then(() => {
        window.location.href = result.redirectUrl; // Redirect on success
      });

        } else {
         swal({
        title: "Login Failed",
        text: result.message || "Login failed. Please try again.",
        icon: "error",
        button: "OK"
      });

        }
      } catch (error) {
        console.error("Error during login:", error);
        swal({
      title: "Error",
      text: "An error occurred. Please try again.",
      icon: "error",
      button: "OK"
    });
      }
      return true;
    }
  }

  document.getElementById("formsignin").addEventListener("submit", formvalidationsignin);



  function togglePassword() {
const passwordField = document.getElementById('password_signin');
const eyeIcon = document.getElementById('eye-icon');

if (passwordField.type === "password") {
  passwordField.type = "text";  // Show the password
  eyeIcon.classList.remove("fa-eye");
  eyeIcon.classList.add("fa-eye-slash");  // Change to eye-slash icon
} else {
  passwordField.type = "password";  // Hide the password
  eyeIcon.classList.remove("fa-eye-slash");
  eyeIcon.classList.add("fa-eye");  // Change to eye icon
}
}