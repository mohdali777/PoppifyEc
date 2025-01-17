function addproducts() {
    fetch("/admin/addproducts", { method: "GET" })
        .then((response) => {
            if (response.ok) window.location.href = "/admin/addproducts";
        })
        .catch((err) => {
            console.log(err);
        });
}

function editproduct(productId) {
    window.location.href = `/admin/editproduct/${productId}`;
}

async function deleteproduct(productId) {
Swal.fire({
    title: "Are you sure?",
    text: "Do you want to delete this product? This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
}).then(async (result) => {
    if (result.isConfirmed) {
        try {
            const response = await fetch(`/admin/deleteproduct/${productId}`, { method: "POST" });

            if (response.ok) {
                const data = await response.json();
                Swal.fire({
                    title: "Deleted!",
                    text: data.message,
                    icon: "success",
                });

                // Remove the product card from the DOM
                const card = document.getElementById(`card-product-${productId}`);
                if (card) {
                    card.remove();
                }
            } else {
                Swal.fire("Error!", "Failed to delete the product. Please try again.", "error");
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire("Error!", "Something went wrong. Please try again later.", "error");
        }
    } else {
        Swal.fire("Cancelled", "The product is safe.", "info");
    }
});
}

