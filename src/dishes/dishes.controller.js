const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: dishes });
}

const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish ${req.params.dishId} not found.`,
  });
};

function read(req, res) {
  res.json({ data: res.locals.dish });
}

const hasValidName = (req, res, next) => {
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

const hasValidPrice = (req, res, next) => {
  const { data: { price } = {} } = req.body;
  if (!price || price <= 0) {
    next({
      status: 400,
      message: "price",
    });
  }
  res.locals.price = price;
  return next();
};

const hasValidDescription = (req, res, next) => {
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

const hasValidUrl = (req, res, next) => {
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

module.exports = {
  list,
  read: [dishExists, read],
  create: [hasValidName, hasValidPrice, hasValidDescription, hasValidUrl, create],
  update: [],
};
