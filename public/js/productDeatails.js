const zoomWrappers = document.querySelectorAll(".productdeatailsimg");

zoomWrappers.forEach(wrapper => {
    const img = wrapper.querySelector("img");

    wrapper.addEventListener("mousemove", (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
    });

    wrapper.addEventListener("mouseenter", () => {
        img.classList.add("zoomed");
    });

    wrapper.addEventListener("mouseleave", () => {
        img.classList.remove("zoomed");
    });
});
const sizeSelect = document.getElementById('size');
// const priceElement = document.getElementById('price');
const quantityElement = document.getElementById("quantityid");
const stockStatusElement = document.getElementById("stock-status");
const ogprice = document.getElementById("originalprice");
const button1 = document.getElementById("button_cart");
const colorOptionsContainer = document.querySelector('.color-options');
let SelectColor;
let SelectColorQuantity;


const discountper = document.getElementById("offer-persantage") ? parseFloat(document.getElementById("offer-persantage").value) : 0;
const discountmini = document.getElementById("offer-minimumamount") ? parseFloat(document.getElementById("offer-minimumamount").value) : 0;

const discountperCategory = document.getElementById("offer-persantage-category") ? parseFloat(document.getElementById("offer-persantage-category").value) : 0;
const discountminiCategory = document.getElementById("offer-minimumamount-category") ? parseFloat(document.getElementById("offer-minimumamount-category").value) : 0;


sizeSelect.addEventListener('change', function () {
  const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
  const colors = JSON.parse(selectedOption.getAttribute('data-colors') || '[]');
  const price = selectedOption.getAttribute('data-price');
  const quantity = parseInt(selectedOption.getAttribute('data-quantity'), 10); 
  const qualityvalue = document.getElementById("quantity").value;


  
  if (price) {
    ogprice.textContent = `₹${price}`;
  } else {
    priceElement.textContent = "N/A";
  }

  let finalPrice = price;
  if (discountper > 0 && price >= discountmini) {
    finalPrice = price - (price * discountper / 100);
  }

  
  if (discountperCategory > 0 && finalPrice >= discountminiCategory) {
    finalPrice = finalPrice - (finalPrice * discountperCategory / 100);
  }

 
  if (finalPrice !== price) {
    let priceElement = document.getElementById("price");
    if (!priceElement) {
      priceElement = document.createElement("h4");
      priceElement.id = "price";
      ogprice.parentNode.insertBefore(priceElement, ogprice.nextSibling); // Insert after the original price
    }

    priceElement.textContent = `₹${finalPrice.toFixed(2)}`;
    ogprice.style.textDecoration = "line-through red";
  } else {
   
    const priceElement = document.getElementById("price");
    if (priceElement) priceElement.remove();
    ogprice.style.textDecoration = "none";
  }
  
  if (!isNaN(quantity)) {
    quantityElement.textContent = `${quantity} Products Left`;
  } else {
    quantityElement.textContent = "N/A";
  }


  updateStockStatus(quantity);

  updateColorOptions(colors);


  document.querySelectorAll('input[name="color"]').forEach(input => {
  input.addEventListener("change", () => {
    console.log("s");
    if (input.checked) {
      console.log(input.value);  // Logs the value of the selected radio button
      console.log(input.getAttribute('data-quantity'));
      const colorQuantity = input.getAttribute('data-quantity')
      quantityElement.textContent = `${colorQuantity} Products Left`;
      SelectColor = input.value
      console.log(SelectColor);
      SelectColorQuantity = (colorQuantity)
    
      
      updateStockStatus(parseInt(colorQuantity));
      
    }
    
  });
});
});


function updateStockStatus(quantity) {
  if (quantity === 0) {
    stockStatusElement.textContent = "Out Of Stock";
    stockStatusElement.style.color = "red";
    button1.disabled = true;
  } else if (quantity <= 5) {
    stockStatusElement.textContent = "Low Stock";
    stockStatusElement.style.color = "orange";
    button1.disabled = false;
  } else {
    stockStatusElement.textContent = "In Stock";
    stockStatusElement.style.color = "green";
    button1.disabled = false;
  }
}



function updateColorOptions(colors) {
  // Clear the previous color options
  colorOptionsContainer.innerHTML = '';

  if (colors.length > 0) {
    colors.forEach((color, index) => {
      // Create color option elements
      const colorOption = document.createElement('div');
      colorOption.className = 'color-option';

      const colorInput = document.createElement('input');
      colorInput.type = 'radio';
      colorInput.name = 'color';
      colorInput.id = color.color;
      colorInput.value = color.color;
      colorInput.setAttribute('data-quantity', color.quantity);

      const colorLabel = document.createElement('label');
      colorLabel.htmlFor = color.color;
      colorLabel.className = 'color-circle';
      colorLabel.style.backgroundColor = color.color;
      

      colorOption.appendChild(colorInput);
      colorOption.appendChild(colorLabel);

      colorOptionsContainer.appendChild(colorOption);
    });
  } else {
    // Show a message if no colors are available
    const noColorsMessage = document.createElement('p');
    noColorsMessage.textContent = "No colors available for this variant.";
    colorOptionsContainer.appendChild(noColorsMessage);
  }
}

document.getElementById('quantity').addEventListener('input', function() {
    const quantityInput = document.getElementById('quantity');  
    const enteredQuantity = parseInt(quantityInput.value, 10); 
    const quantityElement = document.getElementById("quantityid"); 
    const totalquantity = parseInt(quantityElement.textContent, 10);
    if (enteredQuantity > totalquantity) {
      swal({
                title: "Error!",
                text: "Limit Exceed.",
                icon: "info", 
                button: "OK",  
            });
        quantityInput.value = totalquantity;
    }
});



function showreviews(){
  const reviewcontainer = document.getElementById("reviewcontainer")
  reviewcontainer.style.display = 'block'
}
function closeReviewModal (){
   const reviewcontainer = document.getElementById("reviewcontainer")
  reviewcontainer.style.display = 'none'
}

document.getElementById("quantity").addEventListener('input', function () {
  const quantityInput = document.getElementById('quantity');
  const buyButton = document.getElementById('button_product');
    if (quantityInput.value <= 1) {
      buyButton.disabled = false;
    } else {
      buyButton.disabled = true;
    }
  });

  function addtocart(productId ,userId){
    if(!userId){
      swal({
        title: "Login or Signup Required",
        text: "You need to log in or sign up to proceed.",
        icon: "warning",
        buttons: ["Cancel", "Okay"],
      }).then((willProceed) => {
        if (willProceed) {
          // Handle what happens after the user clicks "Okay" (e.g., redirect to login/signup page)
          window.location.href = '/login'; // Or wherever you want to redirect
        }
      });
      return
      
    }
    const offerprice = document.getElementById("price");
    const ogprice = document.getElementById("originalprice");
    console.log(offerprice);
    console.log(ogprice);
    
    
    if (!offerprice && !ogprice) {
        console.error("Price elements not found!");
        return;
    }
    const priceText = offerprice ? offerprice.textContent : ogprice.textContent;
  
    const price = parseFloat(priceText.replace('₹', '').trim());

    console.log("Price:", price);


    // Check if price is valid
    if (isNaN(price) || price <= 0) {
        console.error("Invalid price!");
        return;
    }
 
    console.log(price);

    const offerPriceText = offerprice ? offerprice.textContent : null;
const originalPriceText = ogprice ? ogprice.textContent : null;

// Parse the prices into numbers
const offerPriceValue = offerPriceText ? parseFloat(offerPriceText.replace('₹', '').trim()) : null;
const originalPriceValue = originalPriceText ? parseFloat(originalPriceText.replace('₹', '').trim()) : null;

console.log("Offer Price:", offerPriceValue);
console.log("Original Price:", originalPriceValue);

// Validate prices
if ((offerPriceValue === null && originalPriceValue === null) || 
    (offerPriceValue !== null && offerPriceValue <= 0) || 
    (originalPriceValue !== null && originalPriceValue <= 0)) {
    console.error("Invalid price data!");
    return;
}

// Calculate the offer amount (discount)
const offerAmount = (originalPriceValue && offerPriceValue) ? (originalPriceValue - offerPriceValue) : 0;

console.log("Offer Amount:", offerAmount);

console.log(SelectColorQuantity)
console.log(SelectColor);


  const selectedQuantity = document.getElementById("quantity").value;
  const variantElement = document.getElementById("size");
    if (!variantElement) {
        console.error('Variant select element not found!');
        return;
    }
    if (variantElement.selectedIndex === -1) {
        console.error('No variant selected!');
        return;
    }
    const selectedVariant = variantElement.options[variantElement.selectedIndex];
    const variantName = selectedVariant.value;
    const totalquantity = parseInt(selectedVariant.getAttribute("data-quantity"), 10);
    const ColorName = SelectColor;
    const colorQuantity = SelectColorQuantity;

    if (!variantName) {
      swal({
    icon: 'warning',
    title: 'Missing Variant',
    text: 'Please choose a variant before proceeding.',
    confirmButtonText: 'OK',
  });
  return;
}



if (!ColorName) {
  swal({
    icon: 'warning',
    title: 'Missing Color',
    text: 'Please choose a color before proceeding.',
    confirmButtonText: 'OK',
  });
  return;
}

if(selectedQuantity == 0 || selectedQuantity < 0){
  return swal({
    title: "Oops...",
    text: "Please choose a Valid Number!",
    icon: "warning",
    button: "OK",
  });
}
  
  const cart = {
    productId :productId ,
    price:price,
    quantity:selectedQuantity,
    variant:variantName,
    totalquantity:totalquantity,
    discoundOfferPrice:offerAmount,
    color:ColorName,
    colorQuantity:colorQuantity
  }

  fetch('/add-to-cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cart)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      swal({
  title: "Success!",
  text: "Product added to cart successfully!",
  icon: "success", 
  button: "OK", 
});

    } else {
      swal({
  title: "Error!",
  text: data.message,
  icon: "error", // Use the error icon
  button: "OK",  // Customize button text
});

    }
  })
  .catch(error => {
    console.error('Error:', error);
    swal({
  title: "Error!",
  text: "Something Went Wrong",
  icon: "error", 
  button: "OK",  
});
  });
}

function productdeatails (productId,category){
        console.log("............");
        console.log(productId);
        console.log("............");
        
  fetch(`/productdeatails/${productId}/${category}`,{method:"GET"}).then((response)=>{
 if(response.ok) window.location.href = `/productdeatails/${productId}/${category}`
  }).catch((err)=>{
console.log(err);

  })
      }


      function addWishlist(productId) {
        if(!productId){
          swal({
            title: "Login or Signup Required",
            text: "You need to log in or sign up to proceed.",
            icon: "warning",
            buttons: ["Cancel", "Okay"],
          }).then((willProceed) => {
            if (willProceed) {
              // Handle what happens after the user clicks "Okay" (e.g., redirect to login/signup page)
              window.location.href = '/login'; // Or wherever you want to redirect
            }
          });
          return
          
        }
    fetch(`/addwishlist/${productId}`, { method: "POST" })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to add product to wishlist");
            }
            return response.json(); 
        })
        .then((data) => {
            if (data.success) {
              const button3 = document.getElementById(`wishlist-${productId}`);
                    button3.classList.remove('btn-light');
                    button3.classList.add('btn-danger');
                    button3.setAttribute(
                        'onclick',
                        `removeWishlist('${productId}')`
                    );
                    
                    const button4 = document.getElementById(`button_product-${productId}`)
                    if(button4){
                    button4.value = "Remove to Wishlist" 
                    button4.setAttribute(
                        'onclick',
                        `removeWishlist('${productId}')`
                    ); 
                    }
                    iziToast.success({
          title: 'Success',
          message: data.message || 'Product removed from wishlist!',
          position: 'topRight',
        });
                
            } else {
                swal({
                    title: "Error!",
                    text: data.message || "Unable to add product to wishlist.",
                    icon: "error",
                    button: "OK",
                });
            }
        })
        .catch((error) => {
            console.error("Error adding product to wishlist:", error);
            swal({
                title: "Error!",
                text: "An error occurred. Please try again later.",
                icon: "error",
                button: "OK",
            });
        });
}


function removeWishlist(productId) {
  fetch(`/removewishlis/${productId}`, { method: "POST" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to remove product from wishlist");
      }
      return response.json(); 
    })
    .then((data) => {
      if (data.success) {
        const button3 = document.getElementById(`wishlist-${productId}`);
          button3.classList.add('btn-light');
          button3.setAttribute(
                        'onclick',
                        `addWishlist('${productId}')`
                    );
          const button4 = document.getElementById(`button_product-${productId}`)
          if(button4){
          button4.value = "Add to Wishlist" 
          button4.setAttribute(
                        'onclick',
                        `addWishlist('${productId}')`
                    ); 
          }       
          iziToast.success({
          title: 'Success',
          message: data.message || 'Product removed from wishlist!',
          position: 'topRight',
        });
       
      } else {
        swal({
          title: "Error!",
          text: data.message || "Unable to remove product from wishlist.",
          icon: "error",
          button: "OK",
        });
      }
    })
    .catch((error) => {
      console.error("Error removing product from wishlist:", error);
      swal({
        title: "Error!",
        text: "An error occurred. Please try again later.",
        icon: "error",
        button: "OK",
      });
    });
}