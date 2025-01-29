function showPaymentSection(orderId) {
 
    document.getElementById(`paymentMethodTry-${orderId}`).style.display = 'block';
 
    
}

function closePaymentSection(orderId) {
    document.getElementById(`paymentMethodTry-${orderId}`).style.display = 'none';
}

    function toggleProducts(button) {
        const productsContainer = button.closest('.order-card-order-page').querySelector('.products-container-order-page');
        productsContainer.classList.toggle('active');
        button.textContent = productsContainer.classList.contains('active') ? "Hide Products" : "View Products";
    }

    function toggleBillingAddress(orderId) {
        const billingAddress = document.getElementById(`billing-address-${orderId}`);
        const isHidden = billingAddress.style.display === 'none';
        billingAddress.style.display = isHidden ? 'block' : 'none';
    }

  
    async function handleCancel(orderId) {
  const willCancel = await swal({
    title: "Are you sure?",
    text: "Do you want to cancel this order? This action cannot be undone.",
    icon: "warning",
    buttons: ["No, Keep It", "Yes, Cancel It"], 
    dangerMode: true, 
  });

  if (willCancel) {
    try {
      const response = await fetch(`/orders-cancel/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        swal({
          title: "Order Canceled!",
          text: result.message || "Your order has been successfully canceled.",
          icon: "success",
          button: "OK",
        })
       const  paymentstatus = document.getElementById(`orderstatus-${orderId}`)
       paymentstatus.textContent = result.ordersstatus
       paymentstatus.style.color = "red" 
       paymentstatus.style.backgroundColor = "#fde2e2"
       const  orderstatus = document.getElementById(`paymentstatus-${orderId}`)
       orderstatus.textContent = result.paymentstatus
       orderstatus.style.color = "red" 
       orderstatus.style.backgroundColor = "#fde2e2"
       const paymentbutton = document.getElementById(`paymentMethod-${orderId}`)
       if(paymentbutton){
        paymentbutton.style.display = "none"
       }
       const cancelButton = document.getElementById(`CancelButton--${orderId}`)
       if(cancelButton){
        cancelButton.style.display = "none"
       }
      } else {
        swal({
          title: "Error!",
          text: "Failed to cancel the order. Please try again.",
          icon: "error",
          button: "OK",
        });
      }
    } catch (err) {
      console.error("Error canceling order:", err);
      swal({
        title: "Error!",
        text: "Something went wrong. Please try again.",
        icon: "error",
        button: "OK",
      });
    }
  } else {
    swal("Cancelled", "Your order is safe.", "info");
  }
}
function productdeatails (productId,category){
if(!productId && !category){
  return swal("Oops!", "Product Not Available", "error")
}
  fetch(`/productdeatails/${productId}/${category}`,{method:"GET"}).then((response)=>{
 if(response.ok) window.location.href = `/productdeatails/${productId}/${category}`
  }).catch((err)=>{
console.log(err);
  })
      }




  submitBtn.onclick = async function () {
    const reason = returnReasonInput.value.trim();
    if (!reason) {
      swal({
                title: "Attention!",
                text: "Please provide a reason for the return.",
                icon: "warning", // Use the warning icon
                button: "OK",    // Customize the button text
            });
      return;
    }
  }
  async function handleReturn(orderId, productId,itemId) {
  const modal = document.getElementById('returnModal');
  const closeBtn = document.getElementById('closeModal');
  const returnReasonInput = document.getElementById('returnReason');
  const submitBtn = document.getElementById('submitReturn');
  closeBtn.onclick = function () {
    modal.style.display = 'none';
  };
  modal.style.display = 'block';
  submitBtn.onclick = async function () {
    const reason = returnReasonInput.value.trim();
    if (!reason) {
      swal({
                title: "Attention!",
                text: "Please provide a reason for the return.",
                icon: "warning", // Use the warning icon
                button: "OK",    // Customize the button text
            });
      return;  
    }

    try {
      const response = await fetch(`/orders/${orderId}/return/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason ,itemId})  
      });
      const result = await response.json();
      if (result.success) {
        swal({
                title: "Notification",
                text: result.message,
                icon: "info", 
                button: "OK", 
            }); 
        location.reload();  
      } else {
        swal({
                title: "Error!",
                text: "Failed to return the product. Please try again.",
                icon: "error", // Use the error icon for failure messages
                button: "OK",  // Customize the button text
            });
      }
    } catch (error) {
      console.error(error);
      swal({
                title: "Error!",
                text: "An error occurred while processing your return.",
                icon: "error", // Error icon
                button: "OK",  // Button text
            });
    }
    modal.style.display = 'none';
  };
}

function placeorder(orderId, totalPrice) {
    // Get the selected payment method
    const rozer = document.getElementById(`razorpay-${orderId}`).checked;
    const wallet = document.getElementById(`wallet-${orderId}`).checked;

    // Determine the payment method
    const paymentMethod = rozer
        ? "RazorPay"
        : wallet
        ? "Wallet"
        : null;

    // Ensure a payment method is selected
    if (!paymentMethod) {
        swal("Error", "Please select a payment method.", "error");
        return;
    }

    // Prepare the order details
    const orderDetails = {
        paymentMethod,
        totalPrice: parseFloat(totalPrice), // Convert to number
        orderId,
    };

    // Send the request to the server
    fetch('/repay-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderDetails),
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to place the order");
            }
            return response.json(); // Parse the response JSON
        })
        .then((data) => {
          if (orderDetails.paymentMethod === "RazorPay" && data.razorpayOrderId) {
            initializeRazorpay(data.razorpayOrderId, orderDetails.totalPrice, data.keyId,orderDetails);
          }else{
            swal("Success", "Order placed successfully!", "success")
            setTimeout(()=>{
                  window.location.href = `/succes-page/${data.orderid}`
            },1000)
            
          }
        })
        .catch((error) => {
            
            console.error("Error placing order:", error.message);
            swal("Error", error.message, "error");
        });
}

function initializeRazorpay(razorpayOrderId, amount, keyId, orderDetails) {


    const options = {
        key: keyId, 
        amount: Math.round(amount * 100), // Convert to paisa
        currency: "INR",
        name: "Poppify",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: function (response) {
            verifyPayment(response, razorpayOrderId, orderDetails);
        },
        prefill: {
            name: "first name",
            email:" orderDetails.email",
            contact: "orderDetails.phone",
        },
        theme: {
            color: "#3399cc",
        },
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
}

function verifyPayment(response, razorpayOrderId, orderDetails) {


    fetch('/verify-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            razorpayOrderId: razorpayOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            type:"repay"
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                swal({
                    title: "Payment Successful",
                    text: "Your order has been placed successfully!",
                    icon: "success",
                    button: "OK",
                });
                
                if(data.orderId){
            setTimeout(()=>{
                  window.location.href = `/succes-page/${data.orderId}`
            },1000)
            
          }
            } else {
                swal({
                    title: "Payment Failed",
                    text: data.message,
                    icon: "error",
                    button: "OK",
                });
            }
        })
        .catch(err => {
            console.error("Payment verification failed:", err);
            alert("Failed to verify payment. Please contact support.");
        });
}