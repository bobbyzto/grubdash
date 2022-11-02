const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// List all dishes in database
function list(req, res) {
  res.json({ data: dishes });
}

// Read a specific dish found in the database back to the client
function read(req, res) {
  res.json({ data: res.locals.dish });
}

// Create a new dish in the database
function create(req, res) {
  const newId = nextId();
  const newDish = {
    id: newId,
    name: res.locals.name,
    description: res.locals.description,
    price: res.locals.price,
    image_url: res.locals.image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// Update data for the requested dish if found in the database
function update(req, res) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  foundDish.description = res.locals.description;
  foundDish.name = res.locals.name;
  foundDish.price = res.locals.price;
  foundDish.image_url = res.locals.image_url;

  res.json({ data: foundDish });
}

// Check that dish requested in URL exists in the database
const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
};



// Validate the "name" property of the incoming request
const bodyHasValidName = (req, res, next) => {
  const { data: { name } = {} } = req.body;
  if (!name || !name.length) {
    next({
      status: 400,
      message: "name",
    });
  }
  res.locals.name = name;
  return next();
};

// Validate the "price" property of the incoming request
const bodyHasValidPrice = (req, res, next) => {
  const { data: { price } = {} } = req.body;
  if (!price || price <= 0 || typeof price !== "number") {
    next({
      status: 400,
      message: "price",
    });
  }
  res.locals.price = price;
  return next();
};

// Validate the "description" property of the incoming request
const bodyHasValidDescription = (req, res, next) => {
  const { data: { description } = {} } = req.body;
  if (!description || description === "") {
    next({
      status: 400,
      message: "Dish must include a description",
    });
  }
  res.locals.description = description;
  return next();
};

// Validate the "image_url" property of the incoming request
const bodyHasValidUrl = (req, res, next) => {
  const { data: { image_url } = {} } = req.body;
  if (!image_url || image_url === "") {
    next({
      status: 400,
      message: "Dish must include a image_url",
    });
  }
  res.locals.image_url = image_url;
  return next();
};

// Check id (if provided in request body) is valid
const bodyHasValidDishId = (req, res, next) => {
  const { data: { id } = {} } = req.body;
  if (!id) {
    return next();
  } else if (res.locals.dish.id !== id) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dish.id}`,
    });
  }
  return next();
};

module.exports = {
  list,
  read: [dishExists, read],
  create: [
    bodyHasValidName,
    bodyHasValidPrice,
    bodyHasValidDescription,
    bodyHasValidUrl,
    create,
  ],
  update: [
    dishExists,
    bodyHasValidName,
    bodyHasValidPrice,
    bodyHasValidDescription,
    bodyHasValidUrl,
    bodyHasValidDishId,
    update,
  ],
};
