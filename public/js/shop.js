let currentPage = 1;
const productsPerPage = 8;


function applyFilters() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const sortValue = document.getElementById('sortOptions').value;
    const categoryValue = document.getElementById('categoryFilter').value;
    const variantValue = document.getElementById("variantFilter").value;
    const priceValue = document.getElementById('priceFilter').value;

    const url = `/products-shop?sort=${sortValue}&search=${searchValue}&category=${categoryValue}&variant=${variantValue}&price=${priceValue}&page=${currentPage}&limit=${productsPerPage}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const productList = document.getElementById('productList');
            const paginationControls = document.getElementById('paginationControls');

            if (data.products.length === 0) {
            productList.innerHTML = '<p>No products found matching the criteria.</p>';
            paginationControls.style.display = 'none'; // Hide pagination controls
            return; // Exit early
        }

            productList.innerHTML = '';  // Clear the current product list
            data.products.forEach(product => {
                const productItem = document.createElement('div');
                productItem.classList.add('col', 'product-item');
                productItem.innerHTML = `
                    <div class="card shadow-sm position-relative" style="width: 270px; height: 350px; border-radius: 10px;">
                        <div class="badge bg-danger text-white position-absolute top-0 start-0 m-2" style="width: 40px; height: 20px; font-size: 11px;">
                            -10%
                        </div>
                        <div class="p-3" style="background-color: #F5F5F5; display: flex; justify-content: center; align-items: center; height: 240px;">
                            <img class="card-img-top" src="/uploads/${product.image[0]}" alt="${product.name}" style="width: 172px; height: 152px; object-fit: contain;" onclick="productDetails('${product._id}', '${product.category}')">
                        </div>
                        <div class="position-absolute top-0 end-0 m-2 d-flex flex-column gap-2">
                        
                        ${data.userId ? `<button 
          class="btn btn-sm rounded-circle shadow-sm ${product.WishListVerification.includes(data.userId.toString()) ? 'btn-danger' : 'btn-light'}" 
          style="width: 34px; height: 34px;" 
          id="wishlist-${product._id}" 
          onclick="${product.WishListVerification.includes(data.userId.toString()) ? `removeWishlist('${product._id}')` : `addWishlist('${product._id}')`}">
          <i class="bi bi-heart" style="font-size: 15px;"></i>
        </button> ` :`<button class="btn  btn-sm rounded-circle shadow-sm btn-light" style="width: 34px; height: 34px;"  id="wishlist-${product._id}"   onclick="addWishlist()" >
                    <i class="bi bi-heart" style="font-size: 15px;"></i>
                  </button>`}
                   

                        </div>
                        <div class="card-body text-center" style="text-align: start;">
                            <p class="card-text text-muted mb-2" style="font-size: 14px; font-weight: 600; color: #333; margin-left: 10px;">
                                ${product.name}
                            </p>
                            <h5 class="card-title fw-bold" style="font-size: 18px; font-weight: bold; color: #000;">₹${product.price}</h5>
                            <div class="text-warning">
                                ${renderRatingStars(product.rating)}
                <button type="button" class="btn btn-danger btn-lg" onclick="productDetails('${product._id}', '${product.category}')">View Product</button>
                            </div>
                        </div>
                    </div>
                `;
                productList.appendChild(productItem);
            });

            // Pagination Controls
            document.getElementById('prevPage').disabled = currentPage <= 1;
            document.getElementById('nextPage').disabled = data.products.length < productsPerPage;
        })
        .catch(err => console.error(err));
}


function changePage(direction) {
    if (direction === 'prev') {
        currentPage--;
    } else if (direction === 'next') {
        currentPage++;
    }
    applyFilters();
}

// Function to render star ratings
function renderRatingStars(rating) {
    let stars = '';
    for (let i = 0; i < rating; i++) {
        stars += '<i class="bi bi-star-fill"></i>';
    }
    for (let i = rating; i < 5; i++) {
        stars += '<i class="bi bi-star"></i>';
    }
    return stars;
}

// Function to navigate to product details page
function productDetails(productId, category) {
    console.log("Redirecting to product details...");
    fetch(`/productdeatails/${productId}/${category}`, { method: "GET" })
        .then((response) => {
            if (response.ok) window.location.href = `/productdeatails/${productId}/${category}`;
        })
        .catch((err) => {
            console.log(err);
        });
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
          const button = document.getElementById(`wishlist-${productId}`);
                button.classList.remove('btn-light');
                button.classList.add('btn-danger');
                button.setAttribute(
                    'onclick',
                    `removeWishlist('${productId}')`
                );
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
    const button = document.getElementById(`wishlist-${productId}`);
      button.classList.add('btn-light');
      button.setAttribute(
                    'onclick',
                    `addWishlist('${productId}')`
                );
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



window.onload = applyFilters; 