document.getElementById('category-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent default form submission

    const categoryName = document.getElementById('category-name').value.trim();
    const categoryDescription = document.getElementById('category-description').value.trim();
    const categoryImage = document.getElementById('category-image').files[0];
    const isListed = document.getElementById('is-listed').value;

    // Validation
    if (!categoryName || !categoryDescription || !isListed) {
        Swal.fire({
            icon: 'warning',
            title: 'Please fill out all required fields.',
            text: 'Make sure all fields are filled out before submitting.',
        });
        return;
    }

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (categoryImage && !validImageTypes.includes(categoryImage.type)) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid image format',
            text: 'Please upload a JPEG, PNG, or WEBP image.',
        });
        return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (categoryImage && categoryImage.size > maxSize) {
        Swal.fire({
            icon: 'error',
            title: 'Image size exceeds limit',
            text: 'Image size exceeds 2MB. Please upload a smaller image.',
        });
        return;
    }

    const formData = new FormData();
    formData.append('id', document.querySelector('[name="id"]').value);
    formData.append('name', categoryName);
    formData.append('description', categoryDescription);
    formData.append('image_url', categoryImage || ''); // If no image, send empty string
    formData.append('offer', document.getElementById('offers').value);
    formData.append('is_listed', isListed);

    // Send data through fetch
    fetch('/admin/update-category', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Category Updated',
                text: 'Your category has been successfully updated.',
            }).then(()=>{
              window.location.href = '/admin/category';  // Redirect to category page
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message,
            });
        }
    })
    .catch(err => {
        console.error('Fetch error:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred. Please try again later.',
        });
    });
});