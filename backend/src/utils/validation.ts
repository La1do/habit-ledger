const validationEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validationPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

export const validateEmail = (email: string): boolean => {
  return validationEmailRegex.test(email.trim());
};

export const validatePassword = (password: string): boolean => {
  return validationPasswordRegex.test(password);
};
