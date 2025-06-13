import express from "express";
import dotenv from "dotenv";
import connectDB from "./connectDB.js";
import morgan from "morgan";
import productModel from './productmodel.js'; 
import formidable from "formidable";
import fs from 'fs';


dotenv.config();


connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));



app.post("/", (req, res) => {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).send({ error: "Form parsing error" });

    try {
      const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
      const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
      const price = Array.isArray(fields.price) ? fields.price[0] : fields.price;
      const cutprice = Array.isArray(fields.cutprice) ? fields.cutprice[0] : fields.cutprice;
      const link = Array.isArray(fields.link) ? fields.link[0] : fields.link;
      const persent = Array.isArray(fields.persent) ? fields.persent[0] : fields.persent;

      const upload = files.photo;

      if (!name || !description || !price || !link || !persent) {
        return res.status(400).send({ error: "All fields are required" });
      }

      const product = new productModel({ name, description, price, cutprice, link, persent });

      if (upload?.filepath) {
        const photoBuffer = fs.readFileSync(upload.filepath);
        product.photo.data = photoBuffer;
        product.photo.contentType = upload.mimetype;
      }

      const saved = await product.save();

      return res.status(201).send({
        success: true,
        message: "Product created successfully",
        data: saved,
      });
    } catch (error) {
      console.error("Error saving product:", error);
      return res.status(500).send({ success: false, message: "Error in creating product", error });
    }
  });
});

app.post("/delete-product/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const deletedProduct = await productModel.findByIdAndDelete(productId);
    if (!deletedProduct) return res.status(404).send({ success: false, message: "Product not found" });
    res.status(200).send({ success: true, message: "Product deleted", data: deletedProduct });
  } catch (err) {
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});


export default app;
