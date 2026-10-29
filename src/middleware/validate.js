const formatIssues = (issues) =>
  issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

const validate = (schema, property) => (req, res, next) => {
  const result = schema.safeParse(req[property]);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: formatIssues(result.error.issues),
    });
  }

  req[property] = result.data;
  return next();
};

export const validateBody = (schema) => validate(schema, 'body');
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: formatIssues(result.error.issues),
    });
  }

  req.validatedQuery = result.data;
  return next();
};
export const validateParams = (schema) => validate(schema, 'params');
