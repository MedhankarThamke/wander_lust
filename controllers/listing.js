const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const allListing = await Listing.find({});
  res.render("listings/index.ejs", { allListing });
};

module.exports.renderNew = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested doesn't exist!");
    res.redirect("/listings");
  }
  // console.log(listing);

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  req.body.listing.location = req.body.listing.location.toLowerCase();

  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  // console.log(req.user);

  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = response.body.features[0].geometry;
  let savedListing = await newListing.save();
  // console.log(response.body.features[0].geometry);

  req.flash("success", "New listing saved!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested doesn't exist!");
    res.redirect("/listings");
  }
  let originalImage = listing.image.url;
  originalImage = originalImage.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImage });
};

// module.exports.updateListing = async (req, res) => {
//   let { id } = req.params;
//   let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }); //this is the destructing of lsiting object
//   if (typeof req.file !== "undefined") {
//     let url = req.file.path;
//     let filename = req.file.filename;
//     listing.image = { url, filename };
//     await listing.save();
//   }

//   req.flash("success", "Listing Updated!");
//   res.redirect(`/listings/${id}`);
// };

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  // Fetch the existing listing
  let listing = await Listing.findById(id);

  // If the location has changed, re-geocode the new location
  if (
    req.body.listing.location &&
    req.body.listing.location !== listing.location
  ) {
    let response = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location.toLowerCase(), // Convert to lowercase
        limit: 1,
      })
      .send();

    // Update the geometry with the new coordinates
    listing.geometry = response.body.features[0].geometry;
  }

  // Update the listing with new data
  listing.set({
    ...req.body.listing,
    location: req.body.listing.location.toLowerCase(), // Ensure lowercase
  });

  // If a new image is uploaded, update the image
  if (req.file) {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  // Save the updated listing
  await listing.save();

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.listingByCategory = async (req, res, next) => {
  try {
    const { details } = req.params;
    const listByCategory = await Listing.find({ category: details });

    res.render("listings/category.ejs", { details, listByCategory });
  } catch (err) {
    console.error("Error in listingByCategory:", err);
    res.status(500).send("Something went wrong! Please try again later.");
  }
};

module.exports.listingByLocation = async (req, res) => {
  try {
    let { destinationDetails } = req.body;
    destinationDetails = destinationDetails.toLowerCase();
    const listByLocation = await Listing.find({ location: destinationDetails });
    const successMessage = `Listings for location: ${destinationDetails}`;
    res.render("listings/location.ejs", {
      destinationDetails,
      listByLocation,
      successMessage,
    });
  } catch (err) {
    console.error("Error in listingBydestinationdetails:", err);
    res.status(500).send("Something went wrong! Please try again later.");
  }
};
