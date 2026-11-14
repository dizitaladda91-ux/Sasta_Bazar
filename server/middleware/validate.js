export function validate(schemas) {
  return (req, res, next) => {
    const validated = {};
    for (const [location, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[location]);
      if (!result.success) {
        const errors = result.error.issues.flatMap((issue) => {
          if (issue.code === 'unrecognized_keys') {
            return issue.keys.map((key) => ({
              field: [...issue.path, key].join('.'),
              message: 'Unrecognized field.'
            }));
          }
          return [{
            field: issue.path.join('.') || location,
            message: issue.message
          }];
        });
        return res.status(400).json({
          success: false,
          message: errors.map(({ field, message }) => `${field}: ${message}`).join('; '),
          errors
        });
      }
      validated[location] = result.data;
      if (location === 'body' || location === 'params') req[location] = result.data;
    }
    req.validated = { ...req.validated, ...validated };
    return next();
  };
}
