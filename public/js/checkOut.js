
document.getElementById("changeAddressButton").addEventListener("click", () => {
  const allAddressesSection = document.getElementById("allAddresses");
  allAddressesSection.style.display =
    allAddressesSection.style.display === "none" ? "block" : "none";
  });
  
  function selectAddress(id, name, companyname, streetaddress, appartment, city, phone, email) {
  const addressDisplay = document.getElementById("addressDisplay");
  addressDisplay.innerHTML = `
    <textarea class="form-control" rows="4" readonly style="font-size: 1.2rem;">
      ${name}, ${companyname}, ${streetaddress}, ${appartment}, ${city}, ${phone}, ${email}
    </textarea>
  `;
}


function placeorder(pricee) {
    const useDefaultAddress = document.getElementById("defaultAddress").checked;
const priceElement = document.getElementById("totalPrice1");
const discountedPriceElement = document.getElementById("totalPrice2");
const totalPrice = discountedPriceElement && discountedPriceElement.textContent.trim()
      ? parseFloat(discountedPriceElement.textContent.trim().replace(/[^0-9.]/g, ""))
      : priceElement && priceElement.textContent.trim()
      ? parseFloat(priceElement.textContent.trim().replace(/[^0-9.]/g, ""))
      : null;

  // Validate total price
  if (!totalPrice || isNaN(totalPrice)) {
    swal({
  title: "Invalid total price",
  text: "Please check your cart and try again.",
  icon: "error", // You can use "success", "info", "warning", "error", etc.
  button: "OK", // Customize the button text
});

      return;
  }
const rozer = document.getElementById("razorpay").checked;
const cod = document.getElementById("cod").checked;
const Wallet = document.getElementById("wallet").checked;

const defaultAddress = {
  name: "<%= address?.name || '' %>",
  companyName: "<%= address?.companyname || '' %>",
  streetAddress: "<%= address?.streetaddress || '' %>",
  apartment: "<%= address?.appartment || '' %>",
  city: "<%= address?.city || '' %>",
  phone: "<%= address?.phone || '' %>",
  email: "<%= address?.email || '' %>"
};

const orderDetails = {
  paymentMethod : rozer ? "RazorPay" : cod ? "COD" : Wallet ? "Wallet" : null,
  totalPrice: parseFloat(totalPrice), // Convert to number
  firstName: useDefaultAddress? defaultAddress.name: document.getElementById("firstName").value,
  companyName: useDefaultAddress? defaultAddress.companyName: document.getElementById("companyName").value,
  streetAddress: useDefaultAddress? defaultAddress.streetAddress: document.getElementById("streetAddress").value,
  apartment: useDefaultAddress? defaultAddress.apartment: document.getElementById("apartment").value,
  city: useDefaultAddress? defaultAddress.city: document.getElementById("city").value,
  phone: useDefaultAddress? defaultAddress.phone: document.getElementById("phone").value,
  email: useDefaultAddress ? defaultAddress.email: document.getElementById("email").value,
  coupenId: document.getElementById("copen-container").value ? document.getElementById("copen-container").value  : null ,
  coupenDiscountAmount: document.getElementById("coupenDiscountAmount").value ? document.getElementById("coupenDiscountAmount").value  : null 
};

if(orderDetails.firstName ==""||orderDetails.companyName=="" || orderDetails.streetAddress==""||orderDetails.apartment==""||orderDetails.city==""||orderDetails.phone==""||orderDetails.email==""){
return swal({
  title: "Please Choose Address",
  text: "You must select an address to proceed.",
  type: "Notification",
  confirmButtonText: "OK"
});

}

      console.log("Order Details:", orderDetails);

      fetch('/place-order', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderDetails),
      })
          .then(response => response.json())
          .then(data => {
              console.log("Order placed successfully:", data);
              if (orderDetails.paymentMethod === "RazorPay" && data.razorpayOrderId) {
                console.log('enterrazorpay');
                
          initializeRazorpay(data.razorpayOrderId, orderDetails.totalPrice, data.keyId,orderDetails);
          console.log('enterrazorpay');
      } else {
          swal({
              title: "Notification",
              text: data.message,
              icon: "info",
              button: "OK",
          });
          if(data.orderId){
          setTimeout(()=>{
                window.location.href = `/succes-page/${data.orderId}`
          },1000)
          
        }

      }
          })
          .catch(err => {
              console.error("Error placing order:", err);
              alert("Failed to place order.");
          });
  }




  function initializeRazorpay(razorpayOrderId, amount, keyId, orderDetails) {
  console.log("Initializing Razorpay...");
  console.log("Razorpay Order ID:", razorpayOrderId);
  console.log("Order Details:", orderDetails);

  const options = {
      key: keyId, 
      amount: Math.round(amount * 100), // Convert to paisa
      currency: "INR",
      name: "Poppify",
      description: "Order Payment",
      order_id: razorpayOrderId,
      handler: function (response) {
          console.log("Payment successful response:", response);
          verifyPayment(response, razorpayOrderId, orderDetails);
      },
      prefill: {
          name: orderDetails.firstName,
          email: orderDetails.email,
          contact: orderDetails.phone,
      },
      theme: {
          color: "#3399cc",
      },
  };

  const razorpay = new Razorpay(options);
  razorpay.open();
}

function verifyPayment(response, razorpayOrderId, orderDetails) {
  console.log("Verifying Payment...");
  console.log("Response:", response);

  fetch('/verify-payment', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
      }),
  })
      .then(res => res.json())
      .then(data => {
          console.log("Payment verification data:", data);
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





function coupenApply(totalPrice){
  console.log(totalPrice);
  const Price = document.getElementById("totalPrice1");
  const TotalPrice =  parseFloat(Price.textContent.trim().replace(/[^0-9.]/g, ""))
  console.log(TotalPrice);
  const couponCode = document.getElementById('coupen-code').value;
if (!couponCode) {
  document.getElementById('couponMessage').innerText = "Please enter a coupon code.";
  return;
}
fetch('/apply-coupon', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ couponCode ,TotalPrice}),
})
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      swal({
  title: "Coupon Applied",
  text: data.message, // Assuming data.message contains the message about the coupon applied
  type: "success",
  confirmButtonText: "OK"
});

      const originalPriceElement = document.getElementById('totalPrice1');
      originalPriceElement.style.textDecoration = "line-through";
      originalPriceElement.style.color = "red"
      document.getElementById("discountedPrice").style.display = "block"
      document.getElementById('totalPrice2').innerText = `₹${data.newTotal}`;
      document.getElementById("couponAppliedMessage").style.display = "block"
      document.getElementById("copen-container").value = data.coupenId;
      document.getElementById("coupenDiscountAmount").value = data.totalDiscount;
      console.log(data.coupenId);
      
    } else {
      swal({
  title: "Coupon Applied",
  text: data.message, // Assuming data.message contains the message about the coupon applied
  type: "failed",
  confirmButtonText: "error"
});
      // document.getElementById('couponMessage').innerText = data.message;
    }
  })
  .catch(error => {
    console.error('Error:', error);
    // document.getElementById('couponMessage').innerText = "An error occurred. Please try again.";
  });
}