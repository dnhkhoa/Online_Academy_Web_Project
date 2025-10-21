export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.redirect("/account/signin");
  }
  next();
}
