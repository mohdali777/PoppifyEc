const Admin = require("../model/admin/adminmodel")
const bcrypt = require("bcrypt")
const {User} = require("../model/user/usermodel")
const { serializeUser } = require("passport")
const { Category } = require("../model/admin/adminmodel");
const {Product} = require("../model/admin/adminmodel")

let getlogin = async(req,res)=>{
res.render("admins/signin")
}
let usermanageside = async(req,res)=>{
    const users = await User.find(); 
    res.render("admins/users",{users})
}

let postlogin = async(req,res)=>{
    try {
        const {username,password} = req.body;
        console.log(password,username);
        
        const admin = await Admin.findOne({username})
        if(!admin){
            return res.render("admins/signin")
        }
        // const isMatch = await bcrypt.compare(password, admin.password);
        const isMatch = password == admin.password
        console.log(isMatch);
        
        if (!isMatch) {
            return res.render('admins/signin');
        } 
        req.session.admin = true;
        res.render("admins/adminhome")
    } catch (err) {
        res.status(500).send(`${err} error found`)
    }
    

}

let gethome = async (req,res)=>{
    
res.render("admins/adminhome")
}

//add user post

const adduser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if the user already exists
        const user = await User.findOne({ username });
        if (user) {
            const users = await User.find(); // Fetch existing users
            return res.render("admins/users", { users, message: "User already exists" });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedpassword = await bcrypt.hash(password, saltRounds);

        // Create and save the new user
        const newUser = new User({
            email,
            username,
            password: hashedpassword
        });
        await newUser.save();

        // Fetch updated list of users and render
        const users = await User.find();
        res.render("admins/users", { users, message: "User added successfully!" });
    } catch (err) {
        console.error(err);
        res.render("admins/users", { message: "Error adding user. Please try again later." });
    }
};

const deleteuser = async(req,res)=>{
    try{
        const user = req.params.userid;
        await User.findByIdAndDelete(user)
        const users = await User.find({})
        res.render("admins/users",{users,message:"user deleted successfully"})
    }catch(err){
console.log(err)
res.status(500).send("failed to delete")
    }
}

const edituser = async (req,res)=>{
    try{
        const {id,email,password} = req.body;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password,saltRounds)
        await User.updateOne({_id:id},{$set:{email,password:hashedPassword}})
        const users = await User.find();
        res.render("admins/users",{users,message:"user added successfully"})
    }catch(err){
        console.log(err)
        res.status(500).send("failed to edit",err)
    }

}
const blockUser = async (req, res) => {
    try {
        const { userid } = req.params;

        // Set status to "blocked"
        const user = await User.findByIdAndUpdate(userid, { status: "blocked" });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User blocked successfully" });
    } catch (err) {
        console.error("Error blocking user:", err);
        res.status(500).json({ message: "Failed to block user" });
    }
};

const unblockUser = async (req, res) => {
    try {
        const { userid } = req.params;

        // Set status to "active"
        const user = await User.findByIdAndUpdate(userid, { status: "active" });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User unblocked successfully" });
    } catch (err) {
        console.error("Error unblocking user:", err);
        res.status(500).json({ message: "Failed to unblock user" });
    }
};



const category = async(req,res)=>{
const categories = await Category.find({})
res.render("admins/category",{categories})
}
const categorybutton = async(req,res)=>{
res.render("admins/addcategory")
}

const addcategory = async (req, res) => {
  try {
    const { name, description, is_listed } = req.body;

    // Get the uploaded image file (if any)
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Check if the category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.render("admins/addcategory", {
        message: "Category already exists",
      });
    }

    // Create a new category
    const newCategory = new Category({
      name,
      description,
      is_listed: is_listed === "true",
      image_url,
    });

    await newCategory.save();
    const categories = await Category.find();
    res.render("admins/category", {
      message: "Category added successfully!",categories
    });
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).render("admins/addcategory", {
      message: "Error adding category. Please try again.",
    });
  }
};
const deleteCategory = async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      await Category.findByIdAndDelete(categoryId);
      const categories = await Category.find({});
      res.render("admins/category", { categories });
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred while deleting the category.");
    }
  };

  const editcategory = async (req,res)=>{
    try {
        const categoryId = req.params.categoryId;
        const category = await Category.findById(categoryId);
    
        if (!category) {
          return res.status(404).send('Category not found');
        }
    
        // Render the edit page with the category details
        res.render('admins/updatecategory', { category });
      } catch (err) {
        console.error('Error rendering edit category page:', err);
        res.status(500).send('An error occurred');
      }
  }


  const updatecategory = async (req,res)=>{
    try {
      const {id,name,description,is_listed} = req.body;
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;
      const category = await Category.findOne({_id:id});
      if(!category){
        res.render("/admins/updatecategory",{message:"category dont exist"})
      }
      listcehck = is_listed === "true";
      category.name = name || category.name;
      category.description = description || category.description;
      category.is_listed = listcehck;
      if(image_url){
        category.image_url = image_url;
      }
      await category.save();

      const categories = await Category.find();
      res.render("admins/category",{categories})
    } catch (error) {
      res.status(500).send("err")
    }
  }
  
  const products = async (req,res)=>{
    try {
      const products = await Product.find({});

    // Send a success response or redirect
    res.render('admins/products',{products}); 
    } catch (error) {
      console.log(error);
      
    }
    
    
  }


const addproductsget = async (req,res)=> {
  try {
    const categories = await Category.find();
    res.render("admins/addproduct",{categories})
  } catch (error) {
    console.log(err);
    res.status(500).send('Server Error');
  }


}

const addproductpost = async (req, res) => {
  try {
    // Extract data from the request body
    const { name, description, category, price, quantity, brand, variants, colors } = req.body;
    console.log(req.files);
    
    const image = req.files.map(file => file.filename);
    console.log(image);
    const parsevariants = JSON.parse(variants)
    
    const newProduct = new Product({
      name,
      description,
      category,
      price,
      quantity,
      brand,
      variants: parsevariants, // Default to empty array if not provided
      colors: Array.isArray(colors) ? colors : [],
      image,  // Save the array of image file paths
      
    });

    // Save the new product to the database
    await newProduct.save();
    const products = await Product.find({});


    // Send a success response or redirect
    res.render('admins/products',{products});  // Redirect to product list after adding the product
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).send('Server Error');  // Send an error response if something goes wrong
  }
};

const geteditproducts = async (req,res)=>{
try {
  const productId = req.params.productId;
  const product = await Product.findById(productId)
  const categories = await Category.find({})
  res.render("admins/updateproduct",{product,categories})
} catch (error) {
  console.log(error);
  
}
}

const deleteproduct = async (req,res)=>{
  try {
    productId = req.params.productId;
    await Product.findByIdAndDelete(productId);
    const products = await Product.find({});
    res.render('admins/products',{products}); 
  } catch (error) {
    console.log(error);
    
  }


}





module.exports = {getlogin,
    postlogin,
    gethome,
    usermanageside,
    adduser,
    deleteuser,
    edituser,
    blockUser,
    unblockUser,
    category,
    categorybutton,
    addcategory,
    deleteCategory,
    editcategory,
    updatecategory,
  products,
addproductsget,
addproductpost,
geteditproducts,
deleteproduct}