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

  function showimages (){
    fetch("/shop",{method:"GET"}).then((response)=>{
if(response.ok) window.location.href = "/shop" 
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
          
          const button = document.getElementById(`wishlist-${productId}`);
          if(button){
                button.classList.remove('btn-light');
                button.classList.add('btn-danger');
                button.setAttribute(
                    'onclick',
                    `removeWishlist('${productId}')`
                );       
              }      
    const button2 = document.getElementById(`thismonth-wishlist-${productId}`);
    if(button2){
      button2.classList.remove('btn-light');
      button2.classList.add('btn-danger');
      button2.setAttribute(
          'onclick',
          `removeWishlist('${productId}')`
      );
    }
    const button3 = document.getElementById(`thisYear-wishlist-${productId}`);
    if(button3){
      button3.classList.remove('btn-light');
      button3.classList.add('btn-danger');
      button3.setAttribute(
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
        console.log("Error adding product to wishlist:", error);
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
    if(button){
      button.classList.add('btn-light');
      button.setAttribute(
                    'onclick',
                    `addWishlist('${productId}')`
                );
              }
        const button2 = document.getElementById(`thismonth-wishlist-${productId}`);
        if(button2){
        button2.classList.add('btn-light');
        button2.setAttribute(
                      'onclick',
                      `addWishlist('${productId}')`
                  );  
                }
         const button3 = document.getElementById(`thisYear-wishlist-${productId}`);
         if(button3){
         button3.classList.add('btn-light');
         button3.setAttribute(
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



function categorySelection (categoryId){
fetch(`/categoryFilter/${categoryId}`,{method:"GET"}).then((data)=>{
if(data.ok){
  window.location.href = `/categoryFilter/${categoryId}`
}
}).catch((err)=>{
console.log(err);

})
}