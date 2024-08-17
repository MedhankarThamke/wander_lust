const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router.get("/category/:details", (req, res) => {
  res.send("working!!!");
});

// show all listing and add listing
router.route("/").get(wrapAsync(listingController.index)).post(
  isLoggedIn,
  // validateListing,
  upload.single("listing[image]"),
  wrapAsync(listingController.createListing)
);

// add new listing
router.get("/new", isLoggedIn, listingController.renderNew);

// adding errror handling, showing the listing,update lsiting
// delete listing
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// eidt route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

// show category form
// listing / category / Rooms;

module.exports = router;
