function editaddress(addressId) {
    fetch(`/edit-Address/${addressId}`, { method: "GET" })
      .then((response) => {
        if (response.ok) {
          window.location.href = `/edit-Address/${addressId}`;
        } else {
          swal({
    title: "Error!",
    text: "Unable to edit address. Please try again later.",
    icon: "error", // Use an error icon
    button: "OK",  // Customize the button text
  });
  
        }
      })
      .catch((error) => {
        console.error("Error fetching edit page:", error);
        swal({
    title: "Oops!",
    text: "Something went wrong. Please check your connection and try again.",
    icon: "error", // Use the error icon for better feedback
    button: "OK",  // Customize the button text
  });
  
      });
  }
  
  function deleteaddress(addressId) {
    swal({
      title: "Are you sure?",
      text: "Do you want to delete this address? This action cannot be undone.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,  // Highlight the "Delete" button
    }).then((willDelete) => {
      if (willDelete) {
        fetch(`/delete-address/${addressId}`, { method: "DELETE" })
          .then((response) => {
            if (response.ok) {
              swal({
                title: "Success!",
                text: "Address deleted successfully!",
                icon: "success",
                button: "OK", // Custom button text
              }).then(() => {
                window.location.reload(); // Reload the page to reflect the changes
              });
            } else {
              return response.json().then((data) => {
                throw new Error(data.error || "Failed to delete the address.");
              });
            }
          })
          .catch((error) => {
            console.error("Error deleting address:", error);
            swal({
              title: "Error!",
              text: "Something went wrong. Please try again.",
              icon: "error",
              button: "OK",
            });
          });
      } else {
        swal("Cancelled", "Your address is safe.", "info");
      }
    });
  }