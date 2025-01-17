document.getElementById("offer-create-btn").addEventListener("click", async function (e) {
    e.preventDefault(); // Prevent default form submission
  
    // Get form values
    const formData = {
      id: document.querySelector("input[name='id']").value,
      offerName: document.getElementById("offer-name").value,
      offerType: document.getElementById("offer-type").value,
      discountType: document.getElementById("discount-type").value,
      discountValue: document.getElementById("discount-value").value,
      minimumOrderValue: document.getElementById("minimum-order-value").value,
      expiryDate: document.getElementById("expiry-date").value,
      StartingDate: document.getElementById("Starting-Date").value,
      isActive: document.getElementById("is-active").value,
    };
  
    if (
      !formData.offerType ||
      !formData.discountType ||
      !formData.discountValue ||
      formData.discountValue <= 0 ||
      formData.discountValue > 100 ||
      (formData.minimumOrderValue && formData.minimumOrderValue < 0) ||
      !formData.expiryDate ||
      !formData.StartingDate ||
      !formData.isActive
    ) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill out all required fields correctly.",
      });
      return; 
    }
  
    const startDateObj = new Date(formData.StartingDate);
    const expiryDateObj = new Date(formData.expiryDate);
  
    if (expiryDateObj <= startDateObj) {
      Swal.fire({
        icon: "error",
        title: "Date Error",
        text: "Expiry Date should be after the Start Date.",
      });
      return;
    }
  
    try {
      // Send data using fetch
      const response = await fetch("/admin/edit-offer-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      const result = await response.json();
  
      // Handle the response
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: result.message || "Offer updated successfully.",
        }).then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.message || "Failed to update the offer.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "An error occurred while submitting the form. Please try again.",
      });
    }
  });
  
  
  