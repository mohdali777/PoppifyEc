
function fetchData () {
  fetch('/fechCartdata') // Adjust this to match your backend API endpoint
      .then((response) => response.json())
      .then((data) => {
          if (data.success) {
              const cartItemsContainer = document.getElementById('cart-items');
              cartItemsContainer.innerHTML = ''; // Clear any existing content
              
              data.cart.items.forEach((item) => {
                  const row = document.createElement('tr');
                  row.setAttribute('data-item-id', item._id);

                  row.innerHTML = `
                      <td class="d-flex align-items-center" style="position: relative;">
                          <img style="width: 40px; height: 40px;" src="/uploads/${item.productImage}" alt="${item.productId.name}" class="me-2">
                          <span>${item.productName}</span>
                          ${item.colorQuantity === 0 ? '<span style="color: red; left: 142px; font-size: small; position: absolute;">Product Stock Not Available Now</span>' : ''}
                      </td>
                      <td>${item.variant}</td>
                      <td>${item.color}</td>
                      <td>₹${item.price}</td>
                      <td hidden>${item.colorQuantity}</td>
                      <td>
                          <input 
                              type="number" 
                              class="form-control mx-auto quantity-input" 
                              value="${item.quantity}" 
                              min="1" 
                              id="cart-quantity-${item._id}"  
                              onchange="updateCart('${item.productId._id}', '${item.color}', '${item.colorQuantity}', '${item._id}', '${item.variant}')" 
                              style="width: 60px;">
                      </td>
                      <td id="item.total-${item._id}">₹${item.total}</td>
                      <td>
                          <button class="btn btn-black btn-sm" onclick="deleteCartItem('${item.productId._id}', '${item.variant}', '${item._id}')">
                              <i class="fas fa-trash"></i>
                          </button>
                      </td>
                  `;
                  cartItemsContainer.appendChild(row);
              });

              const quantity = data.cart.items.map((pr)=>{
              return pr.colorQuantity == 0;
              })
              
              if(quantity.includes(true)){
                document.getElementById("proceedButton").setAttribute("onclick","removeStock()")
              }else if(data.cart.items.length==0){
                document.getElementById("proceedButton").setAttribute("onclick","emptyCart()")
              }else{
                document.getElementById("proceedButton").setAttribute("onclick","proceedtoPayment()")
              }
              
              // Update cart total
              document.querySelectorAll('.CartTotalPrice').forEach((element) => {
                  element.textContent = `$${data.cart.totalPrice}`;
              });
          } else {
              console.error(data.message || 'Failed to load cart data.');
          }
      })
      .catch((error) => console.error('Error fetching cart data:', error));
    }

  document.addEventListener('DOMContentLoaded', fetchData);

function updateCart(productId,color,totalquantity,id,variant,) {
    const inputElement = document.getElementById(`cart-quantity-${id}`);
    const quantity = parseInt(inputElement.value);
    if (quantity < 1) {
        swal({
  title: "Invalid Quantity",
  text: "Quantity must be at least 1.",
  icon: "warning", 
  button: "OK",     

}).then(()=>{
  fetchData()
});
     return;
    }
    fetch('/update-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({quantity,id,variant,color,productId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            swal({
                title: "Cart Updated!",
                text: "Your cart has been updated successfully.",
                icon: "success",
                button: "OK",
            });
           fetchData()
        } else {
          if(data.colorquantity){
            swal({
                title: "Limit Exceeded",
                text: `You can only add up to ${data.colorquantity} items.`,
                icon: "warning", 
                button: "OK",    
              }).then(()=>{
                inputElement.value = data.colorquantity; 
                      inputElement.disabled = true; 
                      setTimeout(() => {
                          inputElement.disabled = false; 
                      }, 2000);     
              });
          }else{
            swal({
                title: "Failed to Update!",
                text: data.message,
                icon: "error",
                button: "OK",
            })
          }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Something went wrong.');
    });
}

function deleteCartItem(productId, variant, id) {
  swal({
    title: "Are you sure?",
    text: "Do you really want to remove this item from the cart?",
    icon: "warning",
    buttons: ["Cancel", "Yes, Remove It"],
    dangerMode: true,
  }).then((willDelete) => {
    if (!willDelete) {
      return; 
    }

    fetch('/delete-cart-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, id }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          swal({
            title: "Removed!",
            text: "Item removed from cart successfully!",
            icon: "success",
            button: "OK",
          }).then(()=>{
            fetchData()
          })
        } else {
          swal({
            title: "Error!",
            text: data.message || "Failed to remove the item from the cart.",
            icon: "error",
            button: "OK",
          });
        }
      })
      .catch(error => {
        console.error('Error:', error);
        swal({
          title: "Error!",
          text: "Something went wrong. Please try again.",
          icon: "error",
          button: "OK",
        });
      });
  });
}

function proceedtoPayment (){
    fetch("/check-out",{method:"GET"}).then((response)=>{
if(response.ok) window.location.href = "/check-out"
    }).catch((err)=>{
console.log(err);

    })
}

function removeStock(){
  swal({
    title: "Stock Out Products",
    text: "Please remove the stock-out products from your cart.",
    icon: "warning",  // Icon style (warning, error, etc.)
    buttons: "Okay",  // Button text
  });
}
function emptyCart(){
  swal({
    title: "Empty Cart",
    text: "Your Cart is Empty.",
    icon: "warning",  // Icon style (warning, error, etc.)
    buttons: "Okay",  // Button text
  });
}