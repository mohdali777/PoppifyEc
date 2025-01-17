function updateCart(productId,color,totalquantity,id,variant,) {
    const inputElement = document.getElementById(`cart-quantity-${id}`);
    const quantity = parseInt(inputElement.value);

    if (quantity < 1) {
        swal({
  title: "Invalid Quantity",
  text: "Quantity must be at least 1.",
  icon: "warning", 
  button: "OK",     
});

        return;
    }
    if (quantity > totalquantity) {
        swal({
  title: "Limit Exceeded",
  text: `You can only add up to ${totalquantity} items.`,
  icon: "warning", 
  button: "OK",    
});

        inputElement.value = totalquantity; 
        inputElement.disabled = true; 
        setTimeout(() => {
            inputElement.disabled = false; 
        }, 2000); 
        return;
       
    }

    fetch('/update-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({quantity,id,variant,color }),
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
            const totalPriceElements = document.querySelectorAll(".CartTotalPrice");
if (totalPriceElements) {
    totalPriceElements.forEach((element) => {
        element.textContent = `$${data.updatePrice}`; // Update each element
    });
}
const itemprice = document.getElementById(`item.total-${id}`)
itemprice.textContent = data.itemPrice;
        } else {
            swal({
                title: "Failed to Update!",
                text: "There was an issue updating your cart. Please try again.",
                icon: "error",
                button: "OK",
            });
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
          })

          const itemRow = document.querySelector(`tr[data-item-id="${id}"]`);
          if (itemRow) {
            itemRow.remove();
          }
          console.log(data.updatePrice);
          
          const totalPriceElements = document.querySelectorAll(".CartTotalPrice");
if (totalPriceElements) {
    totalPriceElements.forEach((element) => {
        element.textContent = `$${data.updatePrice}`; // Update each element
    });
}

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