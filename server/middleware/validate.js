const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/* Runs a chain of express-validator rules and turns failures into one
   400 with a field->message map the frontend can render inline. */
const validate = (rules) => async (req, _res, next) => {
  await Promise.all(rules.map((rule) => rule.run(req)));
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = {};
  result.array().forEach(({ path, msg }) => {
    if (!details[path]) details[path] = msg;
  });
  next(ApiError.badRequest('Some fields need attention', details));
};

module.exports = validate;
