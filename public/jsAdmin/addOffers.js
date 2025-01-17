document.getElementById("offer-create-btn").addEventListener("click", async function (e) {
    e.preventDefault();
  
    const offerName = document.getElementById("offer-name").value;
    const offerType = document.getElementById("offer-type").value;
    const discountType = document.getElementById("discount-type").value;
    const discountValue = document.getElementById("discount-value").value;
    const minimumOrderValue = document.getElementById("minimum-order-value").value;
    const expiryDate = document.getElementById("expiry-date").value;
    const StartingDate = document.getElementById("Starting-Date").value;
    const isActive = document.getElementById("is-active").value;
  
    // Validate form fields
    if (
      !offerName ||
      !offerType ||
      !discountType ||
      !discountValue ||
      discountValue <= 0 ||
      discountValue > 100 ||
      (minimumOrderValue && minimumOrderValue < 0) ||
      !expiryDate ||
      !StartingDate ||
      !isActive
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: 'Please fill out all required fields correctly!',
      });
      return;
    }
  
    const startDateObj = new Date(StartingDate);
    const expiryDateObj = new Date(expiryDate);
  
    if (expiryDateObj <= startDateObj) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: 'Expiry Date should be after the Start Date.',
      });
      return;
    }
  
    // Create data object
    const data = {
      offerName,
      offerType,
      discountType,
      discountValue: parseInt(discountValue, 10),
      minimumOrderValue: parseFloat(minimumOrderValue) || 0,
      expiryDate,
      StartingDate,
      isActive: isActive === "true",
    };
  
    try {
      // Send data using fetch
      const response = await fetch('/admin/create-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Offer Created!',
          text: result.message || 'The offer has been successfully created.',
        });
        document.getElementById("create-offer-form").reset();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: result.message || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to create the offer. Please try again later.',
      });
      console.error('Error:', error);
    }
  });
  
  
  