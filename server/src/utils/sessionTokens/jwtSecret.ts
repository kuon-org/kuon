const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }

  return secret;
};

const JWT_SECRET = getJwtSecret();

export default JWT_SECRET;
