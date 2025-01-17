function openAddUserModal() {
    document.getElementById('addUserModal').style.display = 'block';
}
function closeAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
}
function openEditUserModal(id, email) {
    document.getElementById('editUserModal').style.display = 'block';
    document.getElementById('editUserId').value = id;
    document.getElementById('editEmail').value = email;
}
function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
}
// Function to delete user with SweetAlert2
function deleteuser(userid) {
Swal.fire({
title: "Are you sure?",
text: "Once deleted, this cannot be undone.",
icon: "warning",
showCancelButton: true,
confirmButtonText: "Delete",
cancelButtonText: "Cancel",
dangerMode: true,
}).then((result) => {
if (result.isConfirmed) {
    fetch(`/admin/user-delete/${userid}`, { method: "POST" })
        .then((response) => {
            if (response.ok) {
                Swal.fire("Deleted!", "User deleted successfully!", "success")
                    .then(() =>{
    const row = document.getElementById(`rowUserdeatails-${userid}`)
    row.remove()
                    });
            } else {
                Swal.fire("Error", "Failed to delete user.", "error");
            }
        })
        .catch((err) => {
            console.error("Fetch error:", err);
            Swal.fire("Error", "An error occurred. Please try again later.", "error");
        });
}
});
}

// Function to block user with SweetAlert2
function blockUser(userid) {
Swal.fire({
title: "Are you sure?",
text: "You are about to block this user.",
icon: "warning",
showCancelButton: true,
confirmButtonText: "Block",
cancelButtonText: "Cancel",
dangerMode: true,
}).then((result) => {
if (result.isConfirmed) {
    fetch(`/admin/user-block/${userid}`, { method: "POST" })
        .then(response => {
            if (response.ok) {
                Swal.fire("Blocked!", "User has been blocked.", "success")
                    .then(() => {
                      const button = document.getElementById(`block-button-${userid}`)
                      button.innerText = "UnBlock";
                      button.style.backgroundColor = "black"
                      button.setAttribute("onclick", `unblockUser('${userid}')`);
                    });
            } else {
                Swal.fire("Error", "Failed to block user.", "error");
            }
        })
        .catch(err => {
            console.error("Fetch error:", err);
            Swal.fire("Error", "An error occurred. Please try again later.", "error");
        });
}
});
}

// Function to unblock user with SweetAlert2
function unblockUser(userid) {
Swal.fire({
title: "Are you sure?",
text: "You are about to unblock this user.",
icon: "warning",
showCancelButton: true,
confirmButtonText: "Unblock",
cancelButtonText: "Cancel",
dangerMode: true,
}).then((result) => {
if (result.isConfirmed) {
    fetch(`/admin/user-unblock/${userid}`, { method: "POST" })
        .then(response => {
            if (response.ok) {
                Swal.fire("Unblocked!", "User has been unblocked.", "success")
                    .then(() => {
                      const button = document.getElementById(`block-button-${userid}`)
                      button.innerText = "Block";
                      button.style.backgroundColor = "#28a745"
                      button.setAttribute("onclick", `blockUser('${userid}')`);
                    });
            } else {
                Swal.fire("Error", "Failed to unblock user.", "error");
            }
        })
        .catch(err => {
            console.error("Fetch error:", err);
            Swal.fire("Error", "An error occurred. Please try again later.", "error");
        });
}
});
}


document.getElementById('addUserForm').addEventListener('submit', async function (e) {
e.preventDefault();
const username = document.getElementById('addusername').value;
const email = document.getElementById('addEmail').value;
const password = document.getElementById('addPassword').value;

// Create a payload object
const payload = {
username: username,
email: email,
password: password
};

try {
// Send data to the server
const response = await fetch('/admin/add-user', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
});

// Parse the response
const data = await response.json();

if (response.ok) {
    Swal.fire({
        title: 'Success!',
        text: data.message || 'User added successfully.',
        icon: 'success',
        confirmButtonText: 'OK'
    }).then(() => {
        closeAddUserModal(); // Close the modal
        window.location.reload(); // Refresh the page or update UI dynamically
    });
} else {
    Swal.fire({
        title: 'Error!',
        text: data.message || 'Failed to add user.',
        icon: 'error',
        confirmButtonText: 'Try Again'
    });
}
} catch (error) {
console.error('Error:', error);
Swal.fire({
    title: 'Error!',
    text: 'An unexpected error occurred. Please try again later.',
    icon: 'error',
    confirmButtonText: 'OK'
});
}
});
