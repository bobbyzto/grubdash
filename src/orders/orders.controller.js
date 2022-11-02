const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// middleware for checking if there is a delivery location for order
function bodyHasDeliverProp(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;

  if (deliverTo) {
    res.locals.deliverTo = deliverTo;

    return next();
  }

  next({
    status: 400,
    message: `A 'deliverTo' property is required.`,
  });
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;

  const matchingOrder = orders.find((order) => order.id === orderId);

  if (matchingOrder) {
    res.locals.order = matchingOrder;
    return next();
  }

  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  });
}

function bodyHasMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;

  if (mobileNumber) {
    res.locals.mobileNumber = mobileNumber;
    // console.log("res locals =>",res.locals, "<=")
    return next();
  }
  // otherwise, return the following message
  next({
    status: 400,
    message: `A 'mobileNumber' property is required.`,
  });
}

function dataStringIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  // if the dish delivery status is one of the following valid statuses, move onto next function
  if (status) {
    if (
      status.includes("pending") ||
      status.includes("preparing") ||
      status.includes("out-for-delivery") ||
      status.includes("delivered")
    ) {
      res.locals.status = status;
      return next();
    }
  }
  // otherwise, return the following message
  next({
    status: 400,
    message: `status property must be valid string: 'pending', 'preparing', 'out-for-delivery', or 'delivered'`,
  });
}

// middleware for checking if order to delete is pending
function orderIsNotPending(req, res, next) {
  if (res.locals.order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

// middleware for checking if there is a dish(s) in the order
function bodyHasDishesProp(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (dishes) {
    res.locals.dishes = dishes;

    return next();
  }

  next({
    status: 400,
    message: `A 'dishes' property is required.`,
  });
}

// middleware for checking if there is a valid number of dishes in the order
function dishesArrayIsValid(req, res, next) {
  if (!Array.isArray(res.locals.dishes) || res.locals.dishes.length == 0) {
    next({
      status: 400,
      message: `invalid dishes property: dishes property must be non-empty array`,
    });
  }

  next();
}

// middleware for checking if there is a valid quantity of a given dish
function dishesArrayLengthIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  dishes.forEach((dish) => {
    const quantity = dish.quantity;
    // if the dish is not in the order, or they want 0, return the following message
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `dish ${dish.id} must have quantity property, quantity must be an integer, and it must not be equal to or less than 0`,
      });
    }
  });

  next();
}

// middleware for checking if the order and data for the order match
function dataIdMatchesOrderId(req, res, next) {
  const { data: { id } = {} } = req.body;
  const orderId = req.params.orderId;

  if (id !== undefined && id !== null && id !== "" && id !== orderId) {
    next({
      status: 400,
      message: `id ${id} must match orderId provided in parameters`,
    });
  }

  return next();
}

// ROUTE HANDLERS

// handler for listing the all of the orders
function list(req, res) {
  res.json({ data: orders });
}

// handler for reading the orders
function read(req, res) {
  const orderId = req.params.orderId;
  const matchingOrder = orders.find((order) => order.id === orderId);
  res.json({ data: matchingOrder });
}

// handler for making a new order
function create(req, res) {
//   const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: res.locals.deliverTo,
    mobileNumber: res.locals.mobileNumber,
    status: "out-for-delivery",
    dishes: res.locals.dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// handler for updating an order
function update(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;

  res.json({ data: foundOrder });
}

// handler for deleting an order
function destroy(req, res) {
  const index = orders.findIndex((order) => order.id === res.locals.order.id);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyHasDeliverProp,
    bodyHasMobileNumber,
    bodyHasDishesProp,
    dishesArrayIsValid,
    dishesArrayLengthIsValid,
    create,
  ],
  update: [
    orderExists,
    dataStringIsValid,
    dataIdMatchesOrderId,
    bodyHasDeliverProp,
    bodyHasMobileNumber,
    bodyHasDishesProp,
    dishesArrayIsValid,
    dishesArrayLengthIsValid,
    update,
  ],
  destroy: [orderExists, orderIsNotPending, destroy],
};
