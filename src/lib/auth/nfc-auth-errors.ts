export function isUserAlreadyExistsError(error: {
  code?: string;
  message?: string;
}): boolean {
  const code = error.code?.toLowerCase() ?? "";
  const msg = error.message?.toLowerCase() ?? "";

  return (
    code === "user_already_exists" ||
    code === "email_exists" ||
    msg.includes("already") ||
    msg.includes("registered")
  );
}

/** Girişte hesap bulunamadığında signup sayfasına yönlendirme için */
export function isUserNotRegisteredError(error: {
  code?: string;
  message?: string;
}): boolean {
  const code = error.code?.toLowerCase() ?? "";
  const msg = error.message?.toLowerCase() ?? "";

  return (
    code === "user_not_found" ||
    msg.includes("user not found") ||
    msg.includes("not registered") ||
    msg.includes("no user")
  );
}
