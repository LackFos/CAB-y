export const throwUnexpectedError = (command, msg) => {
  const error = new Error("Unexpected error: ");
  error.command = command;
  error.message = message;
  throw error;
};
