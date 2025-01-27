let imageFiles = [];
let cropper; 
let croppedImages = []; 








let variantCount = 0; 

function addVariant() {
const container = document.getElementById('variant-container');
const row = document.createElement('div');
row.classList.add('variant-row');
variantCount++; 

row.innerHTML = `
    <input type="text" name="variant" placeholder="Variant (e.g., 64 GB)" >
    <input type="number" name="price" placeholder="Price" >
    <label for="quantity-${variantCount}">Quantity</label>
    <input type="number" id="quantity-${variantCount}" class="custom-width" placeholder="Enter quantity" name="quantity"  min="1">
    <label>Select Colors:</label>
    <div class="color-options">
        <div>
            <input type="checkbox" name="colors" id="red-${variantCount}" value="red">
            <label for="red-${variantCount}" class="color-circle red"></label>
            <div id="quantity-red-${variantCount}" class="quantity-section" style="display: none;">
                <label for="quantity-red">Quantity for Red:</label>
                <input type="number" id="quantity-red" min="1" style="width: 50px; border: 2px solid black;">
            </div>
        </div>
        <div>
            <input type="checkbox" name="colors" id="black-${variantCount}" value="black">
            <label for="black-${variantCount}" class="color-circle black"></label>
            <div id="quantity-black-${variantCount}" class="quantity-section" style="display: none;">
                <label for="quantity-black">Quantity for Black:</label>
                <input type="number" id="quantity-black" min="1" style="width: 50px; border: 2px solid black;">
            </div>
        </div>
        <div>
            <input type="checkbox" name="colors" id="blue-${variantCount}" value="blue">
            <label for="blue-${variantCount}" class="color-circle blue"></label>
            <div id="quantity-blue-${variantCount}" class="quantity-section" style="display: none;">
                <label for="quantity-blue-input}">Quantity for Blue:</label>
                <input type="number" id="quantity-blue" min="1" style="width: 50px; border: 2px solid black;">
            </div>
        </div>
        <div>
            <input type="checkbox" name="colors" id="green-${variantCount}" value="green">
            <label for="green-${variantCount}" class="color-circle green"></label>
            <div id="quantity-green-${variantCount}" class="quantity-section" style="display: none;">
                <label for="quantity-green">Quantity for Green:</label>
                <input type="number" id="quantity-green" min="1" style="width: 50px; border: 2px solid black;">
            </div>
        </div>
    </div>
    <button type="button" class="btn btn-danger" onclick="removeVariant(this)">Remove</button>

`;
container.appendChild(row);


// Add event listeners to checkboxes in the new variant row
row.querySelectorAll('.color-options input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const quantitySection = document.getElementById(`quantity-${checkbox.id}`);
        if (checkbox.checked) {
            quantitySection.style.display = 'block';
        } else {
            quantitySection.style.display = 'none';
        }
    });
});
}

function removeVariant(button) {
button.parentElement.remove(); // Remove the row
}



function openCropper(event) {
    const file = event.target.files[0];
    if (!file) return;
         

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!validImageTypes.includes(file.type)) {

    Swal.fire({
icon: 'error',
title: 'Invalid Image Format',
text: 'Please upload a JPEG, PNG, or WEBP image.',
});
    event.target.value = ""; 
    return;
}

    const reader = new FileReader();
    reader.onload = function(e) {
        const cropperImage = document.getElementById('cropper-image');
        cropperImage.src = e.target.result;
        document.getElementById('cropper-modal').style.display = 'block';

       
        if (cropper) cropper.destroy(); 
        cropper = new Cropper(cropperImage, {
            aspectRatio: NaN, // Set aspect ratio to 1:1 (Square)
            viewMode: 1, // Restrict cropping to image boundaries
        });
    };
    reader.readAsDataURL(file);
}

// Close cropper modal
function closeCropper() {
    document.getElementById('cropper-modal').style.display = 'none';
}

// Handle cropping and save the cropped image
document.getElementById('crop-button').addEventListener('click', function() {
const croppedCanvas = cropper.getCroppedCanvas();
croppedCanvas.toBlob(blob => {
    // Convert the Blob into a File and add to the croppedImages array
    const file = new File([blob], `cropped-image-${croppedImages.length + 1}.jpg`, { type: 'image/jpeg' });
    croppedImages.push(file); // Add file to array

    // Optionally, display the preview of the image
    displayImagePreview(file);
});

closeCropper(); // Close the cropper modal after cropping
});

function displayImagePreview(file) {
const previewContainer = document.getElementById('image-preview');
const imgWrapper = document.createElement('div');
imgWrapper.className = 'image-wrapper';

const img = document.createElement('img');
img.src = URL.createObjectURL(file);  // Create an object URL for the file
img.className = 'preview-image';

// Create a remove button for the image
const removeButton = document.createElement('button');
removeButton.className = 'remove-button';
removeButton.textContent = 'Remove';
removeButton.title = 'Remove Image';

removeButton.addEventListener('click', () => {
    // Remove the file from the croppedImages array
    const index = croppedImages.indexOf(file);
    if (index > -1) {
        croppedImages.splice(index, 1);  // Remove file from array
    }
    imgWrapper.remove();  // Remove the image preview from the DOM
});

imgWrapper.appendChild(img);
imgWrapper.appendChild(removeButton);
previewContainer.appendChild(imgWrapper);
}

// Handle form submission
document.querySelector('.add-product-form').addEventListener('submit', function(e) {
    e.preventDefault(); 


    const productName = document.getElementById('product-name').value.trim();
const description = document.getElementById('description').value.trim();
const category = document.getElementById('category').value;
const price = document.getElementById('price').value.trim();
const brand = document.getElementById('brand').value.trim();
if(productName == ""||description==""||category==""||price==""||brand==""){
   Swal.fire({
icon: 'warning',
title: 'Incomplete Form',
text: 'Please fill in all required fields before submitting.',
});

    return false
}



if (croppedImages.length === 0) {
    Swal.fire({
icon: 'warning',
title: 'No Images Selected',
text: 'Please select at least one image to proceed.',
});

    return false;
}

    

    const formData = new FormData();

    // Append form fields
    formData.append('name', document.getElementById('product-name').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('brand', document.getElementById('brand').value);
    formData.append('offer', document.getElementById('offers').value);
    formData.append('inStocks', document.getElementById('stock-status').value)

const variants = [];
document.querySelectorAll('.variant-row').forEach((row, variantIndex) => {
const variant = row.querySelector('input[name="variant"]').value;
const price = row.querySelector('input[name="price"]').value;
const quantity = row.querySelector(`input[name="quantity"]`).value;

if (!variant) {
    iziToast.warning({
        title: 'Missing Variant Name',
        message: `Variant name is missing for row ${variantIndex + 1}`,
        position: 'topRight',  
        timeout: 5000,         
        closeOnClick: true     
    });
    variants.length = 0
    return; 
}

if (isNaN(price) || price <= 0) {
    iziToast.error({
        title: 'Invalid Price',
        message: `Invalid price for row ${variantIndex + 1}`,
        position: 'topRight',  
        timeout: 5000,         
        closeOnClick: true     
    });
    
    variants.length = 0
    return; 
}

if (isNaN(quantity) || quantity <= 0) {
    iziToast.error({
        title: 'Invalid Quantity',
        message: `Invalid quantity for row ${variantIndex + 1}`,
        position: 'topRight',  
        timeout: 5000,         
        closeOnClick: true    
    });
    
    variants.length = 0
    return; 
}
// Get the selected colors and their respective quantities
const colorInputs = row.querySelectorAll('input[name="colors"]:checked');
const colors = Array.from(colorInputs).map(input => {
    const colorName = input.value;
    const colorQuantityInput = row.querySelector(`#quantity-${colorName}`);
    const colorQuantity = colorQuantityInput ? colorQuantityInput.value : 0; 


    if (!colorName || colorQuantity <= 0) { 
        iziToast.error({
            title: 'Invalid Input',
            message: `Invalid input: Color '${colorName || "undefined"}' has quantity ${colorQuantity}. Please correct it.`,
            position: 'topRight',  // Customize position (e.g., 'topRight', 'bottomLeft')
            timeout: 5000,         // Duration for which the toast stays visible (in ms)
            closeOnClick: true     // Allow the user to click to close the toast
        });
        

    return null; 
}

    return { color: colorName, quantity: parseInt(colorQuantity) };
}).filter(color => color !== null);

if (colors.length === 0) {
    iziToast.error({
        title: 'No Valid Colors Selected',
        message: `No valid colors selected for row ${variantIndex + 1}.`,
        position: 'topRight',  
        timeout: 5000,         
        closeOnClick: true     
    });

    variants.length = 0
    return;
}

let totalColorquantity = colors.reduce((acc,colo)=>{
    return  acc+= colo.quantity
},0)

if (totalColorquantity != quantity) {
    iziToast.warning({
        title: 'Quantity Mismatch',
        message: `Total quantity and total color quantity must be equal at row ${variantIndex + 1}.`,
        position: 'topRight', // Customize position as needed (e.g., 'topRight', 'bottomLeft', etc.)
        timeout: 5000, // Duration for which the toast remains visible (in ms)
    });
    variants.length = 0; 
    return;
}



if (variant && price && quantity && colors.length > 0 && colors !== null)  {
    variants.push({ 
        variant, 
        price: parseFloat(price), 
        quantity: parseInt(quantity), 
        colors 
    });
    
}
});


if (variants.length === 0) {
return iziToast.warning({
    title: 'No Valid Variants Found',
    message: 'Please check your inputs and try again.',
    position: 'topRight',  // Customize position (e.g., 'topRight', 'bottomLeft')
    timeout: 5000,         // Duration for which the toast stays visible (in ms)
    closeOnClick: true,    // Allow the user to click to close the toast
});
}

formData.append('variants', JSON.stringify(variants)); // Add as a JSON string

    croppedImages.forEach((file, index) => {
        formData.append('images', file);
    });

    // Send the form data to the server
    fetch('/admin/add-product', {
        method: 'POST',
        body: formData,
    }).then((response) => {
        if (response.ok)
        Swal.fire({
icon: 'success',
title: 'Product Added Successfully',
text: 'Your product has been added.',
}).then(()=>{
window.location.reload();
})


    })
    .catch(error => console.error('Error:', error));
});