document.getElementById("createCouponForm").addEventListener("submit", function(event) {
    event.preventDefault();  // Prevent form from submitting normally

    let valid = true;
    
    // Validate Coupon Code
    const couponCode = document.getElementById("couponCode").value;
    if (!couponCode) {
        document.getElementById("couponCodeError").style.display = "inline";
        valid = false;
    } else {
        document.getElementById("couponCodeError").style.display = "none";
    }

    // Validate Discount
    const discount = document.getElementById("discount").value;
    if (!discount || discount < 1 || discount > 90) {
        document.getElementById("discountError").style.display = "inline";
        valid = false;
    } else {
        document.getElementById("discountError").style.display = "none";
    }

    const expiryDate = document.getElementById("expiryDate").value;
    if (!expiryDate) {
        document.getElementById("expiryDateError").style.display = "inline";
        valid = false;
    } else {
        document.getElementById("expiryDateError").style.display = "none";
    }

    const description = document.getElementById("description").value;
    if (!description) {
        document.getElementById("descriptionError").style.display = "inline";
        valid = false;
    } else {
        document.getElementById("descriptionError").style.display = "none";
    }
    if (!valid) {
        return;
    }


    const couponData = {
    couponCode,
    discount,
    expiryDate,
    description
};
    
    fetch('/admin/create-coupon', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',  
    },
    body: JSON.stringify(couponData),  
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: data.message,
            }).then(() => {
               window.location.href = "/admin/coupon-management"
            });
        }else{
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message,
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'An error occurred',
            text: 'Please try again later.',
        });
    });
});
