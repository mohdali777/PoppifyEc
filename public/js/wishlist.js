function fetchWishlist(){
    fetch("/fethWishlsit",{method:"GET"})
    .then((response)=>{
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }
      return response.json();
    }).then((data)=>{
      if (data.success) {
        renderWishlist(data.items);
      } else {
        document.getElementById('wishlist-container').innerHTML = '<p>No items in your wishlist.</p>';
      }
    }).catch((error) => {
      console.error('Error fetching wishlist:', error);
      alert('An error occurred while fetching your wishlist.');
    });
}
  
function renderWishlist(items) {
  const wishlistContainer = document.getElementById('wishlist-container');

  // Clear existing wishlist content
  wishlistContainer.innerHTML = '';

  if (items.length === 0) {
    wishlistContainer.innerHTML = '<p>No items in your wishlist.</p>';
    return;
  }

  // Loop through items and create the HTML structure
  items.forEach(item => {
    const productCard = `
      <div class="col" id="wishlist-item-${item.productId._id}">
        <div class="card shadow-sm position-relative" style="width: 270px; height: 350px; border-radius: 10px;">
          <div class="p-3" style="background-color: #F5F5F5; display: flex; justify-content: center; align-items: center; height: 240px;">
           ${item.productId.inStocks === true  && item.productId.categoryId.is_listed === true ?  `<img class="card-img-top" src="/uploads/${item.productId.image[0]}" alt="${item.productId.name}" style="width: 172px; height: 152px; object-fit: contain;" onclick="productdeatails('${item.productId._id}', '${item.productId.category}')">
              `:  ` <p style="font-size: medium;">Product Not Available Now</p> `
             }
            
          </div>
          <div class="position-absolute top-0 end-0 m-2 d-flex flex-column gap-2">
            <button class="btn btn-light btn-sm rounded-circle shadow-sm" style="width: 34px; height: 34px; background-color: red;" onclick="removeWishlist('${item.productId._id}')">
              <i class="bi bi-heart" style="font-size: 15px; fill: red; color: white;"></i>
            </button>
            <button class="btn btn-light btn-sm rounded-circle shadow-sm" style="width: 34px; height: 34px;">
              <i class="bi bi-eye" style="font-size: 15px;"></i>
            </button>
          </div>
          <div class="card-body text-center" style="text-align: start;">
            <p class="card-text text-muted mb-2" style="font-size: 14px; font-weight: 600; color: #333; margin-left: 10px;">
              ${item.productId.name}
            </p>
            <h5 class="card-title fw-bold" style="font-size: 18px; font-weight: bold; color: #000;">₹${item.productId.variants[0].price}</h5>
            <div class="text-warning">
            ${item.productId.inStocks === true && item.productId.categoryId.is_listed === true ?  `              <button type="button" onclick="productdeatails('${item.productId._id}', '${item.productId.category}')" class="btn btn-danger btn-lg">View Product</button>
              `:  ` <p style="font-size: medium;">Product Not Available Now</p> `
             }
            </div>
          </div>
        </div>
      </div>
    `;

    // Append the new product card to the wishlist container
    wishlistContainer.innerHTML += productCard;
  });
}

// Function to view product details
function productdeatails (productId,category){

      
fetch(`/productdeatails/${productId}/${category}`,{method:"GET"}).then((response)=>{
if(response.ok) window.location.href = `/productdeatails/${productId}/${category}`
}).catch((err)=>{
console.log(err);

})
    }

// Function to remove an item from the wishlist
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
        iziToast.success({
title: 'Success',
message: 'Product removed from wishlist!',
position: 'topRight',
duration: 3000,  // Duration of the toast (in milliseconds)
color: 'green',  // Change the color of the toast
});
        document.getElementById(`wishlist-item-${productId}`).remove(); // Remove the item from the DOM
      } else {
        alert(data.message || 'Unable to remove product from wishlist.');
      }
    })
    .catch((error) => {
      console.error('Error removing product from wishlist:', error);
      alert('An error occurred while removing product from wishlist.');
    });
}

// Call fetchWishlist on page load to get wishlist data
document.addEventListener('DOMContentLoaded', fetchWishlist);