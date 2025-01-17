function formvalidation(e) {
    e.preventDefault();
    let username = document.getElementById('username').value;
    let password = document.getElementById("password").value; 
    let email = document.getElementById("email").value;
    const phonenumber = document.getElementById("phonenumber").value;
    const confirmpassword = document.getElementById("confirmpassword").value;
    const referralCode = document.getElementById("referralCode").value;

    // Validation checks
    if (username == "" || password == "" || email == "" || phonenumber == "" || confirmpassword == "") {
        swal("Oops...", "Please enter all fields", "error");
        return false;
    } else if (password.length < 8) {
        swal("Oops...", "Password must be at least 8 characters", "error");
        return false;
    } else if (password !== confirmpassword) {
        swal("Oops...", "Passwords do not match", "error");
        return false;
    } else if (phonenumber.length < 10) {
        swal("Oops...", "Enter a valid 10-digit mobile number", "error");
        return false;
    } else {
        const formData = {
            username: username,
            password: password,
            email: email,
            phone: phonenumber,
            referralCode: referralCode
        };

        // Send data through fetch
        fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                swal("Success!", data.message, "success").then(() => {
                    window.location.href = `/verify-Otp-page/${data.otp}`;  // Redirect after success
                });
            } else {
                swal("Oops...", data.message, "error");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            swal("Oops...", "Something went wrong. Please try again later.", "error");
        });
    }
}

// Add event listener to the form
document.getElementById("formsignup").addEventListener("submit", formvalidation);


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
