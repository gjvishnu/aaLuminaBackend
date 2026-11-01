const getValueAtPath = (input, path) =>
  path.reduce(
    (value, key) => (value === undefined || value === null ? undefined : value[key]),
    input,
  );

const formatPath = (path) =>
  path.reduce(
    (result, key) =>
      typeof key === 'number'
        ? `${result}[${key}]`
        : result
          ? `${result}.${key}`
          : key,
    '',
  );

const isMissingValue = (value, issue) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (issue.code === 'too_small' && Array.isArray(value) && value.length === 0);

const formatIssueMessage = (issue, value) => {
  if (isMissingValue(value, issue)) {
    return 'This field is required';
  }

  if (issue.code === 'invalid_format' && issue.format === 'uuid') {
    return 'Please provide a valid UUID';
  }

  if (issue.expected === 'date') {
    return 'Please provide a valid date';
  }

  if (issue.code === 'invalid_value') {
    return 'Please provide one of the allowed values';
  }

  return issue.message;
};

const createValidationResponse = (input, issues) => {
  const missingFields = [
    ...new Set(
      issues
        .filter((issue) => isMissingValue(getValueAtPath(input, issue.path), issue))
        .map((issue) => formatPath(issue.path)),
    ),
  ];

  return {
    message: missingFields.length
      ? `Please provide the required fields: ${missingFields.join(', ')}.`
      : 'Please check the provided values and try again.',
    errors: issues.map((issue) => ({
      path: formatPath(issue.path),
      message: formatIssueMessage(issue, getValueAtPath(input, issue.path)),
    })),
  };
};

const validate = (schema, property) => (req, res, next) => {
  const result = schema.safeParse(req[property]);

  if (!result.success) {
    return res.status(400).json(createValidationResponse(req[property], result.error.issues));
  }

  req[property] = result.data;
  return next();
};

export const validateBody = (schema) => validate(schema, 'body');
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json(createValidationResponse(req.query, result.error.issues));
  }

  req.validatedQuery = result.data;
  return next();
};
export const validateParams = (schema) => validate(schema, 'params');
