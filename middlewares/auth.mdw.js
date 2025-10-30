export function requireAuth(req, res, next) {
    if (req.session.isAuthenticated) {
      next();
    } else {
      req.session.retUrl = req.originalUrl;
      res.redirect('/account/signin');
    }
  }
  
  export function restrictAdmin(req, res, next) {
    if (req.session.authUser.role === "admin") {
      next();
    } else {
      res.status(403).render('403');
    }
  }
  
  export function restrictStudent(req, res, next) {
    if (req.session.authUser.role === "student") {
      next();
    } else {
      res.status(403).render('403');
    }
  }
  
  export function restrictInstructor(req, res, next) {
    if (req.session.authUser.role === "instructor") {
      next();
    } else {
      res.status(403).render('403');
    }
  }

  export function restrictInstructorAndAdmin(req, res, next) {
    if (req.session.authUser.role === "instructor" || req.session.authUser.role === "admin") {
      next();
    } else {
      res.status(403).render('403');
    }
  }
  
  